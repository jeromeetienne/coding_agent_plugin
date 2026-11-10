import Fs from 'node:fs';
import Path from 'node:path';
import Sqlite from 'node:sqlite';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ConversationPlan — finds the exact conversation metadata to migrate
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Builds a migration without changing conversation storage. */
export class ConversationPlan {
	/**
	 * @param {object} options Command options with absolute paths.
	 * @returns {object} File changes, directory moves, and database row changes.
	 */
	static build(options) {
		const plan = {
			version: 1,
			from: options.from,
			to: options.to,
			files: [],
			moves: [],
			databases: [],
			conversations: [],
		};
		if (options.only !== 'claude' && Fs.existsSync(options.codexHome)) {
			this._codex(options, plan);
		}
		if (options.only !== 'codex' && Fs.existsSync(options.claudeHome)) {
			this._claude(options, plan);
		}
		return plan;
	}

	/**
	 * @param {string} value Candidate absolute path.
	 * @param {string} root Original project root.
	 * @returns {boolean} Whether the path is the root or a descendant.
	 */
	static contains(value, root) {
		return typeof value === 'string' && (value === root || value.startsWith(`${root}/`));
	}

	/**
	 * @param {string} value Candidate path.
	 * @param {object} options Original and destination roots.
	 * @returns {string} Path with only a complete root prefix changed.
	 */
	static replace(value, options) {
		return this.contains(value, options.from) ? options.to + value.slice(options.from.length) : value;
	}

	/**
	 * @param {string} root Directory to inspect.
	 * @returns {string[]} Regular file paths; symbolic links are rejected.
	 */
	static walk(root) {
		if (Fs.existsSync(root) === false) {
			return [];
		}
		const stat = Fs.lstatSync(root);
		if (stat.isSymbolicLink()) {
			throw new Error(`Symbolic links are not supported in selected storage: ${root}`);
		}
		if (stat.isFile()) {
			return [root];
		}
		if (stat.isDirectory() === false) {
			throw new Error(`Unsupported storage entry: ${root}`);
		}
		return Fs.readdirSync(root).sort().flatMap((name) => this.walk(Path.join(root, name)));
	}

