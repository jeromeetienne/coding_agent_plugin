import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Path from 'node:path';
import Readline from 'node:readline';
import Sqlite from 'node:sqlite';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticOracle — independent byte, permission, history, and identity checks
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** One independently observed project entry. */
type Entry = {
	/** File, directory, or symbolic link. */
	kind: string;
	/** Unix permissions. */
	mode: number;
	/** SHA-256 or symbolic link text. */
	value: string;
};

/** Independent fixture inventory; never produced by the rename implementation. */
export type SyntheticInventory = {
	/** Optional explicit roots for checking another rename of an existing owned fixture. */
	mapping?: {
		/** Original absolute project root. */
		from: string;
		/** Replacement absolute project root. */
		to: string;
	};
	/** Full project entries including Git administration. */
	project: Record<string, Entry>;
	/** Original Codex database rows. */
	rows: Record<string, unknown>[];
	/** Transcript hashes with only Claude Code cwd normalized. */
	transcripts: Record<string, string>;
	/** Original Codex metadata headers, separate from immutable later history bytes. */
	codexHeaders: Record<string, Record<string, unknown>>;
	/** Hashes of every byte after the initial Codex metadata record. */
	codexBodies: Record<string, string>;
	/** Original byte hashes, including Claude Code line endings. */
	rawTranscripts: Record<string, string>;
	/** Original transcript byte lengths. */
	sizes: Record<string, number>;
	/** Independent hashes of selected native Codex paginated history rows, when present. */
	paginated?: Record<string, string>;
	/** Allocated transcript bytes reported by the real filesystem. */
	allocatedBytes: number;
	/** Materialized transcript bytes. */
	bytes: number;
	/** Largest materialized record size. */
	maxRecord: number;
	/** Count of records larger than 1 MiB. */
	largeRecords: number;
	/** Changed structured path fields in transcripts and policy. */
	fields: number;
};

/** Uses no implementation imports, including no shared discovery, hashing, or migration code. */
export class SyntheticOracle {
	/**
	 * @param root Owned fixture root.
	 * @param mapping Optional explicit roots when reusing an already renamed fixture.
	 * @returns Independently measured original state after specification checks.
	 */
	static async capture(root: string, mapping = {
		from: Path.join(root, 'project'),
		to: Path.join(root, 'renamed'),
	}): Promise<SyntheticInventory> {
		const fixture = JSON.parse(Fs.readFileSync(Path.join(root, 'fixture.json'), 'utf8'));
		const inventory: SyntheticInventory = {
			mapping,
			project: await this.snapshot(mapping.from),
			rows: this._rows(root),
			transcripts: {},
			codexHeaders: {},
			codexBodies: {},
			rawTranscripts: {},
			sizes: {},
			bytes: 0,
			allocatedBytes: 0,
			maxRecord: 0,
			largeRecords: 0,
			fields: 0,
		};
		inventory.paginated = this._paginated(root, inventory.rows.map((row) => String(row.id)));
		const from = mapping.from;
		const paths = await this.snapshot(Path.join(root, 'claude', 'projects'));
		const claude = Object.keys(paths).filter((path) => path.endsWith('.jsonl'));
		Assert.equal(claude.length, fixture.claudeCount ?? (fixture.isFull ? 1000 : 10));
		Assert.equal(inventory.rows.length, (fixture.codexCount ?? (fixture.isFull ? 1000 : 10)) + 3);
		for (const row of inventory.rows) {
			const path = String(row.rollout_path);
			if (row.id === (fixture.specialIds?.missing ?? 'missing')) {
				Assert.equal(Fs.existsSync(path), false);
				continue;
			}
			inventory.transcripts[Path.relative(root, path)] = await this.hash(path);
			inventory.codexHeaders[Path.relative(root, path)] = await this._header(path);
			inventory.codexBodies[Path.relative(root, path)] = await this._body(path);
			inventory.rawTranscripts[Path.relative(root, path)] = inventory.transcripts[Path.relative(root, path)];
			inventory.sizes[Path.relative(root, path)] = Fs.statSync(path).size;
			if (String(row.cwd).startsWith(from)) {
				inventory.fields += 4;
			}
			await this._records(path, inventory, false);
		}
		for (const relative of claude) {
			const path = Path.join(root, 'claude', 'projects', relative);
			inventory.transcripts[Path.relative(root, path)] = await this._records(path, inventory, true);
			inventory.rawTranscripts[Path.relative(root, path)] = paths[relative].value;
			inventory.sizes[Path.relative(root, path)] = Fs.statSync(path).size;
		}
		const entries = Object.entries(inventory.project);
		const count = (kind: string): number => entries.filter((entry) => entry[1].kind === kind).length;
		Assert.ok(count('file') >= (fixture.isFull ? 25000 : 100));
		Assert.ok(count('directory') >= (fixture.isFull ? 2000 : 20));
		Assert.equal(count('link'), fixture.isFull ? 100 : 4);
		Assert.equal(inventory.project['private'].mode, 0o700);
		Assert.equal(inventory.project['private/readonly'].mode, 0o500);
		if (fixture.isFull) {
			const parents = new Set(entries.map(([path]) => Path.dirname(path)));
			Assert.ok(entries.filter(([path, entry]) => entry.kind === 'directory' && parents.has(path) === false)
				.length >= 100, 'Fewer than 100 empty project directories');
			Assert.ok(Fs.readdirSync(Path.join(root, 'claude', 'projects')).length >= 100);
			Assert.ok(new Set(inventory.rows.map((row) => Path.dirname(String(row.rollout_path)))).size >= 100);
			Assert.ok(inventory.allocatedBytes >= inventory.bytes, 'Sparse transcript storage is not representative');
			Assert.ok(inventory.bytes >= 1024 ** 3, `Only ${inventory.bytes} transcript bytes`);
			Assert.ok(inventory.largeRecords >= 10);
			Assert.ok(inventory.fields >= 10000, `Only ${inventory.fields} changed fields`);
			const transcriptPaths = Object.keys(inventory.transcripts);
			for (const application of ['codex', 'claude']) {
				Assert.ok(transcriptPaths.some((path) => path.startsWith(application)
					&& Fs.statSync(Path.join(root, path)).size > 160 * 1024 ** 2));
			}
		}
		Assert.ok(inventory.maxRecord <= 2 * 1024 ** 2);
		return inventory;
	}

