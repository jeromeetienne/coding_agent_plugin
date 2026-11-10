import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import Test from 'node:test';
import { AgentProcesses } from '../src/operation/agent_processes.js';
import { ConversationPlan } from '../src/migration/conversation_plan.js';
import { OperationJob } from '../src/operation/operation_job.js';
import { OperationJournal } from '../src/operation/operation_journal.js';
import { OperationVerification } from '../src/operation/operation_verification.js';
import { ProjectFiles } from '../src/operation/project_files.js';
import { RenameOperation } from '../src/operation/rename_operation.js';
import type { AgentProcess, OperationOptions, OperationRecord } from '../src/operation/operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	RenameOperationTest — complete rename, independent execution, and safe recovery
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class RenameOperationTest {
	static register(): void {
		Test('independent worker renames the folder and both applications then restores everything', async (context) => {
			const record = this._fixture(context, true);
			const original = ProjectFiles.snapshot(record.options.from);
			Fs.rmdirSync(record.directory);
			const directory = OperationJob.start(record.options);
			const result = await OperationJob.wait(directory, 30000);
			Assert.equal(result.state, 'complete', result.error);
			Assert.deepEqual(result.counts, {
				codex: 1,
				claude: 1,
			});
			Assert.equal(Fs.existsSync(record.options.from), false);
			Assert.equal(Fs.readFileSync(Path.join(record.options.to, 'fact.txt'), 'utf8'), 'synthetic fact');
			Assert.ok(Fs.statSync(Path.join(directory, 'worker.mjs')).size > 0);
			Assert.equal(Fs.statSync(directory).mode & 0o777, 0o700);
			ProjectFiles.verify(Path.join(directory, 'project'), original);
			OperationVerification.verify(result);
			OperationJob.restore(directory, true);
			const restored = await OperationJob.wait(directory, 30000);
			Assert.equal(restored.state, 'rolled_back', restored.error);
			Assert.equal(Fs.existsSync(record.options.to), false);
			ProjectFiles.verify(record.options.from, original, true);
		});

		for (const phase of ['backing-up-project', 'migrating-conversations', 'renaming-project',
			'repairing-worktrees', 'verifying-result']) {
			Test(`failure at ${phase} returns the folder and conversations to the original state`, async (context) => {
				const record = this._fixture(context, true);
				const original = ProjectFiles.snapshot(record.options.from);
				const result = await RenameOperation.execute(record, (current) => {
					if (current === phase) {
						throw new Error(`Synthetic failure at ${phase}`);
					}
				});
				Assert.equal(result.state, 'rolled_back', result.error);
				Assert.match(result.error ?? '', /Synthetic failure/);
				Assert.equal(Fs.existsSync(record.options.to), false);
				ProjectFiles.verify(record.options.from, original, true);
				OperationVerification.verify(result, true);
			});
		}

		Test('rollback preserves newer project work and reports recovery required', async (context) => {
			const record = this._fixture(context);
			const result = await RenameOperation.execute(record, (phase) => {
				if (phase === 'verifying-result') {
					Fs.writeFileSync(Path.join(record.options.to, 'newer.txt'), 'preserve this synthetic work');
					throw new Error('Synthetic failure with newer work');
				}
			});
			Assert.equal(result.state, 'recovery_required');
			Assert.equal(Fs.readFileSync(Path.join(record.options.to, 'newer.txt'), 'utf8'),
				'preserve this synthetic work');
			Assert.equal(Fs.existsSync(record.options.from), false);
		});

		Test('destination conflict is rejected before a backup or storage change', (context) => {
			const record = this._fixture(context);
			Fs.rmdirSync(record.directory);
			Fs.mkdirSync(record.options.to);
			Assert.throws(() => OperationJob.start(record.options), /Destination already exists/);
			Assert.equal(Fs.existsSync(record.directory), false);
			Assert.equal(ConversationPlan.build(record.options).conversations.length, 2);
		});

		Test('a real interrupted worker can recover the rename without losing its journal', async (context) => {
			const record = this._fixture(context);
			OperationJournal.write(record, 'prepared');
			const worker = Path.join(record.directory, 'interrupted_worker.mjs');
			const marker = Path.join(record.directory, 'paused');
			const operationUrl = new URL('../src/operation/rename_operation.ts', import.meta.url).href;
			const journalUrl = new URL('../src/operation/operation_journal.ts', import.meta.url).href;
			const source = `
import { RenameOperation } from ${JSON.stringify(operationUrl)};
import { OperationJournal } from ${JSON.stringify(journalUrl)};
import Fs from 'node:fs';
class InterruptedWorker {
	static async run() {
		const record = OperationJournal.read(process.argv[2]);
		record.pid = process.pid;
		await RenameOperation.execute(record, (phase) => {
			if (phase === 'repairing-worktrees') {
				Fs.writeFileSync(process.argv[3], 'paused');
				process.kill(process.pid, 'SIGSTOP');
			}
		});
	}
}
await InterruptedWorker.run();
`;
			Fs.writeFileSync(worker, source);
			const childProcess = ChildProcess.spawn(process.execPath, [
				'--import', import.meta.resolve('tsx'), worker, record.directory, marker,
			], {
				stdio: 'ignore',
			});
			context.after(() => childProcess.kill('SIGKILL'));
			for (let attempt = 0; attempt < 200 && Fs.existsSync(marker) === false; attempt++) {
				await new Promise((resolveFn) => setTimeout(resolveFn, 50));
			}
			Assert.equal(Fs.existsSync(marker), true, 'Worker reached the checkpoint after the actual rename.');
			Assert.equal(Fs.existsSync(record.options.to), true);
			await new Promise<void>((resolveFn) => {
				childProcess.once('exit', () => resolveFn());
				childProcess.kill('SIGKILL');
			});
			OperationJob.restore(record.directory, true);
			const restored = await OperationJob.wait(record.directory, 30000);
			Assert.equal(restored.state, 'rolled_back', restored.error);
			Assert.equal(Fs.existsSync(record.options.from), true);
			Assert.equal(Fs.existsSync(record.options.to), false);
		});

		Test('unrelated clients and shared servers are excluded from manual closure instructions', () => {
			const client: AgentProcess = {
				pid: 42,
				application: 'codex',
				isDaemon: false,
				isRelated: false,
				identity: 'synthetic-process-record',
			};
			Assert.deepEqual(AgentProcesses.affectedClients([client, {
				...client,
				isDaemon: true,
				isRelated: true,
			}]), []);
		});

		for (const threadId of ['synthetic-codex', 'unrelated-conversation']) {
			Test(`active Codex turn ${threadId} is scoped to selected conversations`, (context) => {
				const record = this._fixture(context);
				const path = Path.join(record.options.codexHome, 'thread_history_1.sqlite');
				const databaseSync = new Sqlite.DatabaseSync(path);
				databaseSync.exec('CREATE TABLE thread_turns (thread_id TEXT, status TEXT)');
				databaseSync.prepare('INSERT INTO thread_turns VALUES (?, ?)').run(threadId, 'in_progress');
				databaseSync.close();
				const checkFn = (): void => AgentProcesses.assertIdle(record.options,
					ConversationPlan.build(record.options), [{
						pid: 42,
						application: 'codex',
						isDaemon: false,
						isRelated: true,
						identity: 'synthetic-process-record',
					}]);
				if (threadId === 'synthetic-codex') {
					Assert.throws(checkFn, /Wait for Codex conversation/);
				} else {
					Assert.doesNotThrow(checkFn);
				}
			});
		}

		Test('unfinished affected Claude Code work prevents migration', (context) => {
			const record = this._fixture(context);
			Assert.throws(() => AgentProcesses.assertIdle(record.options,
				ConversationPlan.build(record.options), [{
					pid: 43,
					application: 'claude',
					isDaemon: false,
					isRelated: true,
					identity: 'synthetic-process-record',
				}]), /Wait for Claude Code conversation/);
		});

		Test('waiting leaves all clients alive and continues only after affected clients close', async (context) => {
			const record = this._fixture(context);
			const plan = ConversationPlan.build(record.options);
			const unrelated: AgentProcess = {
				pid: 42,
				application: 'claude',
				isDaemon: false,
				isRelated: false,
				identity: 'unrelated-client',
				terminal: 'ttys001',
			};
			const affected: AgentProcess = {
				...unrelated,
				pid: 43,
				isRelated: true,
				terminal: 'ttys002',
			};
			let isClosed = false;
			context.mock.method(AgentProcesses, 'inspect', () => isClosed ? [unrelated] : [unrelated, affected]);
			context.mock.method(process, 'kill', () => {
				throw new Error('No shutdown signal is allowed.');
			});
			const instructions: string[][] = [];
			await AgentProcesses.waitUntilClosed(record.options, plan, (messages) => {
				instructions.push(messages);
				Assert.equal(Fs.existsSync(record.options.from), true);
				Assert.equal(Fs.existsSync(record.options.to), false);
				isClosed = true;
			});
			Assert.equal(instructions.length, 1);
			Assert.match(instructions[0].join(' '), /PID 43 in terminal ttys002 manually/);
			Assert.doesNotMatch(instructions[0].join(' '), /PID 42/);
		});

		Test('verification accepts unrelated conversation changes and still checks selected metadata', (context) => {
			const record = this._fixture(context);
			record.plan = ConversationPlan.build(record.options);
			record.verification = OperationVerification.capture(record.plan);
			const databaseSync = new Sqlite.DatabaseSync(Path.join(record.options.codexHome, 'state_5.sqlite'));
			databaseSync.prepare('INSERT INTO threads VALUES (?, ?, ?, ?)')
				.run('unrelated-new-thread', '/synthetic/other', '/synthetic/other.jsonl', '{}');
			Assert.doesNotThrow(() => OperationVerification.verify(record, true));
			databaseSync.prepare('UPDATE threads SET sandbox_policy = ? WHERE id = ?')
				.run('changed', 'synthetic-codex');
			Assert.throws(() => OperationVerification.verify(record, true), /metadata verification failed/);
			databaseSync.close();
		});

		Test('an interrupted operation can be recovered by the recorded worker', async (context) => {
			const record = this._fixture(context);
			await RenameOperation.execute(record);
			const complete = OperationJournal.read(record.directory);
			Assert.equal(complete.state, 'complete', complete.error);
			complete.state = 'running';
			complete.pid = undefined;
			OperationJournal.write(complete, 'verifying-result');
			OperationJob.restore(record.directory, true);
			const result = await OperationJob.wait(record.directory, 30000);
			Assert.equal(result.state, 'rolled_back', result.error);
			Assert.equal(Fs.existsSync(record.options.from), true);
		});
	}

	private static _fixture(context: Test.TestContext, isGit = false): OperationRecord {
		const root = Fs.mkdtempSync(Path.join(Fs.realpathSync(Os.tmpdir()), 'rename-operation-'));
		context.after(() => Fs.rmSync(root, {
			recursive: true,
			force: true,
		}));
		const options: OperationOptions = {
			from: Path.join(root, 'rename_agent_test_project'),
			to: Path.join(root, 'rename_agent_test_project_renamed'),
			codexHome: Path.join(root, 'codex'),
			claudeHome: Path.join(root, 'claude'),
			claudeConfig: Path.join(root, 'claude', '.claude.json'),
			only: 'both',
			backup: Path.join(root, 'operation'),
		};
		Fs.mkdirSync(options.from, {
			mode: 0o700,
		});
		Fs.writeFileSync(Path.join(options.from, 'fact.txt'), 'synthetic fact');
		Fs.mkdirSync(Path.join(options.codexHome, 'sessions'), {
			recursive: true,
		});
		const transcript = Path.join(options.codexHome, 'sessions', 'synthetic.jsonl');
		Fs.writeFileSync(transcript, `${JSON.stringify({
			type: 'session_meta',
			payload: {
				id: 'synthetic-codex',
				cwd: options.from,
			},
		})}\n`);
		const databaseSync = new Sqlite.DatabaseSync(Path.join(options.codexHome, 'state_5.sqlite'));
		databaseSync.exec('CREATE TABLE threads (id TEXT, cwd TEXT, rollout_path TEXT, sandbox_policy TEXT)');
		databaseSync.prepare('INSERT INTO threads VALUES (?, ?, ?, ?)')
			.run('synthetic-codex', options.from, transcript, '{}');
		databaseSync.close();
		const claude = Path.join(options.claudeHome, 'projects', options.from.replace(/[^a-zA-Z0-9-]/g, '-'));
		Fs.mkdirSync(claude, {
			recursive: true,
		});
		Fs.writeFileSync(Path.join(claude, 'synthetic-claude.jsonl'), `${JSON.stringify({
			type: 'user',
			cwd: options.from,
			message: {
				content: 'synthetic fact',
			},
		})}\n`);
		if (isGit) {
			for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Synthetic Test',
				'-c', 'user.email=synthetic@example.invalid', 'commit', '--quiet', '-m', 'Synthetic content'],
				['worktree', 'add', '--quiet', '-b', 'synthetic-linked', Path.join(options.from, 'linked')]]) {
				ChildProcess.execFileSync('git', ['-C', options.from, ...args], {
					stdio: 'pipe',
				});
			}
		}
		Fs.mkdirSync(options.backup as string, {
			mode: 0o700,
		});
		return {
			version: 1,
			id: Crypto.randomUUID(),
			options,
			directory: options.backup as string,
			lock: Path.join(root, 'operation.lock'),
			state: 'queued',
			phase: 'prepared',
			updated: new Date().toISOString(),
			action: 'rename',
			counts: {
				codex: 0,
				claude: 0,
			},
			limitations: [],
		};
	}
}

RenameOperationTest.register();
