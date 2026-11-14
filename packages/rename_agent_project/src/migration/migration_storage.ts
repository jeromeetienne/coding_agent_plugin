import Crypto from 'node:crypto';
import Fs from 'node:fs';
import FsExtra from 'fs-extra';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import { StorageStream } from './storage_stream.js';
import { JsonRecords } from './json_records.js';
import { ConversationPlan } from './conversation_plan.js';
import type {
	BackupManifest,
	BackupMove,
	FileChange,
	MigrationPlan,
	OpenDatabase,
	TreeReplacement,
} from './migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MigrationStorage — applies checked changes and restores private backups
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Applies a prepared migration with backups and optimistic rollback checks. */
export class MigrationStorage {
	/**
	 * @param plan Prepared changes from ConversationPlan.
	 * @param backup New backup directory outside project and application storage.
	 * @returns Writes a manifest before changing any conversation data.
	 */
	static apply(plan: MigrationPlan, backup: string): void {
		this._safePath(Path.dirname(backup));
		const manifest: BackupManifest = {
			version: 1,
			from: plan.from,
			to: plan.to,
			files: plan.files.map((file, index) => ({
				path: file.path,
				backup: `file_${index}`,
				before: 'before' in file ? file.before : JsonRecords.hash(file.original),
				after: 'before' in file ? file.after : JsonRecords.hash(file.updated),
				mode: Fs.statSync(file.path).mode & 0o777,
			})),
			moves: plan.moves.map((move) => ({
				...move,
				before: this._tree(move.from),
				after: this._tree(move.from, plan.files.map((file) => ({
					path: file.path,
					hash: 'before' in file ? file.after : JsonRecords.hash(file.updated),
				}))),
			})),
			databases: plan.databases,
		};
		this._checkFiles(manifest, false);
		this._checkMoves(manifest, false);
		const databases = this._openDatabases(manifest, false);
		try {
			Fs.mkdirSync(backup, {
				mode: 0o700,
			});
			for (const [index, file] of plan.files.entries()) {
				const original = Path.join(backup, manifest.files[index].backup);
				FsExtra.copySync(file.path, original, {
					preserveTimestamps: true,
					overwrite: false,
					errorOnExist: true,
				});
				Fs.chmodSync(original, 0o600);
				this._prepare(file, Path.join(backup, `replacement_${index}`));
			}
			for (const [index, move] of manifest.moves.entries()) {
				FsExtra.copySync(move.from, Path.join(backup, `project_${index}`), {
					preserveTimestamps: true,
					overwrite: false,
					errorOnExist: true,
					dereference: false,
				});
			}
			this._manifest(backup, manifest);
			this.verifyBackup(backup);
			for (const [index, file] of manifest.files.entries()) {
				this._replace(file.path, Path.join(backup, `replacement_${index}`), file.after, [file.before]);
			}
			for (const move of manifest.moves) {
				if (this._tree(move.from) !== move.after || Fs.existsSync(move.to)) {
					throw new Error(`Storage changed while migrating: ${move.from}`);
				}
				FsExtra.moveSync(move.from, move.to, {
					overwrite: false,
				});
			}
			this._updateDatabases(databases, false);
			console.log(`Migration complete. Rollback backup: ${backup}`);
		} catch (error) {
			if (Fs.existsSync(Path.join(backup, 'manifest.json'))) {
				console.error(`Migration stopped. Preserve the backup and run --restore ${backup}.`);
			} else {
				console.error('Backup preparation failed; no conversation data was changed.');
			}
			throw error;
		} finally {
			this._closeDatabases(databases);
		}
	}

	/**
	 * @param backup Directory created by apply.
	 * @param isApply Whether to perform restoration instead of previewing.
	 * @returns Restores only unchanged migration output; newer work causes refusal.
	 */
	static restore(backup: string, isApply: boolean): void {
		const manifest = JSON.parse(Fs.readFileSync(Path.join(backup, 'manifest.json'), 'utf8')) as BackupManifest;
		if (manifest.version !== 1 || Array.isArray(manifest.files) === false) {
			throw new Error('Unsupported backup manifest.');
		}
		for (const file of manifest.files) {
			if (StorageStream.hash(Path.join(backup, file.backup)) !== file.before) {
				throw new Error(`Backup file failed its checksum: ${file.backup}`);
			}
		}
		this._checkMoves(manifest, true);
		this._checkFiles(manifest, true);
		const databases = this._openDatabases(manifest, true, isApply === false);
		try {
			console.log(`Restore ${manifest.files.length} files and ${manifest.moves.length} project directories.`);
			if (isApply === false) {
				console.log('Storage restoration preview only; no data changed.');
				return;
			}
			for (const move of [...manifest.moves].reverse()) {
				if (Fs.existsSync(move.to)) {
					FsExtra.moveSync(move.to, move.from, {
						overwrite: false,
					});
				}
			}
			for (const file of manifest.files) {
				this._replace(file.path, Path.join(backup, file.backup), file.before, [file.before, file.after]);
				Fs.chmodSync(file.path, file.mode);
			}
			this._updateDatabases(databases, true);
			console.log('Original conversation metadata restored. The project folder was not renamed.');
		} finally {
			this._closeDatabases(databases);
		}
	}

