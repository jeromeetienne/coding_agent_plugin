import Fs from 'node:fs';
import Path from 'node:path';
import { OperationJournal } from './operation_journal.js';
import { RenameOperation } from './rename_operation.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OperationWorker — independent execution from a private operation directory
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Internal worker entry point, bundled before the project moves. */
class OperationWorker {
	static async run(): Promise<void> {
		const directory = process.argv[2];
		if (directory === undefined) {
			throw new Error('An operation directory is required.');
		}
		for (let attempt = 0; attempt < 100 && Fs.existsSync(Path.join(directory, 'launch.ready')) === false; attempt++) {
			await new Promise((resolveFn) => setTimeout(resolveFn, 100));
		}
		if (Fs.existsSync(Path.join(directory, 'launch.ready')) === false) {
			throw new Error('The launching process did not finish preparing the operation.');
		}
		const record = OperationJournal.read(directory);
		const result = await RenameOperation.execute(record);
		process.exitCode = result.state === 'complete' || (result.action === 'restore' && result.state === 'rolled_back')
			? 0 : 1;
	}
}

try {
	await OperationWorker.run();
} catch (error) {
	const directory = process.argv[2];
	if (directory !== undefined) {
		const record = OperationJournal.read(directory);
		record.error = error instanceof Error ? error.message : String(error);
		OperationJournal.write(record, 'worker-start-failed',
			record.action === 'restore' ? 'recovery_required' : 'failed');
		if (record.state === 'failed') {
			OperationJournal.release(record);
		}
	}
	process.exitCode = 1;
}
