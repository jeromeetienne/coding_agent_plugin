import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Path from 'node:path';
import FsExtra from 'fs-extra';
import { OperationJournal } from '../src/operation/operation_journal.js';
import { StorageStream } from '../src/migration/storage_stream.js';
import { OperationVerification } from '../src/operation/operation_verification.js';
import { ProjectFiles } from '../src/operation/project_files.js';
import { RenameOperation } from '../src/operation/rename_operation.js';
import type { OperationRecord } from '../src/operation/operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticFaultWorker — faults at real copy, move, repair, and verification boundaries
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Executes the real operation in a separate process with one controlled fault. */
class SyntheticFaultWorker {
	/** Whether the one-shot fault has fired. */
	private static _isTriggered = false;

	/** @returns No value after persisting the resulting state or crashing only this test worker. */
	static async run(): Promise<void> {
		const [root, phase, mode] = process.argv.slice(2);
		const directory = Path.join(root, 'operation');
		Fs.mkdirSync(directory, {
			mode: 0o700,
		});
		const record: OperationRecord = {
			version: 1,
			id: Crypto.randomUUID(),
			options: {
				from: Path.join(root, 'project'),
				to: Path.join(root, 'renamed'),
				codexHome: Path.join(root, 'codex'),
				claudeHome: Path.join(root, 'claude'),
				claudeConfig: Path.join(root, 'claude', '.claude.json'),
				only: 'both',
			},
			directory,
			lock: Path.join(root, 'fault-worker.lock'),
			state: 'running',
			phase: 'checking-applications',
			updated: new Date().toISOString(),
			action: 'rename',
			counts: {
				codex: 0,
				claude: 0,
			},
			limitations: [],
			pid: process.pid,
		};
		Fs.writeFileSync(record.lock, directory);
		OperationJournal.write(record, record.phase);
		if (phase === 'before-writes') {
			this._fault(record, mode, 'before execute');
		}
		const rewrite = StorageStream.rewrite.bind(StorageStream);
		StorageStream.rewrite = (path, mapping, destination) => {
			const result = rewrite(path, mapping, destination);
			if (phase === 'staging-replacements' && destination !== undefined && this._isTriggered === false) {
				this._fault(record, mode, `replacement staging:${destination}`);
			}
			return result;
		};
		const renameSync = Fs.renameSync;
		Fs.renameSync = (source, destination) => {
			renameSync(source, destination);
			const isReplacement = String(source).includes('.migration-');
			if (isReplacement && this._isTriggered === false
				&& ((phase === 'replacing-files' && record.phase === 'migrating-conversations')
					|| (phase === 'restoring-conversations' && record.phase === 'restoring'))) {
				this._fault(record, mode, `atomic replacement:${destination}`);
			}
		};
		const descriptors = new Set<number>();
		const openSync = Fs.openSync;
		Fs.openSync = (...args: Parameters<typeof Fs.openSync>) => {
			const descriptor = openSync(...args);
			if (String(args[0]).startsWith(Path.join(directory, '.operation-'))) {
				descriptors.add(descriptor);
			}
			return descriptor;
		};
		const closeSync = Fs.closeSync;
		Fs.closeSync = (descriptor) => {
			descriptors.delete(descriptor);
			closeSync(descriptor);
		};
		const writeFileSync = Fs.writeFileSync;
		Fs.writeFileSync = (...args: Parameters<typeof Fs.writeFileSync>) => {
			if (phase === 'writing-journal' && record.phase === 'migrating-conversations'
				&& typeof args[0] === 'number' && descriptors.has(args[0]) && this._isTriggered === false) {
				this._fault(record, mode, 'journal writeFileSync before bytes are written');
			}
			writeFileSync(...args);
		};
		const copySync = FsExtra.copySync;
		FsExtra.copySync = (source, destination, options) => {
			copySync(source, destination, options);
			this._after(record, phase, mode, `copySync:${destination}`);
		};
		const moveSync = FsExtra.moveSync;
		FsExtra.moveSync = (source, destination, options) => {
			moveSync(source, destination, options);
			if (phase === 'moving-storage' && record.phase === 'migrating-conversations'
				&& this._isTriggered === false) {
				this._fault(record, mode, `storage directory move:${destination}`);
			}
			this._after(record, phase, mode, `moveSync:${destination}`);
		};
		const repair = ProjectFiles.repair.bind(ProjectFiles);
		ProjectFiles.repair = (root, worktrees, isRestore) => {
			repair(root, worktrees, isRestore);
			this._after(record, phase, mode, 'git worktree repair');
		};
		const verify = OperationVerification.verify.bind(OperationVerification);
		OperationVerification.verify = (current, isRestore) => {
			verify(current, isRestore);
			this._after(record, phase, mode, 'conversation verification');
		};
		await RenameOperation.execute(record);
		if (['restoring', 'restoring-conversations'].includes(phase) && record.state === 'complete') {
			record.action = 'restore';
			Fs.writeFileSync(record.lock, directory);
			await RenameOperation.execute(record);
		}
		if (this._isTriggered === false) {
			throw new Error(`Requested fault was not exercised: ${phase}`);
		}
		console.log(JSON.stringify({
			state: record.state,
			phase: record.phase,
			error: record.error,
			peakRssKiB: process.resourceUsage().maxRSS,
		}));
	}

	/**
	 * @param record Current real operation state.
	 * @param phase Requested durable phase.
	 * @param mode crash or disk.
	 * @param boundary Actual completed operation, before the phase advances.
	 * @returns No value unless this is the selected one-shot fault boundary.
	 */
	private static _after(record: OperationRecord, phase: string, mode: string, boundary: string): void {
		if (record.phase === phase && this._isTriggered === false) {
			this._fault(record, mode, boundary);
		}
	}

	/**
	 * @param record Last durable operation state.
	 * @param mode crash or disk.
	 * @param boundary Completed filesystem or verification operation.
	 * @returns No value after a concurrent mutation; otherwise kills this worker or injects ENOSPC.
	 */
	private static _fault(record: OperationRecord, mode: string, boundary: string): void {
		this._isTriggered = true;
		Fs.writeFileSync(Path.join(record.directory, 'fault.json'), JSON.stringify({
			pid: process.pid,
			phase: record.phase,
			boundary,
			mode,
			peakRssKiB: process.resourceUsage().maxRSS,
		}));
		if (['newer-project', 'destination', 'source-recreated'].includes(mode)) {
			const root = mode === 'destination' ? record.options.to : record.options.from;
			Fs.mkdirSync(root, {
				recursive: true,
			});
			Fs.writeFileSync(Path.join(root, 'newer.txt'), 'preserve newer synthetic work');
			return;
		}
		if (mode === 'newer-transcript') {
			const path = record.plan?.files.find((file) => file.path.endsWith('.jsonl'))?.path;
			if (path === undefined) {
				throw new Error('No synthetic transcript selected for concurrent change.');
			}
			const appended = JSON.stringify({
				type: 'user',
				cwd: record.options.from,
				message: {
					content: 'preserve newer synthetic conversation history',
				},
			}) + '\n';
			Fs.appendFileSync(path, appended);
			Fs.writeFileSync(Path.join(record.directory, 'mutation.json'), JSON.stringify({
				path,
				appended,
			}));
			return;
		}
		if (mode === 'crash') {
			process.kill(process.pid, 'SIGKILL');
		}
		throw Object.assign(new Error(`Injected ENOSPC after ${boundary}`), {
			code: 'ENOSPC',
		});
	}
}

await SyntheticFaultWorker.run();