	/**
	 * @param backup Private migration backup directory.
	 * @returns No value; rejects unreadable or incomplete backup copies before migration writes.
	 */
	static verifyBackup(backup: string): void {
		const manifest = JSON.parse(Fs.readFileSync(Path.join(backup, 'manifest.json'), 'utf8')) as BackupManifest;
		for (const file of manifest.files) {
			this._assertHash(Path.join(backup, file.backup), file.before);
		}
		for (const [index, move] of manifest.moves.entries()) {
			if (this._tree(Path.join(backup, `project_${index}`)) !== move.before) {
				throw new Error('Migration backup directory failed verification.');
			}
		}
	}

	/**
	 * Refuse changed files before a migration or restoration.
	 * @param manifest Backup manifest.
	 * @param isRestore Whether this is restoration.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _checkFiles(manifest: BackupManifest, isRestore: boolean): void {
		for (const file of manifest.files) {
			let path = file.path;
			if (isRestore) {
				for (const move of manifest.moves) {
					if (ConversationPlan.contains(path, move.from) && Fs.existsSync(move.to)) {
						path = move.to + path.slice(move.from.length);
						break;
					}
				}
			}
			this._safePath(path);
			const hash = StorageStream.hash(path);
			if (hash !== file.before && (isRestore === false || hash !== file.after)) {
				throw new Error(`File changed since migration planning; refusing to overwrite: ${path}`);
			}
		}
	}

	/**
	 * Verify directory conflicts and recorded contents.
	 * @param manifest Backup manifest.
	 * @param isRestore Whether this is restoration.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _checkMoves(manifest: BackupManifest, isRestore: boolean): void {
		for (const move of manifest.moves) {
			this._safePath(Path.dirname(move.to));
			const isSource = Fs.existsSync(move.from);
			const isDestination = Fs.existsSync(move.to);
			if (isSource === isDestination || (isRestore === false && isDestination)) {
				throw new Error(`Project directory conflict: ${move.from} -> ${move.to}`);
			}
			const path = isSource ? move.from : move.to;
			const hash = this._tree(path);
			if (hash !== move.before && (isRestore === false || hash !== move.after)) {
				if (isRestore === false || isSource === false || this._partialTree(move, manifest) === false) {
					throw new Error(`Project contents changed; refusing to overwrite: ${path}`);
				}
			}
		}
	}

	/**
	 * Recognize a directory with only a partial set of migration writes.
	 * @param move Directory move.
	 * @param manifest Backup manifest.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _partialTree(move: BackupMove, manifest: BackupManifest): boolean {
		const files = manifest.files.filter((file) => ConversationPlan.contains(file.path, move.from));
		for (const file of files) {
			const hash = StorageStream.hash(file.path);
			if (hash !== file.before && hash !== file.after) {
				return false;
			}
		}
		const replacements = files.map((file) => ({
			path: file.path,
			hash: file.before,
		}));
		return this._tree(move.from, replacements) === move.before;
	}

	/**
	 * Check affected rows inside transactions before changing files.
	 * @param manifest Backup manifest.
	 * @param isRestore Whether this is restoration.
	 * @param isReadOnly Whether to open read-only.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _openDatabases(
		manifest: BackupManifest,
		isRestore: boolean,
		isReadOnly = false,
	): OpenDatabase[] {
		const opened: OpenDatabase[] = [];
		try {
			for (const entry of manifest.databases) {
				this._safePath(entry.path);
				const databaseSync = new Sqlite.DatabaseSync(entry.path, {
					readOnly: isReadOnly,
				});
				opened.push({
					databaseSync,
					entry,
				});
				if (isReadOnly === false) {
					databaseSync.exec('PRAGMA busy_timeout=1000; BEGIN IMMEDIATE');
				}
				for (const row of entry.rows) {
					const current = databaseSync.prepare('SELECT cwd, sandbox_policy FROM threads WHERE id = ?')
						.get(row.id);
					const isBefore = JSON.stringify(current) === JSON.stringify(row.before);
					const isAfter = JSON.stringify(current) === JSON.stringify(row.after);
					if (isBefore === false && (isRestore === false || isAfter === false)) {
						throw new Error(`Codex conversation changed since planning: ${row.id}`);
					}
				}
			}
			return opened;
		} catch (error) {
			this._closeDatabases(opened);
			throw error;
		}
	}

	/**
	 * Commit only the selected conversation fields.
	 * @param databases Open databases and row changes.
	 * @param isRestore Whether to restore original values.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _updateDatabases(databases: OpenDatabase[], isRestore: boolean): void {
		for (const { databaseSync, entry } of databases) {
			for (const row of entry.rows) {
				const value = isRestore ? row.before : row.after;
				databaseSync.prepare('UPDATE threads SET cwd = ?, sandbox_policy = ? WHERE id = ?')
					.run(value.cwd, value.sandbox_policy, row.id);
			}
			databaseSync.exec('COMMIT');
		}
	}

	/**
	 * Roll back unfinished transactions and close all connections.
	 * @param databases Open databases.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _closeDatabases(databases: OpenDatabase[]): void {
		for (const { databaseSync } of databases) {
			if (databaseSync.isTransaction) {
				databaseSync.exec('ROLLBACK');
			}
			databaseSync.close();
		}
	}

	/**
	 * Hash relative file names, contents, and permissions in a project directory.
	 * @param root Directory path.
	 * @param replacements Planned content replacements.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _tree(root: string, replacements: readonly TreeReplacement[] = []): string {
		this._safePath(root);
		const entries = [];
		for (const path of ConversationPlan.walk(root)) {
			const replacement = replacements.find((entry) => entry.path === path);
			const content = replacement?.updated;
			entries.push([
				Path.relative(root, path),
				replacement?.hash ?? (content === undefined ? StorageStream.hash(path) : JsonRecords.hash(content)),
				Fs.statSync(path).mode & 0o777,
			]);
		}
		return this._hash(Buffer.from(JSON.stringify(entries)));
	}

	/**
	 * Reject symbolic links in a storage path or its ancestors.
	 * @param path Existing absolute path.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _safePath(path: string): void {
		let current = Path.resolve(path);
		while (current !== Path.dirname(current)) {
			if (Fs.lstatSync(current).isSymbolicLink()) {
				throw new Error(`Refusing a storage path containing a symbolic link: ${path}`);
			}
			current = Path.dirname(current);
		}
	}

	/**
	 * Check that a file still has its planned contents.
	 * @param path File path.
	 * @param expected Expected checksum.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _assertHash(path: string, expected: string): void {
		this._safePath(path);
		if (StorageStream.hash(path) !== expected) {
			throw new Error(`File changed since planning: ${path}`);
		}
	}

	/**
	 * Calculate a file-content checksum.
	 * @param content Content buffer.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _hash(content: Uint8Array): string {
		return Crypto.createHash('sha256').update(content).digest('hex');
	}

	/**
	 * @param file Checksum-based transformation or an older saved file replacement.
	 * @param destination New private replacement path.
	 * @returns No value after preparing and verifying replacement bytes before any live writes.
	 */
	private static _prepare(file: FileChange, destination: string): void {
		if ('rewrite' in file) {
			const hashes = StorageStream.rewrite(file.path, file.rewrite, destination);
			if (hashes.before !== file.before || hashes.after !== file.after) {
				throw new Error(`File changed since migration planning: ${file.path}`);
			}
		} else {
			Fs.writeFileSync(destination, JsonRecords.content(file), {
				mode: 0o600,
				flag: 'wx',
			});
		}
		const expected = 'after' in file ? file.after : JsonRecords.hash(file.updated);
		if (StorageStream.hash(destination) !== expected) {
			throw new Error(`Replacement file failed its checksum: ${file.path}`);
		}
	}

