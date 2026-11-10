#!/usr/bin/env -S tsx
import Os from 'node:os';
import Path from 'node:path';
import Url from 'node:url';
import { Command } from 'commander';
import { ConversationPlan } from './migration/conversation_plan.js';
import { OperationJob } from './operation/operation_job.js';
import { OperationJournal } from './operation/operation_journal.js';
import type { OperationRecord } from './operation/operation_types.js';
import type { CommandOptions, MigrationOptions } from './migration/migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Cli — previews or applies a one-time folder migration
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Command-line entry point for migrating Codex and Claude Code conversations. */
export class Cli {
	/**
	 * @param argv Node command-line arguments.
	 * @returns Prints a preview or applies the requested migration or restore.
	 */
	static async run(argv: string[]): Promise<void> {
		const command = new Command();
		command.name('rename_agent_project')
			.description('Rename a project folder and preserve its Codex and Claude Code conversations.')
			.option('--from <path>', 'Old absolute project directory')
			.option('--to <path>', 'New absolute project directory')
			.option('--only <application>', 'codex, claude, or both', 'both')
			.option('--codex-home <path>', 'Codex storage directory',
				process.env.CODEX_HOME ?? Path.join(Os.homedir(), '.codex'))
			.option('--claude-home <path>', 'Claude Code storage directory',
				process.env.CLAUDE_CONFIG_DIR ?? Path.join(Os.homedir(), '.claude'))
			.option('--claude-config <path>', 'Claude Code global configuration file')
			.option('--backup <path>', 'Optional new operation and backup directory; chosen automatically if omitted')
			.option('--restore <path>', 'Preview restoration of a complete rename operation')
			.option('--status <path>', 'Show durable status for an operation directory')
			.option('--detach', 'Return once the independent worker starts')
			.option('--apply', 'Perform the complete rename or restoration; otherwise preview only')
			.parse(argv);
		const options = command.opts<CommandOptions>();
		if (options.status !== undefined) {
			if (options.from !== undefined || options.to !== undefined
				|| options.restore !== undefined || options.apply === true) {
				throw new Error('--status cannot be combined with a rename or restoration.');
			}
			this._report(OperationJournal.read(this._absolute(options.status)));
			return;
		}
		if (options.restore !== undefined) {
			if (options.from !== undefined || options.to !== undefined || options.backup !== undefined) {
				throw new Error('--restore cannot be combined with --from, --to, or --backup.');
			}
			const directory = this._absolute(options.restore);
			const record = OperationJob.restore(directory, options.apply === true);
			if (options.apply !== true) {
				console.log('Restoration preview only. Add --apply to restore the folder and its conversation records.');
			} else if (options.detach === true) {
				console.log(`Restoration started. Status and backup: ${directory}`);
			} else {
				this._report(await OperationJob.wait(record.directory, undefined, (progress) => this._waiting(progress)));
			}
			return;
		}
		if (options.from === undefined || options.to === undefined) {
			throw new Error('Both --from and --to are required. Use --help for examples of the options.');
		}
		options.from = this._absolute(options.from);
		options.to = this._absolute(options.to);
		options.codexHome = this._absolute(options.codexHome);
		options.claudeHome = this._absolute(options.claudeHome);
		if (options.from === '/' || options.to === '/') {
			throw new Error('A filesystem root cannot be migrated.');
		}
		if (ConversationPlan.contains(options.from, options.to) || ConversationPlan.contains(options.to, options.from)) {
			throw new Error('Old and new directories must be different and cannot contain one another.');
		}
		const only = options.only;
		if (only !== 'codex' && only !== 'claude' && only !== 'both') {
			throw new Error('--only must be codex, claude, or both.');
		}
		options.claudeConfig = options.claudeConfig === undefined
			? this._claudeConfig(options.claudeHome) : this._absolute(options.claudeConfig);
		const migrationOptions: MigrationOptions = {
			from: options.from,
			to: options.to,
			codexHome: options.codexHome,
			claudeHome: options.claudeHome,
			claudeConfig: options.claudeConfig,
			only,
		};
		const plan = ConversationPlan.build(migrationOptions);
		console.log(`${options.from} -> ${options.to}`);
		for (const entry of plan.conversations) {
			console.log(`${entry.application}: ${entry.id}\n  ${entry.from} -> ${entry.to}`);
		}
		const rows = plan.databases.reduce((total, database) => total + database.rows.length, 0);
		console.log(`${plan.conversations.length} conversations; ${plan.files.length} files; `
			+ `${plan.moves.length} Claude Code project directories; ${rows} Codex index rows.`);
		if (options.apply !== true) {
			console.log('Preview only. No conversation data changed.');
			return;
		}
		const directory = OperationJob.start({
			...migrationOptions,
			backup: options.backup === undefined ? undefined : this._absolute(options.backup),
		});
		console.log(`Independent rename started. Status and backup: ${directory}`);
		if (options.detach !== true && plan.conversations.some((entry) => entry.id === process.env.CODEX_THREAD_ID)
			=== false) {
			this._report(await OperationJob.wait(directory, undefined, (progress) => this._waiting(progress)));
		} else {
			console.log('Close affected clients manually. The shared server and unrelated clients stay running.');
			console.log(`Read waiting instructions with --status ${directory}`);
		}
	}

	/**
	 * @param record Progress containing manual closure instructions.
	 * @returns No value after printing the affected terminals and selected background tasks.
	 */
	private static _waiting(record: OperationRecord): void {
		console.log('Waiting for affected clients. Keep the shared server and unrelated clients running.');
		for (const message of record.waitingFor ?? []) {
			console.log(message);
		}
		console.log('Keep affected clients closed until the operation completes.');
	}

	/**
	 * @param record Durable operation result.
	 * @returns No value; sets a failure exit status when the operation did not succeed.
	 */
	private static _report(record: OperationRecord): void {
		console.log(`${record.state}: ${record.phase}`);
		if (record.waitingFor !== undefined) {
			this._waiting(record);
		}
		console.log(`Project: ${record.options.from} -> ${record.options.to}`);
		console.log(`Conversations: ${record.counts.codex} Codex, ${record.counts.claude} Claude Code.`);
		console.log(`Status and backup: ${record.directory}`);
		if (record.error !== undefined) {
			console.error(record.error);
		}
		if (record.state === 'complete') {
			for (const limitation of record.limitations) {
				console.log(limitation);
			}
		}
		if (record.state === 'failed' || record.state === 'recovery_required'
			|| (record.state === 'rolled_back' && record.action === 'rename')) {
			process.exitCode = 1;
		}
	}

	/**
	 * Require an absolute normalized command-line path.
	 * @param path Command-line path.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _absolute(path: string): string {
		if (Path.isAbsolute(path) === false) {
			throw new Error(`An absolute path is required: ${path}`);
		}
		return Path.normalize(path).replace(/\/$/, '') || '/';
	}

	/**
	 * Resolve the configuration file belonging to the selected Claude Code store.
	 * @param home Selected storage directory.
	 * @returns The result of the operation, or no value for writes and checks.
	 */
	private static _claudeConfig(home: string): string {
		if (home === Path.join(Os.homedir(), '.claude') && process.env.CLAUDE_CONFIG_DIR === undefined) {
			return Path.join(Os.homedir(), '.claude.json');
		}
		return Path.join(home, '.claude.json');
	}
}

if (process.argv[1] !== undefined && import.meta.url === Url.pathToFileURL(Path.resolve(process.argv[1])).href) {
	try {
		await Cli.run(process.argv);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
