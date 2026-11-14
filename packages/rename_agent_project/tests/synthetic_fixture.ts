import ChildProcess from 'node:child_process';
import Crypto from 'node:crypto';
import Fs from 'node:fs';
import Path from 'node:path';
import Sqlite from 'node:sqlite';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SyntheticFixture — deterministic materialized projects and conversation stores
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Generates only new disposable data, without importing the implementation under test. */
export class SyntheticFixture {
	/**
	 * @param root New, empty, owned fixture directory.
	 * @param isFull Whether to generate the documented full scale.
	 * @param seed Published deterministic data seed.
	 * @returns No value after all fixture files are materialized.
	 */
	static generate(root: string, isFull: boolean, seed: string): void {
		if (Fs.readdirSync(root).length !== 0) {
			throw new Error('Fixture root must be empty.');
		}
		const from = Path.join(root, 'project');
		Fs.mkdirSync(from, {
			mode: 0o700,
		});
		Fs.mkdirSync(Path.join(root, 'sentinel'));
		Fs.writeFileSync(Path.join(root, 'sentinel', 'fact'), 'Do not follow project symbolic links.');
		for (let index = 0; index < (isFull ? 2000 : 20); index++) {
			Fs.mkdirSync(Path.join(from, `directory_${index}`));
		}
		for (let index = 0; index < (isFull ? 25000 : 100); index++) {
			const path = Path.join(from, `directory_${index % (isFull ? 1900 : 15)}`, `file_${index}.txt`);
			Fs.writeFileSync(path, `${seed}: source ${index}\nexport const value = ${index};\n`, {
				mode: [0o600, 0o400, 0o644, 0o755][index % 4],
			});
		}
		Fs.mkdirSync(Path.join(from, 'private'), {
			mode: 0o700,
		});
		Fs.mkdirSync(Path.join(from, 'private', 'readonly'));
		Fs.writeFileSync(Path.join(from, 'private', 'readonly', 'fact.txt'), `${seed}: nested private file`);
		Fs.chmodSync(Path.join(from, 'private', 'readonly'), 0o500);
		for (let index = 0; index < (isFull ? 100 : 4); index++) {
			const targets = ['directory_0/file_0.txt', from, '../sentinel', 'missing-target'];
			Fs.symlinkSync(targets[index % targets.length], Path.join(from, `link_${index}`));
		}
		this._git(from, ['init', '-q']);
		Fs.writeFileSync(Path.join(from, '.gitignore'), 'directory_*\nprivate/\nlink_*\nnested_*\n');
		Fs.writeFileSync(Path.join(from, 'fact.txt'), `${seed}: project identity`);
		this._git(from, ['add', '.gitignore', 'fact.txt']);
		this._git(from, ['-c', 'user.name=Synthetic Test', '-c', 'user.email=synthetic@example.invalid',
			'commit', '-qm', 'Synthetic initial project']);
		for (let index = 0; index < 4; index++) {
			const path = index < 2 ? Path.join(from, `nested_${index}`) : Path.join(root, `external_${index}`);
			this._git(from, ['worktree', 'add', '-q', '-b', `synthetic_${index}`, path]);
		}
		const codex = Path.join(root, 'codex');
		const claude = Path.join(root, 'claude');
		Fs.mkdirSync(codex);
		Fs.mkdirSync(Path.join(claude, 'projects'), {
			recursive: true,
		});
		const databaseSync = new Sqlite.DatabaseSync(Path.join(codex, 'state_5.sqlite'));
		databaseSync.exec('CREATE TABLE threads(id TEXT PRIMARY KEY, cwd TEXT, rollout_path TEXT, sandbox_policy TEXT)');
		const insert = databaseSync.prepare('INSERT INTO threads VALUES(?, ?, ?, ?)');
		const projects: Record<string, unknown> = {};
		const count = isFull ? 1000 : 10;
		for (let index = 0; index < count; index++) {
			this._budget(root);
			const cwd = index % 100 === 0 ? from : Path.join(from, `directory_${index % (isFull ? 100 : 10)}`);
			const id = this._uuid(`${seed}:${index}`);
			const bucket = index % 100;
			const month = String(1 + Math.floor(bucket / 28)).padStart(2, '0');
			const day = String(1 + bucket % 28).padStart(2, '0');
			const date = `2026-${month}-${day}`;
			const directory = index % 11 === 0 ? Path.join(codex, 'archived_sessions')
				: Path.join(codex, 'sessions', '2026', month, day);
			Fs.mkdirSync(directory, {
				recursive: true,
			});
			const transcript = Path.join(directory, `rollout-${date}T00-00-00-${id}.jsonl`);
			this._transcript(transcript, cwd, id, seed, isFull && index === 0, isFull, true);
			insert.run(id, cwd, transcript, JSON.stringify({
				type: 'workspace-write',
				writable_roots: [cwd, Path.join(from, 'private'), Path.join(root, 'unrelated')],
				network_access: false,
				exclude_tmpdir_env_var: false,
				exclude_slash_tmp: false,
			}));
			const project = Path.join(claude, 'projects', cwd.replace(/[^a-zA-Z0-9-]/g, '-'));
			Fs.mkdirSync(project, {
				recursive: true,
			});
			projects[cwd] = {
				allowedTools: [],
			};
			this._transcript(Path.join(project, `${id}.jsonl`), cwd, id, seed,
				isFull && index === 0, isFull, false);
		}
		const destination = Path.join(root, 'renamed');
		const specialIds = {
			missing: this._uuid(`${seed}:missing`),
			destination: this._uuid(`${seed}:destination`),
			unrelated: this._uuid(`${seed}:unrelated`),
		};
		for (const [id, cwd, isMissing] of [
			[specialIds.missing, from, true], [specialIds.destination, destination, false],
			[specialIds.unrelated, root, false],
		] as const) {
			const transcript = Path.join(codex, 'sessions', '2026', '11', '14',
				`rollout-2026-11-14T00-00-00-${id}.jsonl`);
			Fs.mkdirSync(Path.dirname(transcript), {
				recursive: true,
			});
			if (isMissing === false) {
				this._transcript(transcript, cwd, id, seed, false, false, true);
			}
			insert.run(id, cwd, transcript, '{"type":"read-only"}');
		}
		databaseSync.close();
		Fs.writeFileSync(Path.join(claude, '.claude.json'), JSON.stringify({
			projects,
		}));
		Fs.writeFileSync(Path.join(root, 'fixture.json'), JSON.stringify({
			seed,
			isFull,
			count,
			specialIds,
		}));
	}

