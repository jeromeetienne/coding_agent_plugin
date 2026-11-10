#!/usr/bin/env -S tsx
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Url from 'node:url';
import { Command } from 'commander';
import { ConversationPlan } from './migration/conversation_plan.js';
import { MigrationStorage } from './migration/migration_storage.js';
import type { CommandOptions } from './migration/migration_types.js';

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
	static run(argv: string[]): void {
		const command = new Command();
		command.name('rename_agent_project')
			.description('Migrate existing conversations after renaming a project. Preview only unless --apply is given.')
			.option('--from <path>', 'Old absolute project directory')
			.option('--to <path>', 'New absolute project directory')
			.option('--only <application>', 'codex, claude, or both', 'both')
			.option('--codex-home <path>', 'Codex storage directory',
				process.env.CODEX_HOME ?? Path.join(Os.homedir(), '.codex'))
			.option('--claude-home <path>', 'Claude Code storage directory',
				process.env.CLAUDE_CONFIG_DIR ?? Path.join(Os.homedir(), '.claude'))
			.option('--claude-config <path>', 'Claude Code global configuration file')
			.option('--backup <path>', 'New backup directory outside project and application storage')
			.option('--restore <path>', 'Preview restoration of a migration backup')
			.option('--apply', 'Write the migration or restoration')
			.option('--applications-stopped', 'Confirm all applications and background servers using these stores are stopped')
			.parse(argv);
		const options = command.opts<CommandOptions>();
		if (options.apply === true && options.applicationsStopped !== true) {
			throw new Error('Stop applications and background servers using these stores; then pass --applications-stopped.');
		}
		if (options.restore !== undefined) {
			if (options.from !== undefined || options.to !== undefined || options.backup !== undefined) {
				throw new Error('--restore cannot be combined with --from, --to, or --backup.');
			}
			MigrationStorage.restore(this._absolute(options.restore), options.apply === true);
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
		const plan = ConversationPlan.build({
			from: options.from,
			to: options.to,
			codexHome: options.codexHome,
			claudeHome: options.claudeHome,
			claudeConfig: options.claudeConfig,
			only,
		});
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
		if (Fs.existsSync(options.from) || Fs.statSync(options.to).isDirectory() === false) {
			throw new Error('Rename the project first: the old path must be absent and the new directory must exist.');
		}
		if (options.backup === undefined) {
			throw new Error('--backup is required with --apply. Choose a new directory outside application storage.');
		}
		const backup = this._absolute(options.backup);
		for (const root of [options.from, options.to, options.codexHome, options.claudeHome]) {
			if (ConversationPlan.contains(backup, root) || ConversationPlan.contains(root, backup)) {
				throw new Error('Backup directory and project/application storage must not contain one another.');
			}
		}
		if (plan.files.length === 0 && plan.moves.length === 0 && rows === 0) {
			console.log('Nothing to migrate.');
			return;
		}
		MigrationStorage.apply(plan, backup);
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
		Cli.run(process.argv);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
