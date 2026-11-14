import Assert from 'node:assert/strict';
import Fs from 'node:fs';
import Path from 'node:path';
import Sqlite from 'node:sqlite';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticClientFixture — add explicitly marked synthetic native-client histories
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Copies only explicitly identified new synthetic histories, never account credentials. */
export class SyntheticClientFixture {
	/**
	 * @param root Newly generated representative fixture.
	 * @param template Disposable store with a synthetic_client_template.json identity allowlist.
	 * @returns No value after cloning native schemas and adding the allowed synthetic histories.
	 */
	static add(root: string, template: string): void {
		const marker = JSON.parse(Fs.readFileSync(Path.join(template, 'synthetic_client_template.json'), 'utf8'));
		Assert.equal(marker.issue, 76);
		Assert.ok(Array.isArray(marker.codexIds) && marker.codexIds.length > 0);
		Assert.ok(Array.isArray(marker.claudeIds) && marker.claudeIds.length > 0);
		const path = Path.join(root, 'codex', 'state_5.sqlite');
		let databaseSync = new Sqlite.DatabaseSync(path);
		const generated = databaseSync.prepare('SELECT * FROM threads').all();
		databaseSync.close();
		Fs.unlinkSync(path);
		const source = new Sqlite.DatabaseSync(Path.join(template, 'codex', 'state_5.sqlite'), {
			readOnly: true,
		});
		source.prepare('VACUUM INTO ?').run(path);
		const samples = marker.codexIds.map((id: string) => {
			const row = source.prepare('SELECT * FROM threads WHERE id = ?').get(id);
			Assert.ok(row, `Missing allowed synthetic identity ${id}`);
			return row;
		});
		source.close();
		databaseSync = new Sqlite.DatabaseSync(path);
		try {
			databaseSync.exec('DELETE FROM threads');
			const columns = databaseSync.prepare('PRAGMA table_info(threads)').all().map((row) => String(row.name));
			Assert.ok(columns.every((column) => /^[a-z_]+$/.test(column)));
			const insert = databaseSync.prepare(`INSERT INTO threads (${columns.join(',')}) VALUES `
				+ `(${columns.map(() => '?').join(',')})`);
			for (const row of generated) {
				const complete = {
					...samples[0],
					...row,
					source: 'cli',
					history_mode: 'legacy',
					has_user_event: 1,
					title: `Generated synthetic conversation ${row.id}`,
					archived: String(row.rollout_path).includes('/archived_sessions/') ? 1 : 0,
				};
				insert.run(...columns.map((column) => complete[column] as string | number | null));
			}
			for (const row of samples) {
				const transcript = String(row.rollout_path);
				Assert.ok(Path.resolve(transcript).startsWith(Path.resolve(template, 'codex') + '/'));
				const destination = Path.join(root, 'codex', Path.relative(Path.join(template, 'codex'), transcript));
				Fs.mkdirSync(Path.dirname(destination), {
					recursive: true,
				});
				Assert.ok(Fs.statSync(transcript).size <= 2 * 1024 ** 2, 'Native seed transcripts must stay bounded.');
				const bytes = Fs.readFileSync(transcript);
				const end = bytes.indexOf(10);
				Assert.ok(end >= 0);
				const metadata = JSON.parse(bytes.subarray(0, end).toString('utf8'));
				Assert.equal(metadata.payload.id, row.id);
				metadata.payload.cwd = Path.join(root, 'project');
				Fs.writeFileSync(destination, Buffer.concat([
					Buffer.from(JSON.stringify(metadata) + '\n'), bytes.subarray(end + 1),
				]), {
					flag: 'wx',
					mode: 0o600,
				});
				row.rollout_path = destination;
				row.sandbox_policy = this._mapPolicy(String(row.sandbox_policy), String(row.cwd),
					Path.join(root, 'project'));
				row.cwd = Path.join(root, 'project');
				insert.run(...columns.map((column) => row[column] as string | number | null));
			}
		} finally {
			databaseSync.close();
		}
		const history = Path.join(template, 'codex', 'thread_history_1.sqlite');
		if (Fs.existsSync(history)) {
			const source = new Sqlite.DatabaseSync(history, {
				readOnly: true,
			});
			const destination = Path.join(root, 'codex', 'thread_history_1.sqlite');
			try {
				source.prepare('VACUUM INTO ?').run(destination);
			} finally {
				source.close();
			}
			const databaseSync = new Sqlite.DatabaseSync(destination);
			try {
				const tables = databaseSync.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
				for (const row of tables) {
					const table = String(row.name);
					Assert.match(table, /^[a-z_]+$/);
					const columns = databaseSync.prepare(`PRAGMA table_info(${table})`).all();
					if (columns.some((column) => column.name === 'thread_id')) {
						const placeholders = marker.codexIds.map(() => '?').join(',');
						databaseSync.prepare(`DELETE FROM ${table} WHERE thread_id NOT IN (${placeholders})`)
							.run(...marker.codexIds);
					}
				}
			} finally {
				databaseSync.close();
			}
		}
		const index = Path.join(template, 'codex', 'session_index.jsonl');
		if (Fs.existsSync(index)) {
			const records = Fs.readFileSync(index, 'utf8').trimEnd().split('\n')
				.map((line) => JSON.parse(line))
				.filter((record) => marker.codexIds.includes(record.id));
			Fs.writeFileSync(Path.join(root, 'codex', 'session_index.jsonl'),
				records.map((record) => JSON.stringify(record)).join('\n') + '\n', {
					flag: 'wx',
					mode: 0o600,
				});
		}
		const directory = Path.join(root, 'claude', 'projects',
			Path.join(root, 'project').replace(/[^a-zA-Z0-9-]/g, '-'));
		for (const id of marker.claudeIds as string[]) {
			Assert.match(id, /^[a-f0-9-]+$/);
			const matches = this._find(Path.join(template, 'claude', 'projects'), `${id}.jsonl`);
			Assert.equal(matches.length, 1);
			const records = Fs.readFileSync(matches[0], 'utf8').trimEnd().split('\n').map((line) => {
				const record = JSON.parse(line);
				if (typeof record.cwd === 'string') {
					record.cwd = Path.join(root, 'project');
				}
				return JSON.stringify(record);
			});
			Fs.writeFileSync(Path.join(directory, `${id}.jsonl`), records.join('\n') + '\n', {
				flag: 'wx',
				mode: 0o600,
			});
		}
		const fixturePath = Path.join(root, 'fixture.json');
		const fixture = JSON.parse(Fs.readFileSync(fixturePath, 'utf8'));
		fixture.codexCount = fixture.count + samples.length;
		fixture.claudeCount = fixture.count + marker.claudeIds.length;
		fixture.nativeSamples = marker;
		Fs.writeFileSync(fixturePath, JSON.stringify(fixture));
	}

	/**
	 * @param policy Original native-client sandbox policy.
	 * @param from Original synthetic project path.
	 * @param to New representative project path.
	 * @returns Serialized relocated policy, preserving all unrelated values.
	 */
	private static _mapPolicy(policy: string, from: string, to: string): string {
		return JSON.stringify(JSON.parse(policy), (_key, value) => typeof value === 'string'
			&& (value === from || value.startsWith(from + '/')) ? to + value.slice(from.length) : value);
	}

	/**
	 * @param root Explicitly selected synthetic application store.
	 * @param name Allowed transcript filename.
	 * @returns Matching regular files, refusing symbolic links.
	 */
	private static _find(root: string, name: string): string[] {
		const stat = Fs.lstatSync(root);
		Assert.equal(stat.isSymbolicLink(), false);
		if (stat.isDirectory() === false) {
			return Path.basename(root) === name ? [root] : [];
		}
		return Fs.readdirSync(root).flatMap((entry) => this._find(Path.join(root, entry), name));
	}
}
