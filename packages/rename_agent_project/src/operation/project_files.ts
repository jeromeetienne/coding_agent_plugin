import ChildProcess from 'node:child_process';
import Fs from 'node:fs';
import Path from 'node:path';
import { StorageStream } from '../migration/storage_stream.js';
import { ConversationPlan } from '../migration/conversation_plan.js';
import type { OperationOptions, ProjectEntry, Worktree } from './operation_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ProjectFiles — project backups, content verification, and worktree repair
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Handles the project folder without following links into other projects. */
export class ProjectFiles {
	/**
	 * @param options Project and application storage paths.
	 * @returns No value; throws before writes on an unsafe path or destination conflict.
	 */
	static validate(options: OperationOptions): void {
		for (const path of [options.from, options.to, options.codexHome, options.claudeHome]) {
			if (Path.isAbsolute(path) === false || Path.normalize(path) !== path || path === '/') {
				throw new Error(`A normalized absolute directory is required: ${path}`);
			}
		}
		if (ConversationPlan.contains(options.from, options.to) || ConversationPlan.contains(options.to, options.from)) {
			throw new Error('Source and destination must be different and cannot contain one another.');
		}
		this.safePath(options.from);
		this.safePath(Path.dirname(options.to));
		if (Fs.lstatSync(options.from).isDirectory() === false) {
			throw new Error('The original project must be a directory.');
		}
		if (Fs.existsSync(options.to) || this._linkExists(options.to)) {
			throw new Error(`Destination already exists: ${options.to}`);
		}
		for (const path of [options.codexHome, options.claudeHome, options.claudeConfig]) {
			if (ConversationPlan.contains(path, options.from) || ConversationPlan.contains(path, options.to)) {
				throw new Error('Application storage must remain outside the project being renamed.');
			}
		}
	}

	/**
	 * @param path Existing path whose ancestors must not contain symbolic links.
	 * @returns No value.
	 */
	static safePath(path: string): void {
		let current = Path.resolve(path);
		while (current !== Path.dirname(current)) {
			if (Fs.lstatSync(current).isSymbolicLink()) {
				throw new Error(`A project or control path contains a symbolic link: ${path}`);
			}
			current = Path.dirname(current);
		}
	}

	/**
	 * @param root Project directory.
	 * @returns Checksums, permissions, and link targets including empty directories.
	 */
	static snapshot(root: string): ProjectEntry[] {
		const entries: ProjectEntry[] = [];
		this._walk(root, '', entries);
		return entries;
	}

	/**
	 * @param root Existing project.
	 * @param destination New backup directory.
	 * @param expected Original contents.
	 * @returns No value; verifies the copy and detects concurrent source changes.
	 */
	static backup(root: string, destination: string, expected: ProjectEntry[]): void {
		Fs.cpSync(root, destination, {
			recursive: true,
			preserveTimestamps: true,
			verbatimSymlinks: true,
			errorOnExist: true,
			force: false,
		});
		Fs.chmodSync(destination, Fs.statSync(root).mode & 0o777);
		this.verify(destination, expected);
		this.verify(root, expected);
	}

	/**
	 * @param root Directory to verify.
	 * @param expected Expected contents and access permissions.
	 * @param isUserFilesOnly Whether Git administration changes are checked separately.
	 * @returns No value.
	 */
	static verify(root: string, expected: ProjectEntry[], isUserFilesOnly = false): void {
		const filterFn = (entry: ProjectEntry): boolean =>
			isUserFilesOnly === false || entry.path.split('/').includes('.git') === false;
		if (JSON.stringify(this.snapshot(root).filter(filterFn)) !== JSON.stringify(expected.filter(filterFn))) {
			throw new Error(`Project contents changed: ${root}`);
		}
	}

	/**
	 * @param options Project path mapping.
	 * @returns Worktree paths, including nested and external related checkouts.
	 */
	static worktrees(options: OperationOptions): Worktree[] {
		if (Fs.existsSync(Path.join(options.from, '.git')) === false) {
			return [];
		}
		const output = ChildProcess.execFileSync('git', ['-C', options.from, 'worktree', 'list', '--porcelain'], {
			encoding: 'utf8',
			timeout: 15000,
		});
		return output.split('\n').filter((line) => line.startsWith('worktree ')).map((line) => {
			const from = line.slice('worktree '.length);
			return {
				from,
				to: ConversationPlan.replace(from, options),
			};
		});
	}

	/**
	 * @param root Main project directory at its current location.
	 * @param worktrees Original and new worktree paths.
	 * @param isRestore Whether paths are being returned to their original location.
	 * @returns No value; verifies each related checkout after repair.
	 */
	static repair(root: string, worktrees: Worktree[], isRestore = false): void {
		if (worktrees.length === 0) {
			return;
		}
		const paths = worktrees.map((worktree) => isRestore ? worktree.from : worktree.to);
		ChildProcess.execFileSync('git', ['-C', root, 'worktree', 'repair', ...paths], {
			stdio: 'pipe',
			timeout: 15000,
		});
		for (const path of paths) {
			const actual = ChildProcess.execFileSync('git', ['-C', path, 'rev-parse', '--show-toplevel'], {
				encoding: 'utf8',
				timeout: 15000,
			}).trim();
			if (Fs.realpathSync(actual) !== Fs.realpathSync(path)) {
				throw new Error(`Worktree verification failed: ${path}`);
			}
		}
	}

	/** Capture one entry and recurse into directories without following symbolic links. */
	private static _walk(root: string, relative: string, entries: ProjectEntry[]): void {
		const path = Path.join(root, relative);
		const stat = Fs.lstatSync(path);
		const entry: ProjectEntry = {
			path: relative,
			kind: 'directory',
			value: '',
			mode: stat.mode & 0o777,
		};
		if (stat.isSymbolicLink()) {
			entry.kind = 'link';
			entry.value = Fs.readlinkSync(path);
		} else if (stat.isFile()) {
			entry.kind = 'file';
			entry.value = StorageStream.hash(path);
		} else if (stat.isDirectory() === false) {
			throw new Error(`Unsupported project entry: ${path}`);
		}
		entries.push(entry);
		if (entry.kind === 'directory') {
			for (const name of Fs.readdirSync(path).sort()) {
				this._walk(root, Path.join(relative, name), entries);
			}
		}
	}

	/** Detect dangling destination links that an existence check would miss. */
	private static _linkExists(path: string): boolean {
		try {
			return Fs.lstatSync(path).isSymbolicLink();
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return false;
			}
			throw error;
		}
	}
}