	/**
	 * @param root Owned fixture root.
	 * @returns No value after removing only this fixture without following links.
	 */
	static cleanup(root: string): void {
		if (Fs.existsSync(Path.join(root, 'fixture.json')) === false) {
			throw new Error('Refusing to clean a directory without the fixture ownership marker.');
		}
		this._writable(root);
		Fs.rmSync(root, {
			recursive: true,
		});
	}

	/**
	 * @param path Existing directory or file in the owned fixture.
	 * @returns No value after making directories traversable for cleanup only.
	 */
	private static _writable(path: string): void {
		const stat = Fs.lstatSync(path);
		if (stat.isDirectory()) {
			Fs.chmodSync(path, 0o700);
			for (const name of Fs.readdirSync(path)) {
				this._writable(Path.join(path, name));
			}
		}
	}

	/**
	 * @param root Fixture filesystem.
	 * @returns No value if the generation disk reserve remains available.
	 */
	private static _budget(root: string): void {
		const stat = Fs.statfsSync(root);
		if (stat.bavail * stat.bsize < 4 * 1024 ** 3) {
			throw new Error('Fixture generation stopped at the 4 GiB free-space reserve.');
		}
	}

	/**
	 * @param root Synthetic repository.
	 * @param args Git arguments.
	 * @returns No value after the command completes.
	 */
	private static _git(root: string, args: string[]): void {
		ChildProcess.execFileSync('git', ['-C', root, ...args], {
			stdio: 'pipe',
		});
	}