	/**
	 * @param root Fixture root.
	 * @param inventory Original independently recorded state.
	 * @param isRestore Whether the original project association should be restored.
	 * @param isAllowOtherProject Whether the concurrent-source test expects a preserved extra source directory.
	 * @param operation Relative operation directory for a fresh run on a previously verified fixture.
	 * @returns No value if bytes, modes, links, histories, identities, backups, and worktrees match.
	 */
	static async verify(root: string, inventory: SyntheticInventory, isRestore: boolean,
		isAllowOtherProject = false, operation = 'operation'): Promise<void> {
		const from = inventory.mapping?.from ?? Path.join(root, 'project');
		const to = inventory.mapping?.to ?? Path.join(root, 'renamed');
		const current = isRestore ? from : to;
		if (isAllowOtherProject === false) {
			Assert.equal(Fs.existsSync(isRestore ? to : from), false);
		}
		const entries = await this.snapshot(current);
		const withoutGitFn = (value: Record<string, Entry>): Record<string, Entry> => Object.fromEntries(
			Object.entries(value).filter(([path]) => path.split('/').includes('.git') === false),
		);
		Assert.deepEqual(withoutGitFn(entries), withoutGitFn(inventory.project));
		const backup = Path.join(root, operation, 'project');
		if (Fs.existsSync(backup)) {
			Assert.deepEqual(await this.snapshot(backup), inventory.project);
		}
		const rows = this._rows(root);
		if (inventory.paginated !== undefined) {
			Assert.deepEqual(this._paginated(root, inventory.rows.map((row) => String(row.id))), inventory.paginated);
		}
		for (const original of inventory.rows) {
			const expected = structuredClone(original);
			if (isRestore === false
				&& inventory.transcripts[Path.relative(root, String(original.rollout_path))] !== undefined) {
				expected.cwd = this._map(String(original.cwd), from, to);
				expected.sandbox_policy = JSON.stringify(JSON.parse(String(original.sandbox_policy)), (_key, value) =>
					typeof value === 'string' ? this._map(value, from, to) : value);
			}
			Assert.deepEqual(rows.find((row) => row.id === expected.id), expected);
		}
		for (const [relative, expected] of Object.entries(inventory.transcripts)) {
			let path = Path.join(root, relative);
			if (isRestore === false && relative.startsWith('claude/')) {
				path = path.replace(from.replace(/[^a-zA-Z0-9-]/g, '-'), to.replace(/[^a-zA-Z0-9-]/g, '-'));
			}
			if (isRestore) {
				Assert.equal(await this.hash(path), inventory.rawTranscripts[relative],
					`Restored transcript bytes changed: ${relative}`);
			}
			if (relative.startsWith('codex/') && isRestore === false) {
				const header = structuredClone(inventory.codexHeaders[relative]);
				const row = inventory.rows.find((entry) => entry.rollout_path === path);
				const cwd = row === undefined ? undefined : String(row.cwd);
				if (cwd !== undefined && (cwd === from || cwd.startsWith(from + '/'))) {
					(header.payload as Record<string, unknown>).cwd = this._map(cwd, from, to);
				}
				Assert.deepEqual(await this._header(path), header, `Codex metadata changed: ${relative}`);
				Assert.equal(await this._body(path), inventory.codexBodies[relative],
					`Codex history bytes changed: ${relative}`);
			} else {
				const observed = relative.startsWith('claude/')
					? await this._records(path, undefined, true, isRestore ? undefined : [to, from])
					: await this.hash(path);
				Assert.equal(observed, expected, `History or bytes changed: ${relative}`);
			}
		}
		for (const path of [current, Path.join(current, 'nested_0'), Path.join(current, 'nested_1'),
			Path.join(root, 'external_2'), Path.join(root, 'external_3')]) {
			const actual = ChildProcess.execFileSync('git', ['-C', path, 'rev-parse', '--show-toplevel'], {
				encoding: 'utf8',
			}).trim();
			Assert.equal(Fs.realpathSync(actual), Fs.realpathSync(path));
		}
		Assert.equal(Fs.readFileSync(Path.join(root, 'sentinel', 'fact'), 'utf8'),
			'Do not follow project symbolic links.');
	}

