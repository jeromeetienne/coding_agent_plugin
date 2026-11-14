import Fs from 'node:fs';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import { StorageStream } from './storage_stream.js';
import { JsonRecords } from './json_records.js';
import type {
	CodexRow,
	JsonObject,
	JsonValue,
	MigrationOptions,
	MigrationPlan,
	PathMapping,
	RowChange,
} from './migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ConversationPlan — finds the exact conversation metadata to migrate
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Builds a migration without changing conversation storage. */
export class ConversationPlan {
	/**
	 * @param options Command options with absolute paths.
	 * @returns File changes, directory moves, and database row changes.
	 */
	static build(options: MigrationOptions): MigrationPlan {
		const plan: MigrationPlan = {
			version: 1,
			from: options.from,
			to: options.to,
			files: [],
			moves: [],
			databases: [],
			conversations: [],
			warnings: [],
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
	 * @param value Candidate absolute path.
	 * @param root Original project root.
	 * @returns Whether the path is the root or a descendant.
	 */
	static contains(value: unknown, root: string): boolean {
		return typeof value === 'string' && (value === root || value.startsWith(`${root}/`));
	}

	/**
	 * @param value Candidate path.
	 * @param options Original and destination roots.
	 * @returns Path with only a complete root prefix changed.
	 */
	static replace(value: string, options: PathMapping): string {
		return this.contains(value, options.from) ? options.to + value.slice(options.from.length) : value;
	}

	/**
	 * @param root Directory to inspect.
	 * @returns Regular file paths; symbolic links are rejected.
	 */
	static walk(root: string): string[] {
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
	 * Select indexed Codex conversations and update only their initial session metadata path.
	 * @param options Command options.
	 * @param plan Prepared migration.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _codex(options: MigrationOptions, plan: MigrationPlan): void {
		const names = Fs.readdirSync(options.codexHome).filter((name) => /^state_\d+\.sqlite$/.test(name));
		if (names.length > 1 || names.some((name) => name !== 'state_5.sqlite')) {
			throw new Error('Unsupported or multiple Codex state databases; no changes were made.');
		}
		const indexed = new Map<string, CodexRow>();
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
				const rows: RowChange[] = [];
				for (const record of databaseSync.prepare('SELECT id, cwd, rollout_path, sandbox_policy FROM threads').all()) {
					for (const key of ['id', 'cwd', 'rollout_path', 'sandbox_policy']) {
						if (typeof record[key] !== 'string') {
							throw new Error(`Unsupported Codex row field: ${key}`);
						}
					}
					const row: CodexRow = {
						id: String(record.id),
						cwd: String(record.cwd),
						rollout_path: String(record.rollout_path),
						sandbox_policy: String(record.sandbox_policy),
					};
					const rollout = row.rollout_path;
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
							plan.warnings?.push(`Missing Codex transcript for ${row.id}: ${row.rollout_path}; `
								+ 'index record left unchanged and excluded from migration.');
							continue;
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
					if (this.contains(JsonRecords.object(metadata.payload, path).cwd, options.from)) {
						throw new Error(`Unindexed Codex conversation: ${path}; let Codex index it before migration.`);
					}
				}
			}
		}
		for (const [path, row] of indexed) {
			if (this.contains(row.cwd, options.from) === false || Fs.existsSync(path) === false) {
				continue;
			}
			const metadata = this._metadata(path);
			if (metadata.type !== 'session_meta' || JsonRecords.object(metadata.payload, path).id !== row.id) {
				throw new Error(`Missing or mismatched Codex session metadata: ${path}`);
			}
			const cwd = JsonRecords.object(metadata.payload, path).cwd;
			if (typeof cwd !== 'string' || Path.isAbsolute(cwd) === false) {
				throw new Error(`Missing or invalid Codex session working directory: ${path}`);
			}
			this._recordFile(plan, path, 'payload.cwd', {
				from: cwd,
				to: this.replace(row.cwd, options),
			});
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
	private static _claude(options: MigrationOptions, plan: MigrationPlan): void {
		const root = Path.join(options.claudeHome, 'projects');
		if (Fs.existsSync(root) === false) {
			return;
		}
		const config = Fs.existsSync(options.claudeConfig)
			? JsonRecords.object(JsonRecords.parse(Fs.readFileSync(options.claudeConfig, 'utf8')), options.claudeConfig)
			: null;
		const empty: JsonObject = {
		};
		const projects = JsonRecords.object(config?.projects ?? empty, options.claudeConfig);
		const prefix = this._encode(options.from);
		for (const name of Fs.readdirSync(root).sort()) {
			if (name !== prefix && name.startsWith(`${prefix}-`) === false) {
				continue;
			}
			const from = Path.join(root, name);
			const files = this.walk(from);
			const candidates = new Set(Object.keys(projects).filter((path) => this._encode(path) === name));
			for (const path of files.filter((file) => file.endsWith('.jsonl'))) {
				for (const record of StorageStream.records(path)) {
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
				if (path.endsWith('.jsonl')) {
					this._recordFile(plan, path, 'cwd', options);
					if (Path.dirname(path) === from) {
						plan.conversations.push({
							application: 'Claude Code',
							id: Path.basename(path, '.jsonl'),
							from: cwd,
							to: this.replace(cwd, options),
						});
					}
				} else if (Path.basename(path) === 'sessions-index.json') {
					const original = Fs.readFileSync(path, 'utf8');
					const value = JsonRecords.object(JsonRecords.parse(original), path);
					if (Array.isArray(value.entries) === false) {
						throw new Error(`Unsupported Claude Code session index: ${path}`);
					}
					for (const entry of [value, ...value.entries.map((record) => JsonRecords.object(record, path))]) {
						for (const key of ['originalPath', 'projectPath', 'fullPath', 'cwd']) {
							const current = entry[key];
							if (typeof current === 'string') {
								entry[key] = this.replace(this.replace(current, options), {
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
			this._recordFile(plan, history, 'project', options);
		}
		if (config !== null) {
			const original = Fs.readFileSync(options.claudeConfig, 'utf8');
			for (const path of Object.keys(projects)) {
				if (this.contains(path, options.from)) {
					const to = this.replace(path, options);
					if (projects[to] !== undefined) {
						throw new Error(`Claude Code settings already exist for destination: ${to}`);
					}
					projects[to] = projects[path];
					delete projects[path];
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
	private static _metadata(path: string): JsonObject {
		const descriptor = Fs.openSync(path, 'r');
		try {
			const buffer = Buffer.alloc(65536);
			const length = Fs.readSync(descriptor, buffer, 0, buffer.length, 0);
			const content = buffer.subarray(0, length).toString('utf8');
			const end = content.indexOf('\n');
			if (end < 0) {
				throw new Error(`Unsupported or incomplete Codex transcript header: ${path}`);
			}
			return JsonRecords.object(JsonRecords.parse(content.slice(0, end)), path);
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
	private static _file(plan: MigrationPlan, path: string, original: string, updated: string): void {
		if (original !== updated) {
			plan.files.push(JsonRecords.changes(path, original, updated));
		}
	}

	/**
	 * Encode a Claude Code project path using the tested storage convention.
	 * @param path Absolute project path.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _encode(path: string): string {
		return path.replace(/[^a-zA-Z0-9-]/g, '-');
	}

	/**
	 * Relocate explicit paths inside a stored sandbox policy.
	 * @param value Serialized policy.
	 * @param options Command options.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _policy(value: string, options: PathMapping): string {
		return JSON.stringify(this._paths(JsonRecords.parse(value), options));
	}

	/**
	 * Relocate complete path prefixes in structured permission data.
	 * @param value Structured value.
	 * @param options Original and new roots.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _paths(value: JsonValue, options: PathMapping): JsonValue {
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
	 * @param plan Migration under construction.
	 * @param path Transcript or history file.
	 * @param field Supported project association field.
	 * @param mapping Project path replacement.
	 * @returns No value; records checksums and the transformation only when bytes change.
	 */
	private static _recordFile(
		plan: MigrationPlan,
		path: string,
		field: 'cwd' | 'project' | 'payload.cwd',
		mapping: PathMapping,
	): void {
		const rewrite = {
			field,
			mappings: [{
				from: mapping.from,
				to: mapping.to,
			}],
		};
		const hashes = StorageStream.rewrite(path, rewrite);
		if (hashes.before !== hashes.after) {
			plan.files.push({
				path,
				...hashes,
				rewrite,
			});
		}
	}
}