	/**
	 * @param value Deterministic identity seed.
	 * @returns Canonical version-four-shaped UUID used only for disposable fixtures.
	 */
	private static _uuid(value: string): string {
		const hash = Crypto.createHash('sha256').update(value).digest('hex');
		return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}`
			+ `-${hash.slice(20, 32)}`;
	}

	/**
	 * @param cwd Synthetic project association.
	 * @param id Conversation identity.
	 * @param seed Published data seed.
	 * @param index Message sequence.
	 * @param content Materialized varied tool output or message text.
	 * @param isCodex Whether to emit Codex rollout rather than Claude Code records.
	 * @param isFinal Whether to close the transcript with a completed assistant message.
	 * @returns A native-shaped message, tool call, or tool result.
	 */
	private static _record(cwd: string, id: string, seed: string, index: number, content: string,
		isCodex: boolean, isFinal = false): Record<string, unknown> {
		const kind = isFinal ? 1 : index % 4;
		const call = `${id}-call-${kind === 3 ? index - 1 : index}`;
		if (isCodex) {
			const payload = kind === 2 ? {
				type: 'function_call',
				name: 'synthetic_test',
				call_id: call,
				arguments: JSON.stringify({
					path: `${cwd}/file.ts`,
					script: content,
				}),
			} : kind === 3 ? {
				type: 'function_call_output',
				call_id: call,
				output: content,
			} : {
				type: 'message',
				role: kind === 0 ? 'user' : 'assistant',
				content: [{
					type: kind === 0 ? 'input_text' : 'output_text',
					text: content,
				}],
			};
			return {
				timestamp: '2026-11-14T00:00:00.000Z',
				type: 'response_item',
				payload,
			};
		}
		const message = kind === 2 ? {
			role: 'assistant',
			content: [{
				type: 'tool_use',
				id: call,
				name: 'synthetic_test',
				input: {
					path: `${cwd}/file.ts`,
					script: content,
				},
			}],
			stop_reason: 'tool_use',
		} : kind === 3 ? {
			role: 'user',
			content: [{
				type: 'tool_result',
				tool_use_id: call,
				content,
			}],
		} : {
			role: kind === 0 ? 'user' : 'assistant',
			content: kind === 0 ? content : [{
				type: 'text',
				text: content,
			}],
			stop_reason: 'end_turn',
		};
		return {
			type: kind === 0 || kind === 3 ? 'user' : 'assistant',
			cwd,
			sessionId: id,
			uuid: this._uuid(`${id}:${index}`),
			parentUuid: index === 0 ? null : this._uuid(`${id}:${index - 1}`),
			timestamp: '2026-11-14T00:00:00.000Z',
			isSidechain: false,
			userType: 'external',
			entrypoint: 'cli',
			version: '2.1.325',
			message: kind === 1 || kind === 2 ? {
				...message,
				id: `msg_${this._uuid(`${id}:${index}`)}`,
				type: 'message',
				model: 'claude-sonnet-5-5',
				usage: {
					input_tokens: 1,
					output_tokens: 1,
				},
			} : message,
			fact: `${seed}: conversation ${id} record ${index}`,
		};
	}

	/**
	 * @param path New transcript path.
	 * @param cwd Associated project path.
	 * @param id Stable synthetic identity.
	 * @param seed Deterministic content seed.
	 * @param isLarge Whether the individual transcript exceeds 160 MiB.
	 * @param isFull Whether to include the full varied record sizes.
	 * @param isCodex Whether the transcript uses Codex session metadata.
	 * @returns No value after writing complete non-sparse records.
	 */
	private static _transcript(path: string, cwd: string, id: string, seed: string,
		isLarge: boolean, isFull: boolean, isCodex: boolean): void {
		const descriptor = Fs.openSync(path, 'wx', 0o600);
		let bytes = 0;
		let index = 0;
		try {
			if (isCodex) {
				Fs.writeSync(descriptor, JSON.stringify({
					timestamp: '2026-11-14T00:00:00.000Z',
					type: 'session_meta',
					payload: {
						id,
						cwd,
						timestamp: '2026-11-14T00:00:00.000Z',
						originator: 'codex_cli_rs',
						cli_version: '0.169.0',
						source: 'cli',
						model_provider: 'openai',
						history_mode: 'legacy',
					},
				}) + '\n');
			}
			if (isCodex) {
				Fs.writeSync(descriptor, JSON.stringify({
					timestamp: '2026-11-14T00:00:00.000Z',
					type: 'event_msg',
					payload: {
						type: 'user_message',
						message: `${seed}: synthetic conversation ${id}`,
						images: [],
						local_images: [],
					},
				}) + '\n');
			}
			const sizes = isFull ? [256, 1024, 4096, 16384, 65536, 262144, 65536] : [256, 1024];
			do {
				const size = isLarge && index < 10 ? 1024 * 1024 : sizes[index % sizes.length];
				const lines: string[] = [];
				let length = 0;
				for (let line = 0; length < size; line++) {
					const digest = Crypto.createHash('sha256').update(`${seed}:${id}:${index}:${line}`).digest('hex');
					const text = `test case ${line}: ${digest}; expected value ${line % 31}; Unicode café 😀\n`;
					lines.push(text);
					length += Buffer.byteLength(text);
				}
				const record = JSON.stringify(this._record(cwd, id, seed, index, lines.join(''), isCodex))
					+ (index % 2 === 0 ? '\n' : '\r\n');
				Fs.writeSync(descriptor, record);
				bytes += Buffer.byteLength(record);
				index++;
			} while (isLarge ? bytes < 160 * 1024 * 1024 : index < sizes.length);
			if ((index - 1) % 4 === 2) {
				Fs.writeSync(descriptor, JSON.stringify(this._record(cwd, id, seed, index++,
					'Synthetic tool completed successfully.', isCodex)) + '\n');
			}
			const final = this._record(cwd, id, seed, index, `Final synthetic fact: ${seed}: ${id}.`, isCodex, true);
			Fs.writeSync(descriptor, JSON.stringify(final) + '\n');
		} finally {
			Fs.closeSync(descriptor);
		}
	}
}
