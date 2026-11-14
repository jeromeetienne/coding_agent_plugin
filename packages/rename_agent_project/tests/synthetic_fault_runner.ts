import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { Command } from 'commander';
import { OperationJob } from '../src/operation/operation_job.js';
import { SyntheticFixture } from './synthetic_fixture.js';
import { SyntheticOracle } from './synthetic_oracle.js';
import type { SyntheticInventory } from './synthetic_oracle.js';

const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticFaultRunner — independent recovery checks after controlled worker failures
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Runs failures only against generated projects, keeping each failed case reviewable. */
class SyntheticFaultRunner {
	/** @returns No value after all selected cases pass or evidence records a failure. */
	static async run(): Promise<void> {
		const command = new Command();
		command.requiredOption('--evidence <path>', 'New absolute evidence directory')
			.option('--profile <name>', 'full or smoke', 'full')
			.option('--phase <name>', 'One phase, or all', 'all')
			.option('--mode <name>', 'crash, disk, or all', 'all')
			.parse();
		const options = command.opts<{
			evidence: string;
			profile: string;
			phase: string;
			mode: string;
		}>();
		Assert.ok(Path.isAbsolute(options.evidence));
		Assert.ok(['full', 'smoke'].includes(options.profile));
		Assert.ok(['all', 'crash', 'disk', 'newer-project', 'newer-transcript', 'destination',
			'source-recreated'].includes(options.mode));
		const phases = ['before-writes', 'backing-up-project', 'migrating-conversations',
			'renaming-project', 'repairing-worktrees', 'verifying-result', 'restoring',
			'staging-replacements', 'replacing-files', 'moving-storage', 'writing-journal', 'restoring-conversations'];
		Assert.ok(['all', 'write-failures', 'concurrent-changes'].includes(options.phase)
			|| phases.includes(options.phase));
		Fs.mkdirSync(options.evidence, {
			mode: 0o700,
		});
		process.env.NODE_OPTIONS = '--max-old-space-size=64';
		const results: Record<string, unknown>[] = [];
		const changes: Record<string, string[]> = {
			'backing-up-project': ['newer-project', 'destination'],
			'migrating-conversations': ['newer-transcript'],
			'renaming-project': ['source-recreated'],
		};
		const selected = options.phase === 'all' ? phases
			: options.phase === 'write-failures' ? phases.slice(-5)
				: options.phase === 'concurrent-changes' ? Object.keys(changes) : [options.phase];
		for (const phase of selected) {
			const modes = options.phase === 'concurrent-changes' ? changes[phase]
				: options.mode === 'all'
					? ['crash', 'disk', ...(options.phase === 'all' ? changes[phase] ?? [] : [])]
					: [options.mode];
			for (const mode of modes) {
				if (phase === 'before-writes' && mode === 'disk') {
					continue;
				}
				const stat = Fs.statfsSync(options.evidence);
				Assert.ok(options.profile === 'smoke' || stat.bavail * stat.bsize >= 8 * 1024 ** 3);
				const root = Fs.mkdtempSync(Path.join(Fs.realpathSync(Os.tmpdir()), 'rename-76-fault-'));
				const evidence = Path.join(options.evidence, `${phase}-${mode}`);
				Fs.mkdirSync(evidence);
				const result: Record<string, unknown> = {
					phase,
					mode,
					root,
					profile: options.profile,
					outcome: 'incomplete',
				};
				const start = Date.now();
				try {
					SyntheticFixture.generate(root, options.profile === 'full', 'issue-76-v2');
					const inventory = await SyntheticOracle.capture(root);
					const argv = ['--max-old-space-size=64', '--import', import.meta.resolve('tsx'),
						Path.join(__dirname, 'synthetic_fault_worker.ts'), root, phase, mode];
					const log = Fs.openSync(Path.join(evidence, 'worker.log'), 'wx', 0o600);
					let exit: number | null;
					try {
						const childProcess = ChildProcess.spawn(process.execPath, argv, {
							cwd: root,
							stdio: ['ignore', log, log],
						});
						exit = await new Promise<number | null>((resolveFn, rejectFn) => {
							childProcess.once('error', rejectFn);
							childProcess.once('exit', resolveFn);
						});
					} finally {
						Fs.closeSync(log);
					}
					result.exit = exit;
					const directory = Path.join(root, 'operation');
					const fault = JSON.parse(Fs.readFileSync(Path.join(directory, 'fault.json'), 'utf8'));
					result.fault = fault;
					Assert.ok(fault.peakRssKiB < 512 * 1024);
					const status = OperationJob.status(directory);
					result.interruptedState = status.state;
					Fs.copyFileSync(Path.join(directory, 'operation.json'), Path.join(evidence, 'interrupted.json'));
					if (['newer-project', 'newer-transcript', 'destination', 'source-recreated'].includes(mode)) {
						await this._concurrent(root, inventory, mode, status.state);
					} else if (phase === 'before-writes') {
						Assert.equal(status.state, 'failed');
						Assert.equal(Fs.existsSync(status.lock), false);
					} else {
						Assert.ok(['rolled_back', 'recovery_required'].includes(status.state), status.error);
						if (status.state === 'recovery_required') {
							OperationJob.restore(directory, true);
							const restored = await OperationJob.wait(directory, 30 * 60 * 1000);
							Assert.equal(restored.state, 'rolled_back', restored.error);
						}
					}
					if (['crash', 'disk'].includes(mode)) {
						await SyntheticOracle.verify(root, inventory, true);
					}
					Fs.copyFileSync(Path.join(directory, 'operation.json'), Path.join(evidence, 'recovered.json'));
					result.outcome = 'passed';
					result.wallMs = Date.now() - start;
					SyntheticFixture.cleanup(root);
				} catch (error) {
					result.outcome = 'failed';
					result.error = String(error);
					process.exitCode = 1;
				}
				results.push(result);
				Fs.writeFileSync(Path.join(options.evidence, 'results.json'), JSON.stringify(results, null, 2));
				console.log(JSON.stringify(result));
				if (result.outcome === 'failed') {
					return;
				}
			}
		}
	}
	/**
	 * @param root Owned fixture root.
	 * @param inventory Independent original state.
	 * @param mode Controlled concurrent change.
	 * @param state Actual terminal operation state.
	 * @returns No value when all preexisting data and the newer work are preserved.
	 */
	private static async _concurrent(root: string, inventory: SyntheticInventory,
		mode: string, state: string): Promise<void> {
		Assert.ok(['rolled_back', 'recovery_required'].includes(state));
		if (mode === 'newer-transcript') {
			const mutation = JSON.parse(Fs.readFileSync(Path.join(root, 'operation', 'mutation.json'), 'utf8'));
			const relative = Path.relative(root, mutation.path);
			const originalSize = inventory.sizes[relative];
			const hash = Crypto.createHash('sha256');
			for await (const bytes of Fs.createReadStream(mutation.path, {
				end: originalSize - 1,
			})) {
				hash.update(bytes);
			}
			Assert.equal(hash.digest('hex'), inventory.rawTranscripts[relative]);
			Assert.equal(Fs.statSync(mutation.path).size, originalSize + Buffer.byteLength(mutation.appended));
			const current = await SyntheticOracle.capture(root);
			Assert.deepEqual(current.project, inventory.project);
			Assert.deepEqual(current.rows, inventory.rows);
			for (const path of Object.keys(inventory.rawTranscripts)) {
				if (path !== relative) {
					Assert.equal(current.rawTranscripts[path], inventory.rawTranscripts[path]);
				}
			}
			return;
		}
		const directory = Path.join(root, mode === 'destination' ? 'renamed' : 'project');
		const path = Path.join(directory, 'newer.txt');
		Assert.equal(Fs.readFileSync(path, 'utf8'), 'preserve newer synthetic work');
		if (mode === 'source-recreated') {
			Assert.equal(state, 'recovery_required');
			await SyntheticOracle.verify(root, inventory, false, true);
			return;
		}
		Fs.unlinkSync(path);
		if (mode === 'destination') {
			Fs.rmdirSync(directory);
		}
		await SyntheticOracle.verify(root, inventory, true);
	}
}

await SyntheticFaultRunner.run();
