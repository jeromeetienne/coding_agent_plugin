import type { MigrationOptions, MigrationPlan, PathMapping } from '../migration/migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OperationTypes — durable rename progress and process scope
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Paths and application selection for a complete folder rename. */
export type OperationOptions = MigrationOptions & {
	/** Optional private operation directory, which must not exist yet. */
	backup?: string;
};

/** One project directory entry captured without following symbolic links. */
export type ProjectEntry = {
	/** Path relative to the project root. */
	path: string;
	/** Filesystem entry kind. */
	kind: 'file' | 'directory' | 'link';
	/** Contents checksum or exact symbolic link target. */
	value: string;
	/** Access permissions. */
	mode: number;
};

/** Process proved to belong to the selected application storage or project. */
export type AgentProcess = {
	/** Operating system process identifier. */
	pid: number;
	/** Application name. */
	application: 'codex' | 'claude';
	/** Whether this is the shared Codex server rather than a client. */
	isDaemon: boolean;
	/** Whether the client is associated with the selected project. */
	isRelated: boolean;
	/** Terminal name used to identify the client for manual closure. */
	terminal?: string;
	/** Process start identity, used to avoid signalling a reused identifier. */
	identity: string;
};

/** Terminal result of a recorded operation. */
export type OperationState = 'queued' | 'running' | 'complete' | 'rolled_back' | 'failed' | 'recovery_required';

/** Git worktree paths before the main project moves. */
export type Worktree = PathMapping;

/** Durable operation state; no executable callbacks are stored here. */
export type OperationRecord = {
	/** Record format version. */
	version: 1;
	/** Unique operation identifier. */
	id: string;
	/** Original and destination paths and selected storage. */
	options: OperationOptions;
	/** Private operation directory outside the project. */
	directory: string;
	/** Exclusive lock belonging to this original project path. */
	lock: string;
	/** Worker process identifier. */
	pid?: number;
	/** Overall result. */
	state: OperationState;
	/** Instructions for manually closing affected clients or finishing selected work. */
	waitingFor?: string[];
	/** Current or last completed step. */
	phase: string;
	/** Last update in ISO format. */
	updated: string;
	/** Action taken by this worker. */
	action: 'rename' | 'restore';
	/** Selected migration, captured after applications stop. */
	plan?: MigrationPlan;
	/** Original project directory contents. */
	original?: ProjectEntry[];
	/** Last known safe contents at the renamed location. */
	renamed?: ProjectEntry[];
	/** Git worktree path mappings. */
	worktrees?: Worktree[];
	/** Expected metadata and unchanged Codex transcript checksums. */
	verification?: VerificationRecord;
	/** Counts of conversations by application. */
	counts: Record<'codex' | 'claude', number>;
	/** Error that caused the operation to stop. */
	error?: string;
	/** Supported-scope limitations reported to the caller. */
	limitations: string[];
};

/** Optional checkpoint used by deterministic failure tests. */
export type CheckpointFn = (phase: string) => void;

/** Expected database metadata and Codex transcript integrity. */
export type VerificationRecord = {
	/** Selected index row checksums; unrelated conversations may continue changing. */
	databases: {
		/** Database path. */
		path: string;
		/** Selected identifiers; absent only in older records that hashed the whole index. */
		ids?: string[];
		/** Expected original rows checksum. */
		before: string;
		/** Expected migrated rows checksum. */
		after: string;
	}[];
	/** Immutable Codex transcript checksums. */
	transcripts: {
		/** Canonical transcript path. */
		path: string;
		/** Original transcript contents checksum. */
		hash: string;
	}[];
};
