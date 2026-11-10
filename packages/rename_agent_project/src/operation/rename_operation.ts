import Fs from 'node:fs';
import Path from 'node:path';
import type { MigrationPlan } from '../migration/migration_types.js';
import { ConversationPlan } from '../migration/conversation_plan.js';
import { MigrationStorage } from '../migration/migration_storage.js';
import { AgentProcesses } from './agent_processes.js';
import { OperationJournal } from './operation_journal.js';
import { OperationVerification } from './operation_verification.js';
import { ProjectFiles } from './project_files.js';
import type { CheckpointFn, OperationOptions, OperationRecord } from './operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	RenameOperation — recoverable folder rename with conversation migration
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Runs a journalled rename independently from the initiating application. */
export class RenameOperation {
	/**
	 * @param record Durable operation state.
	 * @param checkpointFn Optional deterministic checkpoint for failure testing.
	 * @returns Terminal operation state, including checked rollback on failure.
	 */
	static async execute(record: OperationRecord, checkpointFn?: CheckpointFn): Promise<OperationRecord> {
		try {
			OperationJournal.write(record, 'checking-applications', 'running');
			if (record.action === 'restore') {
				const current = Fs.existsSync(record.options.from) ? record.options.from : record.options.to;
				const plan = record.plan ?? ConversationPlan.build(record.options);
				await this._wait(record, {
					...record.options,
					from: current,
					to: current === record.options.from ? record.options.to : record.options.from,
				}, {
					...plan,
					moves: plan.moves.map((move) => ({
						from: Fs.existsSync(move.from) ? move.from : move.to,
						to: move.to,
					})),
				});
				this._restore(record);
				return record;
			}
			ProjectFiles.validate(record.options);
			await this._wait(record, record.options, ConversationPlan.build(record.options));
			record.plan = ConversationPlan.build(record.options);
			record.counts = {
				codex: record.plan.conversations.filter((entry) => entry.application === 'Codex').length,
				claude: record.plan.conversations.filter((entry) => entry.application === 'Claude Code').length,
			};
			record.original = ProjectFiles.snapshot(record.options.from);
			record.worktrees = ProjectFiles.worktrees(record.options);
			record.verification = OperationVerification.capture(record.plan);
			this._checkpoint(record, 'backing-up-project', checkpointFn);
			ProjectFiles.backup(record.options.from, Path.join(record.directory, 'project'), record.original);
			this._checkpoint(record, 'migrating-conversations', checkpointFn);
			AgentProcesses.assertReady(record.options, record.plan);
			MigrationStorage.apply(record.plan, Path.join(record.directory, 'migration'));
			this._checkpoint(record, 'renaming-project', checkpointFn);
			ProjectFiles.verify(record.options.from, record.original);
			if (Fs.existsSync(record.options.to)) {
				throw new Error('Destination appeared during the operation; refusing to overwrite it.');
			}
			AgentProcesses.assertReady(record.options, record.plan);
			Fs.renameSync(record.options.from, record.options.to);
			record.renamed = ProjectFiles.snapshot(record.options.to);
			this._checkpoint(record, 'repairing-worktrees', checkpointFn);
			ProjectFiles.repair(record.options.to, record.worktrees);
			record.renamed = ProjectFiles.snapshot(record.options.to);
			this._checkpoint(record, 'verifying-result', checkpointFn);
			ProjectFiles.verify(record.options.to, record.original, true);
			OperationVerification.verify(record);
			if (Fs.existsSync(record.options.from)) {
				throw new Error('The original project path was recreated during the operation.');
			}
			OperationJournal.write(record, 'verified', 'complete');
		} catch (error) {
			record.error = error instanceof Error ? error.message : String(error);
			OperationJournal.write(record, record.phase, record.action === 'restore' ? 'recovery_required' : 'failed');
			if (record.original !== undefined && record.action !== 'restore') {
				try {
					this._restore(record);
				} catch (restoreError) {
					record.error += ` Recovery stopped: ${String(restoreError)}`;
					OperationJournal.write(record, 'recovery-stopped', 'recovery_required');
				}
			}
		} finally {
			if (record.state !== 'recovery_required') {
				OperationJournal.release(record);
			}
		}
		return record;
	}

	/**
	 * @param record Durable progress displayed by the terminal command.
	 * @param options Current project location and storage.
	 * @param plan Selected conversations and existing transcript locations.
	 * @returns No value after manual client closure and selected task completion.
	 */
	private static async _wait(record: OperationRecord, options: OperationOptions, plan: MigrationPlan): Promise<void> {
		await AgentProcesses.waitUntilClosed(options, plan, (messages) => {
			record.waitingFor = messages;
			OperationJournal.write(record, 'waiting-for-clients', 'running');
		});
		record.waitingFor = undefined;
		OperationJournal.write(record, 'clients-closed', 'running');
	}

	/** Return unchanged project and conversation targets to the recorded original state. */
	private static _restore(record: OperationRecord): void {
		if (record.original === undefined) {
			throw new Error('No project snapshot is available for checked restoration.');
		}
		const current = Fs.existsSync(record.options.from) ? record.options.from : record.options.to;
		if (record.plan !== undefined) {
			AgentProcesses.assertReady({
				...record.options,
				from: current,
			}, {
				...record.plan,
				moves: record.plan.moves.map((move) => ({
					...move,
					from: Fs.existsSync(move.from) ? move.from : move.to,
				})),
			});
		}
		const phase = record.phase;
		OperationJournal.write(record, 'restoring', 'running');
		const isOriginal = Fs.existsSync(record.options.from);
		if (isOriginal === false) {
			ProjectFiles.verify(record.options.to, record.original, true);
			if (record.renamed !== undefined && phase !== 'repairing-worktrees') {
				ProjectFiles.verify(record.options.to, record.renamed);
			}
			Fs.renameSync(record.options.to, record.options.from);
			ProjectFiles.repair(record.options.from, record.worktrees ?? [], true);
		} else {
			ProjectFiles.verify(record.options.from, record.original, true);
		}
		const migration = Path.join(record.directory, 'migration');
		if (Fs.existsSync(Path.join(migration, 'manifest.json'))) {
			MigrationStorage.restore(migration, true);
		}
		ProjectFiles.verify(record.options.from, record.original, true);
		OperationVerification.verify(record, true);
		OperationJournal.write(record, 'original-state-verified', 'rolled_back');
	}

	/** Persist a phase before running an optional failure-test callback. */
	private static _checkpoint(record: OperationRecord, phase: string, checkpointFn?: CheckpointFn): void {
		OperationJournal.write(record, phase);
		checkpointFn?.(phase);
	}
}
