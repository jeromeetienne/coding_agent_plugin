import ChildProcess from 'node:child_process';
import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Sqlite from 'node:sqlite';
import { StorageStream } from '../migration/storage_stream.js';
import { ConversationPlan } from '../migration/conversation_plan.js';
import type { MigrationPlan } from '../migration/migration_types.js';
import type { AgentProcess, OperationOptions } from './operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	AgentProcesses — detect affected clients without stopping applications
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Work that must finish before selected conversation storage can move. */
class ActiveConversationError extends Error {
}

/** Waits for manually closed affected clients and leaves the shared server running. */
export class AgentProcesses {
	/**
	 * @param options Selected application stores and project.
	 * @param plan Optional selected identifiers for clients resumed from another directory.
	 * @returns Selected clients and Codex servers, without recording command lines or environment secrets.
	 */
	static inspect(options: OperationOptions, plan?: MigrationPlan): AgentProcess[] {
		if (process.platform !== 'darwin' && process.platform !== 'linux') {
			throw new Error('Automatic process inspection currently supports macOS and Linux.');
		}
		const listing = this._output('ps', ['-axo', 'pid=,comm=']);
		const processes: AgentProcess[] = [];
		for (const line of listing.split('\n')) {
			const match = line.trim().match(/^(\d+)\s+(.+)$/);
			if (match === null) {
				continue;
			}
			const executable = match[2];
			const application = this._application(executable);
			if (application === null || (options.only !== 'both' && options.only !== application)) {
				continue;
			}
			const pid = Number(match[1]);
			const command = this._output('ps', ['-ww', '-p', String(pid), '-o', 'command='], true);
			const environment = this._output('ps', ['eww', '-p', String(pid), '-o', 'command='], true);
			if (command.trim().length === 0 || environment.trim().length === 0) {
				if (this._identity(pid).length === 0) {
					continue;
				}
				throw new Error(`Cannot inspect a live application process; no data changed: PID ${pid}`);
			}
			const home = application === 'codex' ? options.codexHome : options.claudeHome;
			const variable = application === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR';
			const isOverride = environment.includes(`${variable}=`);
			const isSelectedOverride = this._containsArgument(environment, `${variable}=${home}`);
			const isDefault = home === Path.join(Os.homedir(), application === 'codex' ? '.codex' : '.claude');
			const files = this._output('lsof', ['-w', '-p', String(pid), '-Fn'], true);
			const isSelectedFiles = files.split('\n').some((file) => file.startsWith('n') && file.includes(`${home}/`));
			if (isSelectedOverride === false && isSelectedFiles === false && (isOverride || isDefault === false)) {
				continue;
			}
			const cwd = this._output('lsof', ['-w', '-a', '-p', String(pid), '-d', 'cwd', '-Fn'], true)
				.split('\n').find((item) => item.startsWith('n'))?.slice(1);
			const isSession = (plan?.conversations ?? []).some((conversation) =>
				command.includes(conversation.id));
			const isRelated = isSession || ConversationPlan.contains(cwd, options.from)
				|| this._containsArgument(command, `--cd ${options.from}`)
				|| this._containsArgument(command, `-C ${options.from}`);
			processes.push({
				pid,
				application,
				isDaemon: application === 'codex' && command.includes('app-server'),
				isRelated,
				identity: this._identity(pid),
				terminal: this._output('ps', ['-p', String(pid), '-o', 'tty='], true).trim(),
			});
		}
		return processes;
	}

	/**
	 * @param processes Processes using selected application storage.
	 * @returns Only related terminal clients; shared servers and unrelated clients remain open.
	 */
	static affectedClients(processes: AgentProcess[]): AgentProcess[] {
		return processes.filter((entry) => entry.isDaemon === false && entry.isRelated);
	}

	/**
	 * @param options Selected project and application storage.
	 * @param plan Conversations whose background work must finish.
	 * @param waitingFn Reports instructions when the waiting conditions change.
	 * @returns No value when affected clients have been closed manually and affected work is idle.
	 */
	static async waitUntilClosed(
		options: OperationOptions,
		plan: MigrationPlan,
		waitingFn: (messages: string[]) => void,
	): Promise<void> {
		let previous = '';
		while (true) {
			const processes = this.inspect(options, plan);
			const messages = this.affectedClients(processes).map((entry) =>
				`Close ${entry.application} client PID ${entry.pid} in terminal ${entry.terminal ?? 'unknown'} manually.`);
			try {
				this.assertIdle(options, plan, processes);
			} catch (error) {
				if (error instanceof ActiveConversationError === false) {
					throw error;
				}
				messages.push(error.message);
			}
			if (messages.length === 0) {
				return;
			}
			const current = JSON.stringify(messages);
			if (current !== previous) {
				waitingFn(messages);
				previous = current;
			}
			await new Promise((resolveFn) => setTimeout(resolveFn, 1000));
			plan = ConversationPlan.build(options);
		}
	}