	/**
	 * @param path File whose complete byte contents are checked independently.
	 * @returns Streaming SHA-256 hash.
	 */
	static async hash(path: string): Promise<string> {
		const hash = Crypto.createHash('sha256');
		for await (const bytes of Fs.createReadStream(path)) {
			hash.update(bytes);
		}
		return hash.digest('hex');
	}

	/**
	 * @param root Project directory.
	 * @returns Sorted independent entries, without following symbolic links.
	 */
	static async snapshot(root: string): Promise<Record<string, Entry>> {
		const entries: Record<string, Entry> = {};
		await this._walk(root, '', entries);
		return entries;
	}

	/**
	 * @param path Value to relocate.
	 * @param from Original project.
	 * @param to New project.
	 * @returns Value with a complete project prefix relocated.
	 */
	private static _map(path: string, from: string, to: string): string {
		return path === from || path.startsWith(from + '/') ? to + path.slice(from.length) : path;
	}

	/**
	 * @param root Project root.
	 * @param relative Relative entry path.
	 * @param entries Independent output inventory.
	 * @returns No value after recursively inspecting real entries.
	 */
	private static async _walk(root: string, relative: string, entries: Record<string, Entry>): Promise<void> {
		const path = Path.join(root, relative);
		const stat = Fs.lstatSync(path);
		entries[relative] = {
			kind: stat.isSymbolicLink() ? 'link' : stat.isDirectory() ? 'directory' : 'file',
			mode: stat.mode & 0o777,
			value: stat.isSymbolicLink() ? Fs.readlinkSync(path) : stat.isDirectory() ? '' : await this.hash(path),
		};
		if (stat.isDirectory()) {
			for (const name of Fs.readdirSync(path).sort()) {
				await this._walk(root, Path.join(relative, name), entries);
			}
		}
	}

	/**
	 * @param root Fixture root.
	 * @returns All original or current Codex rows independently queried read-only.
	 */
	private static _rows(root: string): Record<string, unknown>[] {
		const databaseSync = new Sqlite.DatabaseSync(Path.join(root, 'codex', 'state_5.sqlite'), {
			readOnly: true,
		});
		try {
			return databaseSync.prepare('SELECT * FROM threads ORDER BY id').all().map((row) => ({
				...row,
			}));
		} finally {
			databaseSync.close();
		}
	}

