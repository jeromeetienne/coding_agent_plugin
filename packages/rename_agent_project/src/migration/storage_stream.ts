import Crypto from 'node:crypto';
import Fs from 'node:fs';
import { JsonRecords } from './json_records.js';
import type { FileHashes, JsonObject, RecordRewrite } from './migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	StorageStream — reads records and checks file contents in bounded blocks
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Processes transcript records without retaining complete files. */
export class StorageStream {
	/**
	 * @param path File to inspect.
	 * @returns SHA-256 checksum calculated with a fixed-size buffer.
	 */
	static hash(path: string): string {
		const descriptor = Fs.openSync(path, 'r');
		try {
			const hash = Crypto.createHash('sha256');
			const buffer = Buffer.alloc(65536);
			let length: number;
			while ((length = Fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
				hash.update(buffer.subarray(0, length));
			}
			return hash.digest('hex');
		} finally {
			Fs.closeSync(descriptor);
		}
	}

	/**
	 * @param path Transcript or history file.
	 * @returns Raw records, including original line endings and the final unterminated record.
	 */
	static *lines(path: string): Generator<Buffer> {
		const descriptor = Fs.openSync(path, 'r');
		try {
			let parts: Buffer[] = [];
			while (true) {
				const buffer = Buffer.allocUnsafe(65536);
				const length = Fs.readSync(descriptor, buffer, 0, buffer.length, null);
				if (length === 0) {
					break;
				}
				let start = 0;
				let end: number;
				while ((end = buffer.indexOf(10, start)) >= 0 && end < length) {
					parts.push(buffer.subarray(start, end + 1));
					yield parts.length === 1 ? parts[0] : Buffer.concat(parts);
					parts = [];
					start = end + 1;
				}
				if (start < length) {
					parts.push(buffer.subarray(start, length));
				}
			}
			if (parts.length > 0) {
				yield Buffer.concat(parts);
			}
		} finally {
			Fs.closeSync(descriptor);
		}
	}

	/**
	 * @param path Transcript or history file.
	 * @returns Parsed nonempty records one at a time.
	 */
	static *records(path: string): Generator<JsonObject> {
		let index = 0;
		for (const bytes of this.lines(path)) {
			index++;
			const line = bytes.toString('utf8');
			if (line.trim().length === 0) {
				continue;
			}
			try {
				yield JsonRecords.object(JsonRecords.parse(line), path);
			} catch {
				throw new Error(`Invalid JSON in ${path}, record ${index}; no changes were made.`);
			}
		}
	}

	/**
	 * @param path Original record file.
	 * @param rewrite Selected field and complete path-prefix replacements.
	 * @param destination Optional new private replacement file; omitted for read-only planning.
	 * @returns Original and replacement checksums without retaining record contents.
	 */
	static rewrite(path: string, rewrite: RecordRewrite, destination?: string): FileHashes {
		const descriptor = destination === undefined ? undefined : Fs.openSync(destination, 'wx', 0o600);
		try {
			const before = Crypto.createHash('sha256');
			const after = Crypto.createHash('sha256');
			let index = 0;
			for (const bytes of this.lines(path)) {
				index++;
				before.update(bytes);
				const updated = this._record(bytes, path, index, rewrite);
				after.update(updated);
				if (descriptor !== undefined) {
					this._write(descriptor, updated);
				}
			}
			if (descriptor !== undefined) {
				Fs.fsyncSync(descriptor);
			}
			return {
				before: before.digest('hex'),
				after: after.digest('hex'),
			};
		} catch (error) {
			if (destination !== undefined) {
				Fs.rmSync(destination, {
					force: true,
				});
			}
			throw error;
		} finally {
			if (descriptor !== undefined) {
				Fs.closeSync(descriptor);
			}
		}
	}

	/** Transform only the selected top-level path field and preserve all unrelated record bytes. */
	private static _record(bytes: Buffer, path: string, index: number, rewrite: RecordRewrite): Buffer {
		const line = bytes.toString('utf8');
		if (line.trim().length === 0) {
			return bytes;
		}
		let record: JsonObject;
		try {
			record = JsonRecords.object(JsonRecords.parse(line), path);
		} catch {
			throw new Error(`Invalid JSON in ${path}, record ${index}; no changes were made.`);
		}
		const original = record[rewrite.field];
		if (typeof original !== 'string') {
			return bytes;
		}
		let updated = original;
		for (const mapping of rewrite.mappings) {
			if (updated === mapping.from || updated.startsWith(`${mapping.from}/`)) {
				updated = mapping.to + updated.slice(mapping.from.length);
			}
		}
		if (updated === original) {
			return bytes;
		}
		record[rewrite.field] = updated;
		const ending = line.endsWith('\r\n') ? '\r\n' : line.endsWith('\n') ? '\n' : line.endsWith('\r') ? '\r' : '';
		return Buffer.from(JSON.stringify(record) + ending);
	}

	/** Write all bytes even when the operating system accepts only part of a record. */
	private static _write(descriptor: number, bytes: Buffer): void {
		let offset = 0;
		while (offset < bytes.length) {
			const length = Fs.writeSync(descriptor, bytes, offset, bytes.length - offset);
			if (length === 0) {
				throw new Error('Cannot finish writing a replacement record.');
			}
			offset += length;
		}
	}
}
