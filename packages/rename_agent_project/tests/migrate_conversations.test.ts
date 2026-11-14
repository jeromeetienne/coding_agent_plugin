import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import Test from 'node:test';
import { ConversationPlan } from '../src/migration/conversation_plan.js';
import { StorageStream } from '../src/migration/storage_stream.js';
import { JsonRecords } from '../src/migration/json_records.js';
import { MigrationStorage } from '../src/migration/migration_storage.js';
import type { BackupManifest, JsonObject, MigrationOptions } from '../src/migration/migration_types.js';

const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MigrateConversationsTest — verifies batch isolation and recoverable writes
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Files and storage paths owned by one disposable test. */
type Fixture = {
	/** Root removed after the test. */
	root: string;
	/** Application stores and project path mapping. */
	options: MigrationOptions;
	/** Codex index database. */
	database: string;
	/** Representative Codex transcript. */
	transcript: string;
	/** Original Claude Code project storage. */
	claudeSource: string;
	/** Migrated Claude Code project storage. */
	claudeTarget: string;
	/** Backup destination. */
	backup: string;
};

class MigrateConversationsTest {
	static register(): void {
		Test('batch migration preserves messages, unrelated projects, and archived conversations', (context) => {
			const fixture = this._fixture(context);
			const before = this._snapshot(fixture.root);
			const preview = this._cli(fixture);
			Assert.equal(preview.status, 0, preview.stderr);
			Assert.match(preview.stdout, /5 conversations/);
			Assert.deepEqual(this._snapshot(fixture.root), before);
			const plan = ConversationPlan.build(fixture.options);
			MigrationStorage.apply(plan, fixture.backup);
			const databaseSync = new Sqlite.DatabaseSync(fixture.database);
			const rows = databaseSync.prepare('SELECT * FROM threads ORDER BY id').all();
			databaseSync.close();
			Assert.equal(rows[0].cwd, fixture.options.to);
			Assert.equal(rows[1].cwd, `${fixture.options.to}/.agents/worktrees/task`);
			Assert.equal(rows[2].cwd, `${fixture.options.from}-other`);
			Assert.equal(rows[0].title, 'A preserved title');
			Assert.equal(rows[1].archived, 1);
			const records = Fs.readFileSync(fixture.transcript, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
			Assert.equal(records[0].payload.cwd, fixture.options.from);
			Assert.equal(records[1].payload.permission_profile.root, fixture.options.from);
			Assert.equal(records[2].payload.text, `Remember 731 and this historical path: ${fixture.options.from}`);
			Assert.equal(Fs.existsSync(fixture.claudeSource), false);
			Assert.equal(Fs.readFileSync(Path.join(fixture.claudeTarget, 'memory/MEMORY.md'), 'utf8'), 'keep memory bytes');
			const config = JSON.parse(Fs.readFileSync(fixture.options.claudeConfig, 'utf8')) as {
				projects: Record<string, JsonObject>;
			};
			Assert.deepEqual(config.projects[fixture.options.to].allowedTools, ['Read']);
			Assert.equal(config.projects[fixture.options.from], undefined);
			const index = JSON.parse(Fs.readFileSync(Path.join(fixture.claudeTarget, 'sessions-index.json'), 'utf8'));
			Assert.equal(index.entries[0].fullPath, Path.join(fixture.claudeTarget, 'claude-one.jsonl'));
			Assert.equal(index.entries[0].projectPath, fixture.options.to);
			const repeat = ConversationPlan.build(fixture.options);
			Assert.equal(repeat.files.length + repeat.moves.length + repeat.databases.length, 0);
			MigrationStorage.restore(fixture.backup, false);
			MigrationStorage.restore(fixture.backup, true);
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
		});

		Test('preview reports missing transcripts without the SQLite experimental warning', (context) => {
			const fixture = this._fixture(context);
			Fs.unlinkSync(fixture.transcript);
			const before = this._snapshot(fixture.root);
			const preview = this._cli(fixture);
			Assert.equal(preview.status, 0, preview.stderr);
			Assert.match(preview.stderr, /Missing Codex transcript for a:/);
			Assert.ok(preview.stderr.includes(fixture.transcript));
			Assert.doesNotMatch(preview.stderr, /SQLite is an experimental feature/);
			Assert.match(preview.stdout, /4 conversations/);
			Assert.deepEqual(this._snapshot(fixture.root), before);
		});

		Test('command preserves other experimental warnings and useful errors', (context) => {
			this._fixture(context);
			const result = ChildProcess.spawnSync(process.execPath, [
				'--import', import.meta.resolve('tsx'), '--input-type=module', '-e',
				`import { Cli } from ${JSON.stringify(Path.join(__dirname, '../src/cli.ts'))};
				await Cli.run(['node', 'rename_agent_project']).catch((error) => console.error(error.message));
				process.emitWarning('Other experimental feature', 'ExperimentalWarning');
				process.emitWarning('Useful warning');`,
			], {
				encoding: 'utf8',
			});
			Assert.equal(result.status, 0, result.stderr);
			Assert.match(result.stderr, /Both --from and --to are required/);
			Assert.match(result.stderr, /Other experimental feature/);
			Assert.match(result.stderr, /Useful warning/);
			Assert.doesNotMatch(result.stderr, /SQLite is an experimental feature/);
		});

		Test('large transcript migration and restoration fit a 256 MiB heap', (context) => {
			const fixture = this._fixture(context);
			const line = JSON.stringify({
				type: 'user',
				cwd: fixture.options.from,
				message: {
					content: 'synthetic transcript text é '.repeat(150000),
				},
			}) + '\n';
			for (let index = 0; index < 64; index++) {
				Fs.writeFileSync(Path.join(fixture.claudeSource, `large-${index}.jsonl`), line);
			}
			const source = `
import Fs from 'node:fs';
import Assert from 'node:assert/strict';
import { ConversationPlan } from ${JSON.stringify(new URL('../src/migration/conversation_plan.ts', import.meta.url).href)};
import { MigrationStorage } from ${JSON.stringify(new URL('../src/migration/migration_storage.ts', import.meta.url).href)};
const options = ${JSON.stringify(fixture.options)};
let plan;
for (let pass = 0; pass < 2; pass++) {
	plan = ConversationPlan.build(options);
	const saved = JSON.stringify(plan);
	Assert.ok(Buffer.byteLength(saved) < 1024 * 1024);
	plan = JSON.parse(saved);
}
MigrationStorage.apply(plan, ${JSON.stringify(fixture.backup)});
MigrationStorage.restore(${JSON.stringify(fixture.backup)}, true);
console.log('large migration and restore verified');
`;
			const result = ChildProcess.spawnSync(process.execPath, [
				'--max-old-space-size=256', '--import', import.meta.resolve('tsx'), '--input-type=module', '-e', source,
			], {
				encoding: 'utf8',
				timeout: 60000,
			});
			Assert.equal(result.status, 0, result.stderr);
			Assert.match(result.stdout, /large migration and restore verified/);
			Assert.equal(Fs.readFileSync(Path.join(fixture.claudeSource, 'large-63.jsonl'), 'utf8'), line);
		});

		Test('record boundaries preserve Unicode, blank lines, CRLF, and a final record without a newline', (context) => {
			const fixture = this._fixture(context);
			const path = Path.join(fixture.root, 'boundaries.jsonl');
			const padding = ' '.repeat(65535 - Buffer.byteLength('{"cwd":"/old/'));
			const original = padding + JSON.stringify({
				cwd: '/old/😀',
				message: 'é😀 /old must stay in the message',
			}) + '\r\n\r\n {"cwd":"/other","message":"unchanged formatting"}\n{"cwd":"/old/child"}';
			Fs.writeFileSync(path, original);
			const destination = Path.join(fixture.root, 'replacement');
			const hashes = StorageStream.rewrite(path, {
				field: 'cwd',
				mappings: [{
					from: '/old',
					to: '/new',
				}],
			}, destination);
			const updated = Fs.readFileSync(destination, 'utf8');
			Assert.equal(hashes.before, JsonRecords.hash(original));
			Assert.equal(hashes.after, JsonRecords.hash(updated));
			Assert.equal(updated, '{"cwd":"/new/😀","message":"é😀 /old must stay in the message"}'
				+ '\r\n\r\n {"cwd":"/other","message":"unchanged formatting"}\n{"cwd":"/new/child"}');
			Assert.equal(Fs.readFileSync(path, 'utf8'), original);
		});

		Test('malformed final records leave source data intact and remove incomplete replacements', (context) => {
			const fixture = this._fixture(context);
			const path = Path.join(fixture.root, 'invalid.jsonl');
			const original = '{"cwd":"/old"}\n{partial';
			const destination = Path.join(fixture.root, 'replacement');
			Fs.writeFileSync(path, original);
			Assert.throws(() => StorageStream.rewrite(path, {
				field: 'cwd',
				mappings: [{
					from: '/old',
					to: '/new',
				}],
			}, destination), /Invalid JSON.*record 2/);
			Assert.equal(Fs.existsSync(destination), false);
			Assert.equal(Fs.readFileSync(path, 'utf8'), original);
		});

		Test('compact replacements preserve Unicode and line endings and reject corruption', (context) => {
			const fixture = this._fixture(context);
			const original = ' {"cwd":"/old/😀","message":"é"}\r\n{"cwd":"/old/child"}';
			const updated = ' {"cwd":"/new/😀","message":"é"}\r\n{"cwd":"/new/child"}';
			Fs.writeFileSync(fixture.transcript, original);
			const file = JsonRecords.changes(fixture.transcript, original, updated);
			Assert.ok('edits' in file);
			Assert.equal(file.before, JsonRecords.hash(original));
			Assert.equal(file.after, JsonRecords.hash(updated));
			Assert.equal(JsonRecords.content(file), updated);
			Assert.equal(JsonRecords.content(file, true), original);
			file.edits[0].value = 'corrupt replacement';
			Assert.throws(() => JsonRecords.content(file), /checksum failed/);
			Assert.equal(Fs.readFileSync(fixture.transcript, 'utf8'), original);
		});

		Test('a corrupted record transformation is rejected before any live file changes', (context) => {
			const fixture = this._fixture(context);
			const before = this._snapshot(fixture.root);
			const plan = ConversationPlan.build(fixture.options);
			const file = [...plan.files].reverse().find((entry) => 'rewrite' in entry);
			Assert.ok(file !== undefined && 'rewrite' in file);
			file.rewrite.mappings = [{
				from: fixture.options.from,
				to: '/synthetic/corrupt',
			}];
			Assert.throws(() => MigrationStorage.apply(plan, fixture.backup), /changed since migration planning/);
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
		});

		Test('a failed atomic replacement removes its temporary file and preserves originals', (context) => {
			const fixture = this._fixture(context);
			const before = this._snapshot(fixture.root);
			const plan = ConversationPlan.build(fixture.options);
			const copyFileSync = Fs.copyFileSync;
			const mock = context.mock.method(Fs, 'copyFileSync', (...args: Parameters<typeof Fs.copyFileSync>) => {
				const target = args[1];
				copyFileSync(...args);
				if (String(target).includes('.migration-')) {
					throw new Error('Synthetic disk failure during atomic replacement');
				}
			});
			Assert.throws(() => MigrationStorage.apply(plan, fixture.backup), /Synthetic disk failure/);
			mock.mock.restore();
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
			Assert.equal(ConversationPlan.walk(fixture.claudeSource).some((path) => path.includes('.migration-')), false);
			MigrationStorage.restore(fixture.backup, true);
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
		});

		Test('older complete-text plans remain migratable and restorable', (context) => {
			const fixture = this._fixture(context);
			const plan = ConversationPlan.build(fixture.options);
			plan.files = plan.files.map((file, index) => {
				let updated: string;
				if ('rewrite' in file) {
					const path = Path.join(fixture.root, `legacy-${index}`);
					StorageStream.rewrite(file.path, file.rewrite, path);
					updated = Fs.readFileSync(path, 'utf8');
					Fs.unlinkSync(path);
				} else {
					updated = JsonRecords.content(file);
				}
				return {
					path: file.path,
					original: Fs.readFileSync(file.path, 'utf8'),
					updated,
				};
			});
			const before = this._snapshot(fixture.root);
			MigrationStorage.apply(plan, fixture.backup);
			MigrationStorage.restore(fixture.backup, true);
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
		});

		Test('refuses destination conflicts before creating any backup or changing data', (context) => {
			const fixture = this._fixture(context);
			Fs.mkdirSync(fixture.claudeTarget);
			const before = this._snapshot(fixture.root);
			Assert.throws(() => ConversationPlan.build(fixture.options), /destination already exists/);
			Assert.deepEqual(this._snapshot(fixture.root), before);
		});

		Test('refuses malformed transcripts and unknown database schemas', (context) => {
			const fixture = this._fixture(context);
			Fs.appendFileSync(Path.join(fixture.claudeSource, 'claude-one.jsonl'), '{partial');
			Assert.throws(() => ConversationPlan.build(fixture.options), /Invalid JSON/);
			Fs.renameSync(fixture.database, fixture.database.replace('state_5', 'state_6'));
			Assert.throws(() => ConversationPlan.build(fixture.options), /Unsupported or multiple/);
		});

		Test('detects changed files before apply and newer content before rollback', (context) => {
			const fixture = this._fixture(context);
			const plan = ConversationPlan.build(fixture.options);
			Fs.appendFileSync(Path.join(fixture.claudeSource, 'claude-one.jsonl'), '\n');
			Assert.throws(() => MigrationStorage.apply(plan, fixture.backup), /changed since/);
			Assert.equal(Fs.existsSync(fixture.backup), false);
			MigrationStorage.apply(ConversationPlan.build(fixture.options), fixture.backup);
			Fs.appendFileSync(Path.join(fixture.claudeTarget, 'memory/MEMORY.md'), ' newer work');
			Assert.throws(() => MigrationStorage.restore(fixture.backup, true), /contents changed/);
			Assert.match(Fs.readFileSync(Path.join(fixture.claudeTarget, 'memory/MEMORY.md'), 'utf8'), /newer work/);
		});

		Test('refuses symbolic links and ambiguous Claude Code folder encodings', (context) => {
			const fixture = this._fixture(context);
			const target = Path.join(fixture.claudeSource, 'memory/link');
			Fs.symlinkSync(fixture.transcript, target);
			Assert.throws(() => ConversationPlan.build(fixture.options), /Symbolic links/);
			Fs.unlinkSync(target);
			const config = JSON.parse(Fs.readFileSync(fixture.options.claudeConfig, 'utf8')) as {
				projects: Record<string, JsonObject>;
			};
			config.projects[fixture.options.from.replace('project_old', 'project-old')] = {
			};
			Fs.writeFileSync(fixture.options.claudeConfig, JSON.stringify(config));
			Assert.throws(() => ConversationPlan.build(fixture.options), /Ambiguous/);
		});

		Test('rollback restores an interrupted file-write phase without discarding unrelated changes', (context) => {
			const fixture = this._fixture(context);
			const plan = ConversationPlan.build(fixture.options);
			const before = this._snapshot(fixture.root);
			MigrationStorage.apply(plan, fixture.backup);
			const manifest = JSON.parse(Fs.readFileSync(Path.join(fixture.backup, 'manifest.json'), 'utf8')) as BackupManifest;
			for (const move of manifest.moves) {
				Fs.renameSync(move.to, move.from);
			}
			const file = manifest.files.find((entry) => entry.path.startsWith(fixture.claudeSource));
			Assert.ok(file !== undefined);
			Fs.copyFileSync(Path.join(fixture.backup, file.backup), file.path);
			Fs.chmodSync(file.path, file.mode);
			const databaseSync = new Sqlite.DatabaseSync(fixture.database);
			databaseSync.prepare('UPDATE threads SET cwd = ? WHERE id = ?').run('/unrelated/new', 'c');
			databaseSync.close();
			MigrationStorage.restore(fixture.backup, true);
			const restored = new Sqlite.DatabaseSync(fixture.database);
			Assert.equal(restored.prepare('SELECT cwd FROM threads WHERE id = ?').get('c')?.cwd, '/unrelated/new');
			restored.prepare('UPDATE threads SET cwd = ? WHERE id = ?').run(`${fixture.options.from}-other`, 'c');
			restored.close();
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
		});

		Test('rename command rejects missing sources and destination conflicts before writes', (context) => {
			const fixture = this._fixture(context);
			const before = this._snapshot(fixture.root);
			const result = this._cli(fixture, ['--apply']);
			Assert.equal(result.status, 1);
			Assert.match(result.stderr, /ENOENT|no such file/);
			Assert.deepEqual(this._snapshot(fixture.root), before);
			Fs.mkdirSync(fixture.options.from);
			const conflict = this._cli(fixture, ['--apply']);
			Assert.equal(conflict.status, 1);
			Assert.match(conflict.stderr, /Destination already exists/);
			Assert.deepEqual(this._snapshot(fixture.root), before);
		});
	}

	private static _fixture(context: Test.TestContext): Fixture {
		const root = Fs.mkdtempSync(Path.join(Fs.realpathSync(Os.tmpdir()), 'conversation-test-'));
		context.after(() => Fs.rmSync(root, {
			recursive: true,
			force: true,
		}));
		const options: MigrationOptions = {
			from: Path.join(root, 'project_old'),
			to: Path.join(root, 'project_new'),
			codexHome: Path.join(root, 'codex'),
			claudeHome: Path.join(root, 'claude'),
			claudeConfig: Path.join(root, 'claude-config.json'),
			only: 'both',
		};
		Fs.mkdirSync(options.to);
		Fs.mkdirSync(options.codexHome);
		const database = Path.join(options.codexHome, 'state_5.sqlite');
		const databaseSync = new Sqlite.DatabaseSync(database);
		databaseSync.exec('CREATE TABLE threads ('
			+ 'id TEXT PRIMARY KEY, cwd TEXT, rollout_path TEXT, sandbox_policy TEXT, title TEXT, archived INTEGER)');
		let transcript = '';
		const cases: Array<[string, string, boolean]> = [
			['a', options.from, false],
			['b', `${options.from}/.agents/worktrees/task`, true],
			['c', `${options.from}-other`, false],
		];
		for (const [id, cwd, isArchived] of cases) {
			const path = Path.join(options.codexHome, isArchived ? 'archived_sessions' : 'sessions', `${id}.jsonl`);
			Fs.mkdirSync(Path.dirname(path), {
				recursive: true,
			});
			const records = [
				{
					type: 'session_meta',
					payload: {
						id,
						cwd,
					},
				},
				{
					type: 'turn_context',
					payload: {
						cwd,
						permission_profile: {
							root: cwd,
						},
					},
				},
				{
					type: 'event_msg',
					payload: {
						text: `Remember 731 and this historical path: ${cwd}`,
					},
				},
			];
			Fs.writeFileSync(path, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
			databaseSync.prepare('INSERT INTO threads VALUES (?, ?, ?, ?, ?, ?)').run(
				id, cwd, path, JSON.stringify({
					writable_roots: [cwd],
				}), 'A preserved title', Number(isArchived),
			);
			if (id === 'a') {
				transcript = path;
			}
		}
		databaseSync.close();
		const claudeSource = Path.join(options.claudeHome, 'projects', options.from.replace(/[^a-zA-Z0-9-]/g, '-'));
		const claudeTarget = Path.join(options.claudeHome, 'projects', options.to.replace(/[^a-zA-Z0-9-]/g, '-'));
		Fs.mkdirSync(Path.join(claudeSource, 'memory'), {
			recursive: true,
		});
		Fs.writeFileSync(Path.join(claudeSource, 'memory/MEMORY.md'), 'keep memory bytes');
		for (const id of ['claude-one', 'claude-two', 'claude-three']) {
			Fs.writeFileSync(Path.join(claudeSource, `${id}.jsonl`), `${JSON.stringify({
				type: 'user',
				cwd: options.from,
				sessionId: id,
				message: {
					content: `Keep ${options.from} as historical text`,
				},
			})}\n`);
		}
		Fs.writeFileSync(Path.join(claudeSource, 'sessions-index.json'), JSON.stringify({
			entries: [{
				fullPath: Path.join(claudeSource, 'claude-one.jsonl'),
				projectPath: options.from,
			}],
		}));
		Fs.writeFileSync(options.claudeConfig, JSON.stringify({
			projects: {
				[options.from]: {
					allowedTools: ['Read'],
				},
			},
		}));
		return {
			root,
			options,
			database,
			transcript,
			claudeSource,
			claudeTarget,
			backup: Path.join(root, 'backup'),
		};
	}

	private static _snapshot(root: string, excluded: string[] = []): string[][] {
		return ConversationPlan.walk(root).filter((path) => excluded.some((item) => path.startsWith(item)) === false)
			.map((path) => {
				if (path.endsWith('.sqlite')) {
					const databaseSync = new Sqlite.DatabaseSync(path, {
						readOnly: true,
					});
					try {
						return [Path.relative(root, path), JSON.stringify(
							databaseSync.prepare('SELECT * FROM threads ORDER BY id').all())];
					} finally {
						databaseSync.close();
					}
				}
				return [Path.relative(root, path), Fs.readFileSync(path).toString('base64')];
			});
	}

	private static _cli(fixture: Fixture, extra: string[] = []): ChildProcess.SpawnSyncReturns<string> {
		return ChildProcess.spawnSync(process.execPath, [
			'--import', import.meta.resolve('tsx'),
			Path.join(__dirname, '..', 'src', 'cli.ts'),
			'--from', fixture.options.from,
			'--to', fixture.options.to,
			'--codex-home', fixture.options.codexHome,
			'--claude-home', fixture.options.claudeHome,
			'--claude-config', fixture.options.claudeConfig,
			...extra,
		], {
			encoding: 'utf8',
		});
	}
}

MigrateConversationsTest.register();