	/**
	 * @param root Fixture root.
	 * @param ids Selected synthetic conversation identities.
	 * @returns Stable hashes of native turns and history records without importing migration code.
	 */
	private static _paginated(root: string, ids: string[]): Record<string, string> {
		const path = Path.join(root, 'codex', 'thread_history_1.sqlite');
		const result: Record<string, string> = {};
		if (Fs.existsSync(path) === false) {
			return result;
		}
		const databaseSync = new Sqlite.DatabaseSync(path, {
			readOnly: true,
		});
		try {
			for (const table of ['thread_turns', 'thread_items', 'thread_realtime_items']) {
				const columns = databaseSync.prepare(`PRAGMA table_info(${table})`).all()
					.map((column) => String(column.name));
				if (columns.includes('thread_id') === false) {
					continue;
				}
				Assert.ok(columns.every((column) => /^[a-z_]+$/.test(column)));
				const hash = Crypto.createHash('sha256');
				const parameters = ids.map(() => '?').join(',');
				const rows = databaseSync.prepare(`SELECT * FROM ${table} WHERE thread_id IN (${parameters}) `
					+ `ORDER BY ${columns.join(',')}`).iterate(...ids);
				for (const row of rows) {
					hash.update(JSON.stringify(row) + '\n');
				}
				result[table] = hash.digest('hex');
			}
		} finally {
			databaseSync.close();
		}
		return result;
	}

	/**
	 * @param path Codex transcript.
	 * @returns Parsed first metadata record, independently of the implementation.
	 */
	private static async _header(path: string): Promise<Record<string, unknown>> {
		const input = Fs.createReadStream(path);
		const lines = Readline.createInterface({
			input,
			crlfDelay: Infinity,
		});
		try {
			for await (const line of lines) {
				return JSON.parse(line);
			}
			throw new Error(`No Codex metadata: ${path}`);
		} finally {
			lines.close();
			input.destroy();
		}
	}

	/**
	 * @param path Codex transcript.
	 * @returns SHA-256 of all bytes after the first newline, including original line endings.
	 */
	private static async _body(path: string): Promise<string> {
		const hash = Crypto.createHash('sha256');
		let isHeader = true;
		for await (const part of Fs.createReadStream(path)) {
			const bytes = Buffer.isBuffer(part) ? part : Buffer.from(part);
			if (isHeader) {
				const end = bytes.indexOf(10);
				if (end < 0) {
					continue;
				}
				isHeader = false;
				hash.update(bytes.subarray(end + 1));
			} else {
				hash.update(bytes);
			}
		}
		return hash.digest('hex');
	}

	/**
	 * @param path Transcript to inspect one record at a time using Node.js readline.
	 * @param inventory Optional independent size counters.
	 * @param isClaude Whether to hash normalized Claude Code records.
	 * @param mapping Optional inverse cwd mapping after rename.
	 * @returns Independent semantic history hash with ordering retained.
	 */
	private static async _records(path: string, inventory?: SyntheticInventory,
		isClaude = false, mapping?: [string, string]): Promise<string> {
		const hash = Crypto.createHash('sha256');
		const input = Fs.createReadStream(path);
		const lines = Readline.createInterface({
			input,
			crlfDelay: Infinity,
		});
		try {
			for await (const line of lines) {
				const record = JSON.parse(line);
				const size = Buffer.byteLength(line);
				if (inventory !== undefined) {
					inventory.maxRecord = Math.max(inventory.maxRecord, size);
					inventory.largeRecords += size >= 1024 ** 2 ? 1 : 0;
					inventory.fields += isClaude && typeof record.cwd === 'string' ? 1 : 0;
				}
				if (mapping !== undefined && typeof record.cwd === 'string') {
					record.cwd = this._map(record.cwd, ...mapping);
				}
				hash.update(JSON.stringify(record) + '\n');
			}
		} finally {
			lines.close();
			input.destroy();
		}
		if (inventory !== undefined) {
			const stat = Fs.statSync(path);
			inventory.bytes += stat.size;
			inventory.allocatedBytes += stat.blocks * 512;
		}
		return hash.digest('hex');
	}
}