	/**
	 * Select indexed Codex conversations without rewriting transcript bytes.
	 * @param options Command options.
	 * @param plan Prepared migration.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _codex(options, plan) {
		const names = Fs.readdirSync(options.codexHome).filter((name) => /^state_\d+\.sqlite$/.test(name));
		if (names.length > 1 || names.some((name) => name !== 'state_5.sqlite')) {
			throw new Error('Unsupported or multiple Codex state databases; no changes were made.');
		}
		const indexed = new Map();
		if (names.length === 1) {
			const path = Path.join(options.codexHome, names[0]);
			const databaseSync = new Sqlite.DatabaseSync(path, {
				readOnly: true,
			});
			try {
				const columns = databaseSync.prepare('PRAGMA table_info(threads)').all().map((row) => row.name);
				for (const column of ['id', 'cwd', 'rollout_path', 'sandbox_policy']) {
					if (columns.includes(column) === false) {
						throw new Error(`Unsupported Codex threads schema: missing ${column}`);
					}
				}
				const rows = [];
				for (const row of databaseSync.prepare('SELECT id, cwd, rollout_path, sandbox_policy FROM threads').all()) {
					for (const key of ['id', 'cwd', 'rollout_path', 'sandbox_policy']) {
						if (typeof row[key] !== 'string') {
							throw new Error(`Unsupported Codex row field: ${key}`);
						}
					}
					const rollout = String(row.rollout_path);
					const cwd = String(row.cwd);
					if (indexed.has(Path.resolve(rollout))) {
						throw new Error(`Duplicate Codex transcript index entry: ${rollout}`);
					}
					indexed.set(Path.resolve(rollout), row);
					if (this.contains(cwd, options.from)) {
						const isStored = ['sessions', 'archived_sessions'].some((name) =>
							this.contains(rollout, Path.join(options.codexHome, name)));
						if (isStored === false) {
							throw new Error(`Indexed Codex transcript is outside session storage: ${rollout}`);
						}
						if (Fs.existsSync(rollout) === false) {
							throw new Error(`Missing Codex transcript for ${row.id}: ${row.rollout_path}`);
						}
						const before = {
							cwd: row.cwd,
							sandbox_policy: row.sandbox_policy,
						};
						rows.push({
							id: row.id,
							before,
							after: {
								cwd: this.replace(cwd, options),
								sandbox_policy: this._policy(String(row.sandbox_policy), options),
							},
						});
					}
				}
				if (rows.length > 0) {
					plan.databases.push({
						path,
						rows,
					});
				}
			} finally {
				databaseSync.close();
			}
		}
		for (const name of ['sessions', 'archived_sessions']) {
			for (const path of this.walk(Path.join(options.codexHome, name))) {
				if (path.endsWith('.jsonl') && indexed.has(path) === false) {
					const metadata = this._metadata(path);
					if (this.contains(metadata?.payload?.cwd, options.from)) {
						throw new Error(`Unindexed Codex conversation: ${path}; let Codex index it before migration.`);
					}
				}
			}
		}
		for (const [path, row] of indexed) {
			if (this.contains(row.cwd, options.from) === false) {
				continue;
			}
			const metadata = this._metadata(path);
			if (metadata.type !== 'session_meta' || metadata.payload?.id !== row.id) {
				throw new Error(`Missing or mismatched Codex session metadata: ${path}`);
			}
			plan.conversations.push({
				application: 'Codex',
				id: row.id,
				from: row.cwd,
				to: this.replace(row.cwd, options),
			});
		}
	}

	/**
	 * Select Claude Code project folders and metadata.
	 * @param options Command options.
	 * @param plan Prepared migration.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _claude(options, plan) {
		const root = Path.join(options.claudeHome, 'projects');
		if (Fs.existsSync(root) === false) {
			return;
		}
		const config = Fs.existsSync(options.claudeConfig)
			? JSON.parse(Fs.readFileSync(options.claudeConfig, 'utf8')) : null;
		const prefix = this._encode(options.from);
		for (const name of Fs.readdirSync(root).sort()) {
			if (name !== prefix && name.startsWith(`${prefix}-`) === false) {
				continue;
			}
			const from = Path.join(root, name);
			const files = this.walk(from);
			const candidates = new Set(Object.keys(config?.projects ?? {}).filter((path) => this._encode(path) === name));
			for (const path of files.filter((file) => file.endsWith('.jsonl'))) {
				for (const record of this._records(Fs.readFileSync(path, 'utf8'), path)) {
					if (typeof record?.cwd === 'string' && this._encode(record.cwd) === name) {
						candidates.add(record.cwd);
					}
				}
			}
			if (name === prefix) {
				candidates.add(options.from);
			}
			if (candidates.size !== 1) {
				throw new Error(`Ambiguous Claude Code project directory; cannot safely decode ${from}`);
			}
			const [cwd] = candidates;
			if (this.contains(cwd, options.from) === false) {
				continue;
			}
			const to = Path.join(root, this._encode(this.replace(cwd, options)));
			if (Fs.existsSync(to)) {
				throw new Error(`Claude Code destination already exists; refusing to merge: ${to}`);
			}
			plan.moves.push({
				from,
				to,
			});
			for (const path of files) {
				const original = Fs.readFileSync(path, 'utf8');
				if (path.endsWith('.jsonl')) {
					const updated = this._lines(original, path, (record) => {
						if (typeof record.cwd === 'string') {
							record.cwd = this.replace(record.cwd, options);
						}
					});
					this._file(plan, path, original, updated);
					if (Path.dirname(path) === from) {
						plan.conversations.push({
							application: 'Claude Code',
							id: Path.basename(path, '.jsonl'),
							from: cwd,
							to: this.replace(cwd, options),
						});
					}
				} else if (Path.basename(path) === 'sessions-index.json') {
					const value = JSON.parse(original);
					if (Array.isArray(value.entries) === false) {
						throw new Error(`Unsupported Claude Code session index: ${path}`);
					}
					for (const entry of [value, ...value.entries]) {
						for (const key of ['originalPath', 'projectPath', 'fullPath', 'cwd']) {
							if (typeof entry[key] === 'string') {
								entry[key] = this.replace(this.replace(entry[key], options), {
									from,
									to,
								});
							}
						}
					}
					this._file(plan, path, original, `${JSON.stringify(value, null, 2)}\n`);
				}
			}
		}
		const history = Path.join(options.claudeHome, 'history.jsonl');
		if (Fs.existsSync(history)) {
			const original = Fs.readFileSync(history, 'utf8');
			const updated = this._lines(original, history, (record) => {
				if (typeof record.project === 'string') {
					record.project = this.replace(record.project, options);
				}
			});
			this._file(plan, history, original, updated);
		}
		if (config !== null) {
			const original = Fs.readFileSync(options.claudeConfig, 'utf8');
			for (const path of Object.keys(config.projects ?? {})) {
				if (this.contains(path, options.from)) {
					const to = this.replace(path, options);
					if (config.projects[to] !== undefined) {
						throw new Error(`Claude Code settings already exist for destination: ${to}`);
					}
					config.projects[to] = config.projects[path];
					delete config.projects[path];
				}
			}
			if (JSON.stringify(JSON.parse(original)) !== JSON.stringify(config)) {
				this._file(plan, options.claudeConfig, original, `${JSON.stringify(config, null, 2)}\n`);
			}
		}
	}

	/**
	 * Read the bounded first record without loading a complete Codex transcript.
	 * @param path Transcript path.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _metadata(path) {
		const descriptor = Fs.openSync(path, 'r');
		try {
			const buffer = Buffer.alloc(65536);
			const length = Fs.readSync(descriptor, buffer, 0, buffer.length, 0);
			const content = buffer.subarray(0, length).toString('utf8');
			const end = content.indexOf('\n');
			if (end < 0) {
				throw new Error(`Unsupported or incomplete Codex transcript header: ${path}`);
			}
			return JSON.parse(content.slice(0, end));
		} finally {
			Fs.closeSync(descriptor);
		}
	}

	/**
	 * Record a file only when its contents change.
	 * @param plan Prepared migration.
	 * @param path Original file path.
	 * @param original Original contents.
	 * @param updated Updated contents.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _file(plan, path, original, updated) {
		if (original !== updated) {
			plan.files.push({
				path,
				original,
				updated,
			});
		}
	}

	/**
	 * Encode a Claude Code project path using the tested storage convention.
	 * @param path Absolute project path.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _encode(path) {
		return path.replace(/[^a-zA-Z0-9-]/g, '-');
	}

	/**
	 * Relocate explicit paths inside a stored sandbox policy.
	 * @param value Serialized policy.
	 * @param options Command options.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _policy(value, options) {
		return JSON.stringify(this._paths(JSON.parse(value), options));
	}

	/**
	 * Relocate complete path prefixes in structured permission data.
	 * @param value Structured value.
	 * @param options Original and new roots.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _paths(value, options) {
		if (typeof value === 'string') {
			return this.replace(value, options);
		}
		if (Array.isArray(value)) {
			return value.map((entry) => this._paths(entry, options));
		}
		if (value !== null && typeof value === 'object') {
			return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, this._paths(entry, options)]));
		}
		return value;
	}

	/**
	 * Parse complete newline-separated records before planning changes.
	 * @param value File contents.
	 * @param path File path for diagnostics.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _records(value, path) {
		return value.split('\n').filter((line) => line.trim().length > 0).map((line, index) => {
			try {
				return JSON.parse(line);
			} catch {
				throw new Error(`Invalid JSON in ${path}, record ${index + 1}; no changes were made.`);
			}
		});
	}

	/**
	 * Preserve unchanged records and historical message contents.
	 * @param value File contents.
	 * @param path Source path.
	 * @param updateFn Record mutation callback.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	static _lines(value, path, updateFn) {
		return value.split('\n').map((line) => {
			if (line.trim().length === 0) {
				return line;
			}
			const record = JSON.parse(line);
			const original = JSON.stringify(record);
			updateFn(record);
			return original === JSON.stringify(record) ? line : JSON.stringify(record) + (line.endsWith('\r') ? '\r' : '');
		}).join('\n');
	}
}
