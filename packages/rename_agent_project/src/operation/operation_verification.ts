import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import { StorageStream } from '../migration/storage_stream.js';
import { JsonRecords } from '../migration/json_records.js';
import { ConversationPlan } from '../migration/conversation_plan.js';
import type { MigrationPlan } from '../migration/migration_types.js';
import type { OperationRecord, VerificationRecord } from './operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OperationVerification — verify preserved records and discoverable conversations
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Verifies the exact stored changes, rather than only a count of updated directories. */
export class OperationVerification {
	/**
	 * @param plan Prepared migration after affected clients have been closed.
	 * @returns Expected index rows and unchanged Codex transcript checksums.
	 */
	static capture(plan: MigrationPlan): VerificationRecord {
		const record: VerificationRecord = {
			databases: [],
			transcripts: [],
		};
		for (const change of plan.databases) {
			const databaseSync = new Sqlite.DatabaseSync(change.path, {
				readOnly: true,
			});
			try {
				const ids = change.rows.map((row) => row.id);
				const rows = databaseSync.prepare('SELECT * FROM threads ORDER BY id').all()
					.filter((row) => ids.includes(String(row.id)));
				const before = this._hash(JSON.stringify(rows));
				for (const row of rows) {
					const selected = change.rows.find((entry) => entry.id === row.id);
					if (selected !== undefined) {
						const path = String(row.rollout_path);
						record.transcripts.push({
							path,
							hash: StorageStream.hash(path),
						});
						row.cwd = selected.after.cwd;
						row.sandbox_policy = selected.after.sandbox_policy;
					}
				}
				record.databases.push({
					path: change.path,
					ids,
					before,
					after: this._hash(JSON.stringify(rows)),
				});
			} finally {
				databaseSync.close();
			}
		}
		return record;
	}

	/**
	 * @param operation Recorded rename operation.
	 * @param isRestore Whether original metadata is expected.
	 * @returns No value after verifying selected metadata, files, and conversation discovery.
	 */
	static verify(operation: OperationRecord, isRestore = false): void {
		if (operation.plan === undefined || operation.verification === undefined) {
			throw new Error('Operation has no captured verification records.');
		}
		for (const database of operation.verification.databases) {
			const databaseSync = new Sqlite.DatabaseSync(database.path, {
				readOnly: true,
			});
			try {
				const rows = databaseSync.prepare('SELECT * FROM threads ORDER BY id').all()
					.filter((row) => database.ids === undefined || database.ids.includes(String(row.id)));
				const actual = this._hash(JSON.stringify(rows));
				if (actual !== (isRestore ? database.before : database.after)) {
					throw new Error(`Conversation metadata verification failed: ${database.path}`);
				}
			} finally {
				databaseSync.close();
			}
		}
		for (const transcript of operation.verification.transcripts) {
			if (operation.plan.files.some((file) => file.path === transcript.path)) {
				continue;
			}
			if (StorageStream.hash(transcript.path) !== transcript.hash) {
				throw new Error(`A Codex transcript changed unexpectedly: ${transcript.path}`);
			}
		}
		for (const file of operation.plan.files) {
			let path = file.path;
			if (isRestore === false) {
				for (const move of operation.plan.moves) {
					path = ConversationPlan.replace(path, move);
				}
			}
			const expected = 'before' in file ? (isRestore ? file.before : file.after)
				: JsonRecords.hash(isRestore ? file.original : file.updated);
			if (StorageStream.hash(path) !== expected) {
				throw new Error(`Migrated file verification failed: ${path}`);
			}
		}
		const expectedRoot = isRestore ? operation.options.from : operation.options.to;
		const otherRoot = isRestore ? operation.options.to : operation.options.from;
		const discovered = ConversationPlan.build({
			...operation.options,
			from: expectedRoot,
			to: otherRoot,
		}).conversations;
		const identities = new Set(discovered.map((conversation) => `${conversation.application}:${conversation.id}`));
		const isMissing = operation.plan.conversations.some((conversation) =>
			identities.has(`${conversation.application}:${conversation.id}`) === false);
		if (isMissing) {
			throw new Error('The expected conversations are not discoverable under the final directory.');
		}
	}

	private static _hash(value: string | Uint8Array): string {
		return Crypto.createHash('sha256').update(value).digest('hex');
	}
}
