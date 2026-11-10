import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import Test from 'node:test';
import { ConversationPlan } from './conversation_plan.mjs';
import { MigrationStorage } from './migration_storage.mjs';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MigrateConversationsTest — verifies batch isolation and recoverable writes
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class MigrateConversationsTest {
	static register() {
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
			const config = JSON.parse(Fs.readFileSync(fixture.options.claudeConfig, 'utf8'));
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
			const config = JSON.parse(Fs.readFileSync(fixture.options.claudeConfig, 'utf8'));
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
			const manifest = JSON.parse(Fs.readFileSync(Path.join(fixture.backup, 'manifest.json'), 'utf8'));
			for (const move of manifest.moves) {
				Fs.renameSync(move.to, move.from);
			}
			const file = manifest.files.find((entry) => entry.path.startsWith(fixture.claudeSource));
			Fs.copyFileSync(Path.join(fixture.backup, file.backup), file.path);
			Fs.chmodSync(file.path, file.mode);
			const databaseSync = new Sqlite.DatabaseSync(fixture.database);
			databaseSync.prepare('UPDATE threads SET cwd = ? WHERE id = ?').run('/unrelated/new', 'c');
			databaseSync.close();
			MigrationStorage.restore(fixture.backup, true);
			const restored = new Sqlite.DatabaseSync(fixture.database);
			Assert.equal(restored.prepare('SELECT cwd FROM threads WHERE id = ?').get('c').cwd, '/unrelated/new');
			restored.prepare('UPDATE threads SET cwd = ? WHERE id = ?').run(`${fixture.options.from}-other`, 'c');
			restored.close();
			Assert.deepEqual(this._snapshot(fixture.root, [fixture.backup]), before);
		});

		Test('command requires stopped applications and a backup for apply', (context) => {
			const fixture = this._fixture(context);
			const before = this._snapshot(fixture.root);
			const result = this._cli(fixture, ['--apply']);
			Assert.equal(result.status, 1);
			Assert.match(result.stderr, /applications-stopped/);
			const missing = this._cli(fixture, ['--apply', '--applications-stopped']);
			Assert.equal(missing.status, 1);
			Assert.match(missing.stderr, /backup is required/);
			Assert.deepEqual(this._snapshot(fixture.root), before);
		});
	}

	static _fixture(context) {
		const root = Fs.mkdtempSync(Path.join(Fs.realpathSync(Os.tmpdir()), 'conversation-test-'));
		context.after(() => Fs.rmSync(root, {
			recursive: true,
			force: true,
		}));
		const options = {
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
		/** @type {Array<[string, string, boolean]>} */
		const cases = [
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

	static _snapshot(root, excluded = []) {
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

	static _cli(fixture, extra = []) {
		return ChildProcess.spawnSync(process.execPath, [
			Path.join(import.meta.dirname, 'migrate_conversations.mjs'),
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