	/**
	 * @param path Existing live target.
	 * @param source Prepared replacement or verified original backup.
	 * @param expected Expected replacement checksum.
	 * @param allowed Expected current target checksums.
	 * @returns No value after a checked atomic replacement without loading file contents.
	 */
	private static _replace(path: string, source: string, expected: string, allowed: string[]): void {
		this._safePath(path);
		this._safePath(source);
		const stat = Fs.statSync(path);
		const temporary = `${path}.migration-${Crypto.randomUUID()}`;
		try {
			FsExtra.copySync(source, temporary, {
				overwrite: false,
				errorOnExist: true,
			});
			Fs.chmodSync(temporary, stat.mode & 0o777);
			if (StorageStream.hash(temporary) !== expected) {
				throw new Error(`Replacement file failed its checksum: ${path}`);
			}
			if (allowed.includes(StorageStream.hash(path)) === false) {
				throw new Error(`File changed since migration planning; refusing to overwrite: ${path}`);
			}
			Fs.utimesSync(temporary, stat.atime, stat.mtime);
			Fs.renameSync(temporary, path);
		} finally {
			if (Fs.existsSync(temporary)) {
				Fs.unlinkSync(temporary);
			}
		}
	}

	/**
	 * Save restoration information before conversation writes begin.
	 * @param backup Private backup directory.
	 * @param manifest Backup manifest.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _manifest(backup: string, manifest: BackupManifest): void {
		const path = Path.join(backup, 'manifest.json');
		Fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, {
			mode: 0o600,
			flag: 'wx',
		});
	}
}
