import Crypto from 'node:crypto';
import Fs from 'node:fs';
import type { FileChange, FileEdit, JsonObject, JsonValue } from './migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	JsonRecords — parses stored JSON values and checks object boundaries
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Reads JSON without exposing untyped values to migration code. */
export class JsonRecords {
	/**
	 * @param path Original file path.
	 * @param original Original file text.
	 * @param updated Replacement file text.
	 * @returns Compact replacements and checksums, without retaining complete file text.
	 */
	static changes(path: string, original: string, updated: string): FileChange {
		const before = original.split('\n');
		const after = updated.split('\n');
		const edits: FileEdit[] = [];
		let offset = 0;
		const originals = before.length === after.length ? before : [original];
		const replacements = before.length === after.length ? after : [updated];
		for (const [index, text] of originals.entries()) {
			const replacement = replacements[index];
			if (text !== replacement) {
				let start = 0;
				while (start < text.length && start < replacement.length && text[start] === replacement[start]) {
					start++;
				}
				let end = text.length;
				let tail = replacement.length;
				while (end > start && tail > start && text[end - 1] === replacement[tail - 1]) {
					end--;
					tail--;
				}
				edits.push({
					start: offset + start,
					end: offset + end,
					value: replacement.slice(start, tail),
				});
			}
			offset += text.length + 1;
		}
		return {
			path,
			before: this.hash(original),
			after: this.hash(updated),
			edits,
		};
	}

	/**
	 * @param file Planned replacement, including older complete-text plans.
	 * @param isOriginal Whether to return original rather than replacement text.
	 * @returns Checked text for one file only.
	 */
	static content(file: FileChange, isOriginal = false): string {
		if ('rewrite' in file) {
			throw new Error('Record transformations must use incremental storage processing.');
		}
		if ('edits' in file === false) {
			return isOriginal ? file.original : file.updated;
		}
		const original = Fs.readFileSync(file.path, 'utf8');
		if (this.hash(original) !== file.before) {
			throw new Error(`File changed since migration planning; refusing to overwrite: ${file.path}`);
		}
		if (isOriginal) {
			return original;
		}
		const parts: string[] = [];
		let offset = 0;
		for (const edit of file.edits) {
			if (edit.start < offset || edit.end < edit.start || edit.end > original.length) {
				throw new Error(`Invalid planned replacement: ${file.path}`);
			}
			parts.push(original.slice(offset, edit.start), edit.value);
			offset = edit.end;
		}
		parts.push(original.slice(offset));
		const updated = parts.join('');
		if (this.hash(updated) !== file.after) {
			throw new Error(`Planned replacement checksum failed: ${file.path}`);
		}
		return updated;
	}

	/**
	 * @param value File text or bytes.
	 * @returns SHA-256 checksum of the UTF-8 file contents.
	 */
	static hash(value: string | Uint8Array): string {
		return Crypto.createHash('sha256').update(value).digest('hex');
	}

	/**
	 * @param value Serialized JSON value.
	 * @returns The parsed JSON value.
	 */
	static parse(value: string): JsonValue {
		return JSON.parse(value) as JsonValue;
	}

	/**
	 * @param value Parsed JSON value that should be an object.
	 * @param source Description used when the value has the wrong shape.
	 * @returns The checked JSON object.
	 */
	static object(value: JsonValue | undefined, source: string): JsonObject {
		if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error(`Expected a JSON object in ${source}.`);
		}
		return value;
	}
}
