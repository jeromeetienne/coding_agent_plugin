import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Readline from 'node:readline';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import Test from 'node:test';
import { OperationJob } from '../src/operation/operation_job.js';
import { SyntheticFixture } from './synthetic_fixture.js';
import { SyntheticOracle } from './synthetic_oracle.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticOracleTest — prove independent checks reject deliberate corruption
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Exercises the oracle against actual filesystem and database mutations. */
class SyntheticOracleTest {
	/** @returns No value after registering sensitivity checks. */
	static register(): void {
		Test('independent worker finishes after its initiating process is killed', async (context) => {
			const root = Fs.mkdtempSync(Path.join(Fs.realpathSync(Os.tmpdir()), 'rename-76-isolation-'));
			SyntheticFixture.generate(root, false, 'launcher-isolation');
			context.after(() => SyntheticFixture.cleanup(root));
			const inventory = await SyntheticOracle.capture(root);
			const options = {
				from: Path.join(root, 'project'),
				to: Path.join(root, 'renamed'),
				codexHome: Path.join(root, 'codex'),
				claudeHome: Path.join(root, 'claude'),
				claudeConfig: Path.join(root, 'claude', '.claude.json'),
				backup: Path.join(root, 'operation'),
				only: 'both',
			};
			const source = `
import { OperationJob } from ${JSON.stringify(new URL('../src/operation/operation_job.ts', import.meta.url).href)};
class SyntheticLauncher {
	static run() {
		const directory = OperationJob.start(${JSON.stringify(options, null, '\t')});
		console.log(directory);
		setInterval(() => undefined, 1000);
	}
}
SyntheticLauncher.run();
`;
			const childProcess = ChildProcess.spawn(process.execPath, [
				'--import', import.meta.resolve('tsx'), '--input-type=module', '-e', source,
			], {
				cwd: options.from,
				stdio: ['ignore', 'pipe', 'pipe'],
			});
			context.after(() => childProcess.kill('SIGKILL'));
			Assert.ok(childProcess.stdout);
			const lines = Readline.createInterface({
				input: childProcess.stdout,
			});
			const directory = await new Promise<string>((resolveFn, rejectFn) => {
				lines.once('line', resolveFn);
				childProcess.once('error', rejectFn);
				childProcess.once('exit', () => rejectFn(new Error('Launcher exited before publishing the worker.')));
			});
			lines.close();
			Assert.equal(directory, options.backup);
			const before = OperationJob.status(directory);
			Assert.ok(before.state === 'queued' || before.state === 'running');
			Assert.notEqual(before.pid, childProcess.pid);
			const exited = new Promise<void>((resolveFn) => childProcess.once('exit', () => resolveFn()));
			childProcess.kill('SIGKILL');
			await exited;
			const result = await OperationJob.wait(directory, 30000);
			Assert.equal(result.state, 'complete', result.error);
			await SyntheticOracle.verify(root, inventory, false);
			console.log('Launcher killed while worker was active; independent rename and all data checks passed.');
		});

		Test('independent oracle detects bytes, permissions, links, identities, history, and backup corruption',
			async (context) => {
				const root = Fs.mkdtempSync(Path.join(Fs.realpathSync(Os.tmpdir()), 'rename-76-oracle-'));
				SyntheticFixture.generate(root, false, 'oracle-sensitivity');
				context.after(() => SyntheticFixture.cleanup(root));
				const inventory = await SyntheticOracle.capture(root);
				const directory = OperationJob.start({
					from: Path.join(root, 'project'),
					to: Path.join(root, 'renamed'),
					codexHome: Path.join(root, 'codex'),
					claudeHome: Path.join(root, 'claude'),
					claudeConfig: Path.join(root, 'claude', '.claude.json'),
					backup: Path.join(root, 'operation'),
					only: 'both',
				});
				const result = await OperationJob.wait(directory, 30000);
				Assert.equal(result.state, 'complete', result.error);
				await SyntheticOracle.verify(root, inventory, false);
				const project = Path.join(root, 'renamed', 'fact.txt');
				const backup = Path.join(directory, 'project', 'fact.txt');
				const history = Path.join(root, Object.keys(inventory.transcripts).find((path) =>
					path.startsWith('codex/')) as string);
				for (const path of [project, history, backup]) {
					const original = Fs.readFileSync(path);
					Fs.appendFileSync(path, 'deliberate synthetic corruption');
					await Assert.rejects(SyntheticOracle.verify(root, inventory, false));
					Fs.writeFileSync(path, original);
				}
				const mode = Fs.statSync(project).mode & 0o777;
				Fs.chmodSync(project, mode ^ 0o100);
				await Assert.rejects(SyntheticOracle.verify(root, inventory, false));
				Fs.chmodSync(project, mode);
				const link = Path.join(root, 'renamed', 'link_0');
				const target = Fs.readlinkSync(link);
				Fs.unlinkSync(link);
				Fs.symlinkSync('wrong-target', link);
				await Assert.rejects(SyntheticOracle.verify(root, inventory, false));
				Fs.unlinkSync(link);
				Fs.symlinkSync(target, link);
				const databaseSync = new Sqlite.DatabaseSync(Path.join(root, 'codex', 'state_5.sqlite'));
				const id = String(inventory.rows[0].id);
				databaseSync.prepare('UPDATE threads SET id = ? WHERE id = ?').run('wrong-identity', id);
				await Assert.rejects(SyntheticOracle.verify(root, inventory, false));
				databaseSync.prepare('UPDATE threads SET id = ? WHERE id = ?').run(id, 'wrong-identity');
				databaseSync.close();
				await SyntheticOracle.verify(root, inventory, false);
				OperationJob.restore(directory, true);
				const restored = await OperationJob.wait(directory, 30000);
				Assert.equal(restored.state, 'rolled_back', restored.error);
				await SyntheticOracle.verify(root, inventory, true);
				const claude = Path.join(root, Object.keys(inventory.transcripts).find((path) =>
					path.startsWith('claude/')) as string);
				const original = Fs.readFileSync(claude);
				Fs.writeFileSync(claude, Buffer.concat([Buffer.from(' '), original]));
				await Assert.rejects(SyntheticOracle.verify(root, inventory, true), /Restored transcript bytes changed/);
				Fs.writeFileSync(claude, original);
				await SyntheticOracle.verify(root, inventory, true);
				console.log('Oracle rejected all six corruption classes and formatting-only restoration corruption.');
			});
	}
}

SyntheticOracleTest.register();