	/**
	 * @param options Selected project and storage.
	 * @param plan Conversations being changed.
	 * @returns No value; refuses newly opened affected clients or newly active affected work before writes.
	 */
	static assertReady(options: OperationOptions, plan: MigrationPlan): void {
		const processes = this.inspect(options, plan);
		if (this.affectedClients(processes).length > 0) {
			throw new Error('An affected client is open; close that client manually before continuing.');
		}
		this.assertIdle(options, plan, processes);
	}

	/**
	 * @param options Selected storage.
	 * @param plan Related conversations.
	 * @param processes Selected application processes.
	 * @returns No value; rejects active work in selected conversations without blocking unrelated work.
	 */
	static assertIdle(options: OperationOptions, plan: MigrationPlan, processes: AgentProcess[]): void {
		const history = Path.join(options.codexHome, 'thread_history_1.sqlite');
		if (processes.some((entry) => entry.application === 'codex')) {
			if (Fs.existsSync(history) === false) {
				throw new Error('Cannot verify idle Codex turns in this storage format; no data changed.');
			}
			const databaseSync = new Sqlite.DatabaseSync(history, {
				readOnly: true,
			});

			try {
				const columns = databaseSync.prepare('PRAGMA table_info(thread_turns)').all().map((column) => column.name);
				const isRootSupported = columns.includes('root_turn_id') && columns.includes('turn_id');
				const query = isRootSupported
					? `SELECT child.thread_id, child.status, root.status AS root_status
						FROM thread_turns AS child LEFT JOIN thread_turns AS root
						ON root.thread_id = child.thread_id AND root.turn_id = child.root_turn_id`
					: 'SELECT thread_id, status, NULL AS root_status FROM thread_turns';
				const terminalStatuses = ['completed', 'failed', 'interrupted', 'cancelled'];
				const turns = databaseSync.prepare(query).iterate();
				for (const turn of turns) {
					if (terminalStatuses.includes(String(turn.status))
						|| terminalStatuses.includes(String(turn.root_status))) {
						continue;
					}
					if (plan.conversations.some((conversation) =>
						conversation.application === 'Codex' && conversation.id === turn.thread_id)) {
						throw new ActiveConversationError(`Wait for Codex conversation ${turn.thread_id} to finish. `
							+ 'Closing a client can leave its task running; check that task in codex agents.');
					}
				}
			} finally {
				databaseSync.close();
			}
		}
		if (processes.some((entry) => entry.application === 'claude' && entry.isRelated) === false) {
			return;
		}
		for (const move of plan.moves) {
			for (const file of Fs.readdirSync(move.from).filter((name) => name.endsWith('.jsonl'))) {
				let isUnfinished = false;
				for (const record of StorageStream.records(Path.join(move.from, file))) {
					if ((record.type === 'assistant' || record.type === 'user') && record.isMeta !== true) {
						const message = record.message;
						const reason = typeof message === 'object' && message !== null && Array.isArray(message) === false
							? message.stop_reason : undefined;
						isUnfinished = record.type !== 'assistant' || reason !== 'end_turn';
					}
				}
				if (isUnfinished) {
					throw new ActiveConversationError(`Wait for Claude Code conversation ${file} to finish.`);
				}
			}
		}
	}

	/** Recognize installed native application executables. */
	private static _application(executable: string): 'codex' | 'claude' | null {
		if (Path.basename(executable) === 'codex') {
			return 'codex';
		}
		if (Path.basename(executable) === 'claude' || executable.includes('/claude/versions/')) {
			return 'claude';
		}
		return null;
	}

	/** Match a complete argument or its descendant path rather than an unrelated prefix. */
	private static _containsArgument(value: string, argument: string): boolean {
		const index = value.indexOf(argument);
		if (index < 0) {
			return false;
		}
		const end = value[index + argument.length];
		return end === undefined || end === '/' || /\s/.test(end);
	}

	/** Hash the process start time and executable to guard against identifier reuse. */
	private static _identity(pid: number): string {
		const identity = this._output('ps', ['-p', String(pid), '-o', 'lstart=,comm='], true).trim();
		return identity.length === 0 ? '' : Crypto.createHash('sha256').update(identity).digest('hex');
	}

	/** Read process information without printing commands or environment secrets. */
	private static _output(command: string, args: string[], isOptional = false): string {
		const result = ChildProcess.spawnSync(command, args, {
			encoding: 'utf8',
			timeout: 5000,
			maxBuffer: 4 * 1024 * 1024,
		});
		if (result.error !== undefined || (result.status !== 0 && isOptional === false)) {
			throw new Error(`Cannot inspect application processes with ${command}.`);
		}
		return result.status === 0 ? result.stdout : '';
	}
}
