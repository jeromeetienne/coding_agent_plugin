import ChildProcess from 'node:child_process';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { Command } from 'commander';
import { SyntheticFixture } from './synthetic_fixture.js';
import { SyntheticClientFixture } from './synthetic_client_fixture.js';
import { SyntheticOracle } from './synthetic_oracle.js';

const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticRunner — run independent representative verification and retain evidence
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Runs a repeatable synthetic acceptance operation with separate bounded workers. */
class SyntheticRunner {
	/**
	 * @returns No value; unsuccessful operations fail with evidence preserved.
	 */
	static async run(): Promise<void> {
		const command = new Command();
		command.option('--profile <name>', 'full or smoke', 'full')
			.requiredOption('--evidence <path>', 'New evidence directory outside the fixture')
			.option('--seed <value>', 'Deterministic fixture seed', 'issue-76-v2')
			.option('--client-template <path>', 'Explicitly marked disposable native-client histories')
			.option('--prepare-only', 'Generate and verify a fixture before live client checks')
			.option('--fixture <path>', 'Use a prepared fixture that has no rename operation yet')
			.option('--keep', 'Retain successful fixture data')
			.parse();
		const options = command.opts<{
			profile: string;
			evidence: string;
			seed: string;
			keep?: boolean;
			clientTemplate?: string;
			prepareOnly?: boolean;
			fixture?: string;
		}>();
		if (['full', 'smoke'].includes(options.profile) === false || Path.isAbsolute(options.evidence) === false) {
			throw new Error('Use --profile full or smoke and an absolute new evidence path.');
		}
		Fs.mkdirSync(options.evidence, {
			mode: 0o700,
		});
		const stat = Fs.statfsSync(options.evidence);
		const reserve = options.fixture === undefined ? 8 : 6;
		if (options.profile === 'full' && stat.bavail * stat.bsize < reserve * 1024 ** 3) {
			throw new Error(`Full fixture requires ${reserve} GiB free before this stage.`);
		}
		const root = options.fixture ?? Fs.mkdtempSync(
			Path.join(Fs.realpathSync(Os.tmpdir()), 'rename-76-fixture-'),
		);
		if (options.fixture !== undefined && (Path.isAbsolute(root) === false
			|| Path.basename(root).startsWith('rename-76-fixture-') === false
			|| Fs.existsSync(Path.join(root, 'fixture.json')) === false
			|| Fs.existsSync(Path.join(root, 'operation')))) {
			throw new Error('Only an owned prepared fixture without an operation may be reused.');
		}
		const report: Record<string, unknown> = {
			root,
			profile: options.profile,
			seed: options.seed,
			node: process.version,
			platform: `${process.platform} ${Os.release()}`,
			started: new Date().toISOString(),
			outcome: 'incomplete',
		};
		try {
			const start = Date.now();
			if (options.fixture === undefined) {
				SyntheticFixture.generate(root, options.profile === 'full', options.seed);
				if (options.clientTemplate !== undefined) {
					SyntheticClientFixture.add(root, options.clientTemplate);
				}
			}
			report.generationMs = Date.now() - start;
			console.log(`Generated ${options.profile} fixture: ${root}`);
			const inventory = await SyntheticOracle.capture(root);
			Fs.writeFileSync(Path.join(options.evidence, 'inventory.json'), JSON.stringify(inventory));
			report.bytes = inventory.bytes;
			report.allocatedBytes = inventory.allocatedBytes;
			report.maxRecord = inventory.maxRecord;
			report.largeRecords = inventory.largeRecords;
			report.fields = inventory.fields;
			report.entries = Object.keys(inventory.project).length;
			console.log(`Independent inventory passed: ${inventory.bytes} bytes, ${report.entries} project entries.`);
			if (options.prepareOnly === true) {
				report.outcome = 'prepared';
				return;
			}
			await this._command(root, options.evidence, 'rename', [
				'--from', Path.join(root, 'project'), '--to', Path.join(root, 'renamed'),
				'--codex-home', Path.join(root, 'codex'), '--claude-home', Path.join(root, 'claude'),
				'--claude-config', Path.join(root, 'claude', '.claude.json'),
				'--backup', Path.join(root, 'operation'), '--apply',
			]);
			const record = JSON.parse(Fs.readFileSync(Path.join(root, 'operation', 'operation.json'), 'utf8'));
			if (record.state !== 'complete') {
				throw new Error(`Rename ended ${record.state}: ${record.error}`);
			}
			await SyntheticOracle.verify(root, inventory, false);
			await this._command(root, options.evidence, 'restore', ['--restore', Path.join(root, 'operation'), '--apply']);
			const restored = JSON.parse(Fs.readFileSync(Path.join(root, 'operation', 'operation.json'), 'utf8'));
			if (restored.state !== 'rolled_back') {
				throw new Error(`Restore ended ${restored.state}: ${restored.error}`);
			}
			await SyntheticOracle.verify(root, inventory, true);
			report.outcome = 'passed';
			report.totalMs = Date.now() - start;
		} catch (error) {
			report.outcome = 'failed';
			report.error = String(error);
			process.exitCode = 1;
		} finally {
			const operation = Path.join(root, 'operation');
			if (Fs.existsSync(operation)) {
				for (const name of ['operation.json', 'worker.log']) {
					if (Fs.existsSync(Path.join(operation, name))) {
						Fs.copyFileSync(Path.join(operation, name), Path.join(options.evidence, name));
					}
				}
			}
			if (report.outcome === 'passed' && options.keep !== true) {
				SyntheticFixture.cleanup(root);
			}
			Fs.writeFileSync(Path.join(options.evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
			console.log(JSON.stringify(report, null, 2));
		}
	}

	/**
	 * @param root Owned fixture root.
	 * @param evidence Evidence destination.
	 * @param name Command log name.
	 * @param args Actual command-line arguments.
	 * @returns No value if the launcher and its independent worker finish within their budgets.
	 */
	private static async _command(root: string, evidence: string, name: string, args: string[]): Promise<void> {
		const log = Fs.openSync(Path.join(evidence, `${name}.log`), 'wx', 0o600);
		const argv = ['--max-old-space-size=64', '--import', import.meta.resolve('tsx'),
			Path.resolve(__dirname, '../src/cli.ts'), ...args];
		const start = Date.now();
		const childProcess = ChildProcess.spawn(process.execPath, argv, {
			cwd: root,
			stdio: ['ignore', log, log],
			env: {
				...process.env,
				NODE_OPTIONS: '--max-old-space-size=64',
			},
		});
		Fs.closeSync(log);
		let peakRssKiB = 0;
		let workerPid: number | undefined;
		const timer = setInterval(() => {
			const path = Path.join(root, 'operation', 'operation.json');
			if (Fs.existsSync(path)) {
				try {
					workerPid = JSON.parse(Fs.readFileSync(path, 'utf8')).pid;
					if (workerPid !== undefined) {
						const result = ChildProcess.spawnSync('ps', ['-p', String(workerPid), '-o', 'rss='], {
							encoding: 'utf8',
						});
						peakRssKiB = Math.max(peakRssKiB, Number(result.stdout.trim()) || 0);
					}
				} catch {
					// Atomic journal replacement can race with a sample; retain previous samples.
				}
			}
		}, 100);
		const timeout = setTimeout(() => {
			childProcess.kill('SIGTERM');
			if (workerPid !== undefined) {
				process.kill(workerPid, 'SIGTERM');
			}
		}, 30 * 60 * 1000);
		try {
			const exit = await new Promise<number | null>((resolveFn, rejectFn) => {
				childProcess.once('error', rejectFn);
				childProcess.once('exit', resolveFn);
			});
			Fs.writeFileSync(Path.join(evidence, `${name}_process.json`), JSON.stringify({
				argv,
				launcherPid: childProcess.pid,
				workerPid,
				exit,
				wallMs: Date.now() - start,
				peakRssKiB,
				heapMiB: 64,
			}, null, 2));
			if (exit !== 0 || peakRssKiB > 512 * 1024) {
				throw new Error(`${name} command failed or exceeded resident memory: exit=${exit}, RSS=${peakRssKiB} KiB`);
			}
		} finally {
			clearInterval(timer);
			clearTimeout(timeout);
		}
	}
}

await SyntheticRunner.run();
