import Fs from 'node:fs';
import Path from 'node:path';
import Crypto from 'node:crypto';
import type { OperationRecord, OperationState } from './operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OperationJournal — atomic durable progress outside the project
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Persists operation progress for detached execution and recovery. */
export class OperationJournal {
	/**
	 * @param directory Private operation directory.
	 * @returns The recorded operation.
	 */
	static read(directory: string): OperationRecord {
		const record = JSON.parse(Fs.readFileSync(Path.join(directory, 'operation.json'), 'utf8')) as OperationRecord;
		if (record.version !== 1 || Path.resolve(record.directory) !== Path.resolve(directory)) {
			throw new Error('Unsupported or relocated operation record.');
		}
		return record;
	}

	/**
	 * @param record Operation to persist.
	 * @param phase Current step.
	 * @param state Optional new overall result.
	 * @returns No value.
	 */
	static write(record: OperationRecord, phase: string, state: OperationState = record.state): void {
		record.phase = phase;
		record.state = state;
		record.updated = new Date().toISOString();
		const temporary = Path.join(record.directory, `.operation-${Crypto.randomUUID()}.json`);
		const descriptor = Fs.openSync(temporary, 'wx', 0o600);
		try {
			Fs.writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`);
			Fs.fsyncSync(descriptor);
		} finally {
			Fs.closeSync(descriptor);
		}
		Fs.renameSync(temporary, Path.join(record.directory, 'operation.json'));
	}

	/**
	 * @param record Operation whose lock can be released.
	 * @returns No value.
	 */
	static release(record: OperationRecord): void {
		if (Fs.existsSync(record.lock) && Fs.readFileSync(record.lock, 'utf8') === record.directory) {
			Fs.unlinkSync(record.lock);
		}
	}
}
