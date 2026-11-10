import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import { ConversationPlan } from './conversation_plan.mjs';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MigrationStorage — applies checked changes and restores private backups
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Applies a prepared migration with backups and optimistic rollback checks. */
export class MigrationStorage {
	/**
	 * @param {object} plan Prepared changes from ConversationPlan.
	 * @param {string} backup New backup directory outside project and application storage.
	 * @returns {void} Writes a manifest before changing any conversation data.
	 */
	static apply(plan, backup) {
		this._safePath(Path.dirname(backup));
		const manifest = {
			version: 1,
			from: plan.from,
			to: plan.to,
			files: plan.files.map((file, index) => ({
				path: file.path,
				backup: `file_${index}`,
				before: this._hash(Buffer.from(file.original)),
				after: this._hash(Buffer.from(file.updated)),
				mode: Fs.statSync(file.path).mode & 0o777,
			})),
			moves: plan.moves.map((move) => ({
				...move,
				before: this._tree(move.from),
				after: this._tree(move.from, plan.files),
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
				Fs.writeFileSync(Path.join(backup, manifest.files[index].backup), file.original, {
					mode: 0o600,
					flag: 'wx',
				});
			}
			for (const [index, move] of manifest.moves.entries()) {
				Fs.cpSync(move.from, Path.join(backup, `project_${index}`), {
					recursive: true,
					preserveTimestamps: true,
				});
			}
			this._manifest(backup, manifest);
			for (const file of plan.files) {
				this._assertHash(file.path, this._hash(Buffer.from(file.original)));
				this._write(file.path, file.updated);
			}
			for (const move of manifest.moves) {
				if (this._tree(move.from) !== move.after || Fs.existsSync(move.to)) {
					throw new Error(`Storage changed while migrating: ${move.from}`);
				}
				Fs.renameSync(move.from, move.to);
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
	 * @param {string} backup Directory created by apply.
	 * @param {boolean} isApply Whether to perform restoration instead of previewing.
	 * @returns {void} Restores only unchanged migration output; newer work causes refusal.
	 */
	static restore(backup, isApply) {
		const manifest = JSON.parse(Fs.readFileSync(Path.join(backup, 'manifest.json'), 'utf8'));
		if (manifest.version !== 1 || Array.isArray(manifest.files) === false) {
			throw new Error('Unsupported backup manifest.');
		}
		for (const file of manifest.files) {
			const content = Fs.readFileSync(Path.join(backup, file.backup));
			if (this._hash(content) !== file.before) {
				throw new Error(`Backup file failed its checksum: ${file.backup}`);
			}
		}
		this._checkMoves(manifest, true);
		this._checkFiles(manifest, true);
		const databases = this._openDatabases(manifest, true, isApply === false);
		try {
			console.log(`Restore ${manifest.files.length} files and ${manifest.moves.length} project directories.`);
			if (isApply === false) {
				console.log('Preview only. Add --apply --applications-stopped to restore.');
				return;
			}
			for (const move of [...manifest.moves].reverse()) {
				if (Fs.existsSync(move.to)) {
					Fs.renameSync(move.to, move.from);
				}
			}
			for (const file of manifest.files) {
				const content = Fs.readFileSync(Path.join(backup, file.backup));
				this._write(file.path, content);
				Fs.chmodSync(file.path, file.mode);
			}
			this._updateDatabases(databases, true);
			console.log('Original conversation metadata restored. The project folder was not renamed.');
		} finally {
			this._closeDatabases(databases);
		}
	}

	/**
	 * Refuse changed files before a migration or restoration.
	 * @param manifest Backup manifest.
	 * @param isRestore Whether this is restoration.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _checkFiles(manifest, isRestore) {
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
			const hash = this._hash(Fs.readFileSync(path));
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
	static _checkMoves(manifest, isRestore) {
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
	static _partialTree(move, manifest) {
		const files = manifest.files.filter((file) => ConversationPlan.contains(file.path, move.from));
		for (const file of files) {
			const hash = this._hash(Fs.readFileSync(file.path));
			if (hash !== file.before && hash !== file.after) {
				return false;
			}
		}
		const replacements = files.map((file) => ({
			path: file.path,
			updated: null,
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
	static _openDatabases(manifest, isRestore, isReadOnly = false) {
		const opened = [];
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
	static _updateDatabases(databases, isRestore) {
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
	static _closeDatabases(databases) {
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
	static _tree(root, replacements = []) {
		this._safePath(root);
		const entries = [];
		for (const path of ConversationPlan.walk(root)) {
			const replacement = replacements.find((entry) => entry.path === path);
			const content = replacement?.updated;
			entries.push([
				Path.relative(root, path),
				replacement?.hash ?? this._hash(content === undefined ? Fs.readFileSync(path) : Buffer.from(content)),
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
	static _safePath(path) {
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
	static _assertHash(path, expected) {
		this._safePath(path);
		if (this._hash(Fs.readFileSync(path)) !== expected) {
			throw new Error(`File changed since planning: ${path}`);
		}
	}

	/**
	 * Calculate a file-content checksum.
	 * @param content Content buffer.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _hash(content) {
		return Crypto.createHash('sha256').update(content).digest('hex');
	}

	/**
	 * Replace a file atomically while preserving its access permissions.
	 * @param path Existing path.
	 * @param content New file contents.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _write(path, content) {
		this._safePath(path);
		const temporary = `${path}.migration-${Crypto.randomUUID()}`;
		try {
			Fs.writeFileSync(temporary, content, {
				mode: Fs.statSync(path).mode & 0o777,
				flag: 'wx',
			});
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
	static _manifest(backup, manifest) {
		const path = Path.join(backup, 'manifest.json');
		Fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, {
			mode: 0o600,
			flag: 'wx',
		});
	}
}
