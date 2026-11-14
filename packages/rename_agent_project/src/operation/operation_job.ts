import ChildProcess from 'node:child_process';
import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Path from 'node:path';
import Esbuild from 'esbuild';
import { ConversationPlan } from '../migration/conversation_plan.js';
import { MigrationStorage } from '../migration/migration_storage.js';
import { OperationJournal } from './operation_journal.js';
import { ProjectFiles } from './project_files.js';
import type { OperationOptions, OperationRecord } from './operation_types.js';

const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OperationJob — launch a self-contained independent rename worker
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Launches work outside the renamed folder and exposes its durable progress. */
export class OperationJob {
	/**
	 * @param options Project, storage, and optional backup paths.
	 * @returns The private operation directory, with a worker running independently.
	 */
	static start(options: OperationOptions): string {
		ProjectFiles.validate(options);
		const plan = ConversationPlan.build(options);
		const id = Crypto.randomUUID();
		const directory = options.backup ?? Path.join(Path.dirname(options.from), `.rename_agent_project-${id}`);
		if (Path.isAbsolute(directory) === false || Path.normalize(directory) !== directory) {
			throw new Error('The backup must be a normalized absolute directory.');
		}
		ProjectFiles.safePath(Path.dirname(directory));
		for (const root of [options.from, options.to, options.codexHome, options.claudeHome]) {
			if (ConversationPlan.contains(directory, root) || ConversationPlan.contains(root, directory)) {
				throw new Error('The operation backup must remain outside project and application storage.');
			}
		}
		if (Fs.existsSync(directory)) {
			throw new Error(`Backup directory already exists: ${directory}`);
		}
		const hash = Crypto.createHash('sha256').update(options.from).digest('hex').slice(0, 20);
		const lock = Path.join(Path.dirname(options.from), `.rename_agent_project-${hash}.lock`);
		try {
			Fs.writeFileSync(lock, directory, {
				flag: 'wx',
				mode: 0o600,
			});
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
				throw new Error(`A rename or interrupted operation already holds the lock: ${lock}`);
			}
			throw error;
		}
		try {
			Fs.mkdirSync(directory, {
				mode: 0o700,
			});
			const record: OperationRecord = {
				version: 1,
				id,
				options,
				directory,
				lock,
				state: 'queued',
				phase: 'preparing-worker',
				updated: new Date().toISOString(),
				action: 'rename',
				counts: {
					codex: plan.conversations.filter((entry) => entry.application === 'Codex').length,
					claude: plan.conversations.filter((entry) => entry.application === 'Claude Code').length,
				},
				limitations: [
					'Embedded paths in instructions, launchers, skill links, and editor workspaces are not rewritten.',
					'Desktop and editor integrations are outside the command-line support scope.',
				],
			};
			OperationJournal.write(record, record.phase);
			this._spawn(record);
			return directory;
		} catch (error) {
			if (Fs.existsSync(Path.join(directory, 'operation.json'))) {
				const record = OperationJournal.read(directory);
				record.error = error instanceof Error ? error.message : String(error);
				OperationJournal.write(record, 'worker-start-failed', 'failed');
			}
			if (Fs.existsSync(lock) && Fs.readFileSync(lock, 'utf8') === directory) {
				Fs.unlinkSync(lock);
			}
			throw error;
		}
	}

	/**
	 * @param directory Private operation directory.
	 * @returns Durable status, recording unexpected worker exit without changing project data.
	 */
	static status(directory: string): OperationRecord {
		let record = OperationJournal.read(directory);
		if ((record.state !== 'queued' && record.state !== 'running') || record.pid === undefined
			|| this._isAlive(record.pid)) {
			return record;
		}
		record = OperationJournal.read(directory);
		if ((record.state !== 'queued' && record.state !== 'running') || record.pid === undefined
			|| this._isAlive(record.pid)) {
			return record;
		}
		const isBeforeWrites = record.action === 'rename' && record.original === undefined
			&& ['preparing-worker', 'worker-starting', 'checking-applications', 'waiting-for-clients', 'clients-closed']
				.includes(record.phase);
		record.recoveryPhase ??= record.phase;
		record.error = `The operation worker exited unexpectedly during ${record.phase}. `
			+ `Inspect ${Path.join(directory, 'worker.log')}. `
			+ (isBeforeWrites ? 'No project or conversation changes started; the project lock was released.'
				: 'Preserve this operation directory and use --restore to inspect checked recovery.');
		record.waitingFor = undefined;
		OperationJournal.write(record, 'worker-exited', isBeforeWrites ? 'failed' : 'recovery_required');
		if (isBeforeWrites) {
			OperationJournal.release(record);
		}
		return record;
	}

	/**
	 * @param directory Existing operation directory.
	 * @param isApply Whether to launch restoration rather than preview it.
	 * @returns The recorded operation, possibly queued for restoration.
	 */
	static restore(directory: string, isApply: boolean): OperationRecord {
		const record = OperationJournal.read(directory);
		if (record.original === undefined) {
			throw new Error('This operation did not capture project data to restore.');
		}
		if (record.state === 'queued' || record.state === 'running') {
			if (record.pid !== undefined && this._isAlive(record.pid)) {
				throw new Error('The operation worker is still running; inspect its status before restoring.');
			}
		}
		const current = Fs.existsSync(record.options.from) ? record.options.from : record.options.to;
		ProjectFiles.verify(current, record.original, true);
		const migration = Path.join(directory, 'migration');
		if (Fs.existsSync(Path.join(migration, 'manifest.json'))) {
			MigrationStorage.restore(migration, false);
		}
		if (isApply) {
			if (Fs.existsSync(record.lock)) {
				if (Fs.readFileSync(record.lock, 'utf8') !== directory) {
					throw new Error('Another operation holds the project lock.');
				}
			} else {
				Fs.writeFileSync(record.lock, directory, {
					flag: 'wx',
					mode: 0o600,
				});
			}
			try {
				record.recoveryPhase ??= record.phase;
				record.action = 'restore';
				OperationJournal.write(record, 'preparing-restore-worker', 'queued');
				this._spawn(record);
			} catch (error) {
				record.error = error instanceof Error ? error.message : String(error);
				OperationJournal.write(record, 'restore-worker-start-failed', 'recovery_required');
				throw error;
			}
		}
		return record;
	}

	/**
	 * @param directory Private operation directory.
	 * @param progressFn Optional notification when manual action is required.
	 * @param timeout Maximum wait in milliseconds before returning current progress.
	 * @param activityFn Optional activity display refreshed while the independent worker runs.
	 * @returns Current or terminal progress; the worker continues if the caller disconnects.
	 */
	static async wait(
		directory: string,
		timeout = 900000,
		progressFn?: (record: OperationRecord) => void,
		activityFn?: (record: OperationRecord) => void,
	): Promise<OperationRecord> {
		const deadline = Date.now() + timeout;
		let record = this.status(directory);
		let previous = '';
		while ((record.state === 'queued' || record.state === 'running') && Date.now() < deadline) {
			const current = JSON.stringify(record.waitingFor ?? []);
			if (record.waitingFor !== undefined && previous !== current) {
				progressFn?.(record);
			}
			activityFn?.(record);
			previous = current;
			await new Promise((resolveFn) => setTimeout(resolveFn, 200));
			record = this.status(directory);
		}
		return record;
	}

	/** Bundle worker code outside the project and publish its process identifier before execution. */
	private static _spawn(record: OperationRecord): void {
		const ready = Path.join(record.directory, 'launch.ready');
		if (Fs.existsSync(ready)) {
			Fs.unlinkSync(ready);
		}
		Esbuild.buildSync({
			entryPoints: [Path.join(__dirname, 'operation_worker.ts')],
			outfile: Path.join(record.directory, 'worker.mjs'),
			bundle: true,
			format: 'esm',
			banner: {
				js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
			},
			platform: 'node',
			target: 'node24',
			logLevel: 'silent',
		});
		const log = Fs.openSync(Path.join(record.directory, 'worker.log'), 'a', 0o600);
		try {
			const childProcess = ChildProcess.spawn(process.execPath, [
				Path.join(record.directory, 'worker.mjs'),
				record.directory,
			], {
				cwd: record.directory,
				detached: true,
				stdio: ['ignore', log, log],
			});
			if (childProcess.pid === undefined) {
				throw new Error('The independent operation worker could not start.');
			}
			record.pid = childProcess.pid;
			OperationJournal.write(record, 'worker-starting', 'queued');
			Fs.writeFileSync(ready, 'ready\n', {
				mode: 0o600,
			});
			childProcess.unref();
		} finally {
			Fs.closeSync(log);
		}
	}

	/** Check whether a recorded worker process still exists before recovery. */
	private static _isAlive(pid: number): boolean {
		try {
			process.kill(pid, 0);
			return true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
				return false;
			}
			throw error;
		}
	}
}
