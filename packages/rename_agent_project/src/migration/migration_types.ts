import type Sqlite from 'node:sqlite';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	MigrationTypes — shared migration records and backup formats
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** A value represented by a JSON document. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** A JSON object with named values. */
export type JsonObject = {
	/** Named JSON value. */
	[key: string]: JsonValue;
};

/** Original and replacement project roots. */
export type PathMapping = {
	/** Original absolute directory. */
	from: string;
	/** Replacement absolute directory. */
	to: string;
};

/** Validated paths and application selection for a migration. */
export type MigrationOptions = PathMapping & {
	/** Codex storage directory. */
	codexHome: string;
	/** Claude Code storage directory. */
	claudeHome: string;
	/** Claude Code global configuration file. */
	claudeConfig: string;
	/** Applications included in the migration. */
	only: 'codex' | 'claude' | 'both';
};

/** Checksums before and after a streamed transformation. */
export type FileHashes = {
	/** Original file checksum. */
	before: string;
	/** Replacement file checksum. */
	after: string;
};

/** A top-level path field to rewrite in newline-separated JSON records. */
export type RecordRewrite = {
	/** Only this field is eligible for changes; message content is never traversed. */
	field: 'cwd' | 'project';
	/** Ordered complete path-prefix mappings. */
	mappings: PathMapping[];
};

/** Exact replacement within a file, using JavaScript string offsets. */
export type FileEdit = {
	/** Inclusive start in the original text. */
	start: number;
	/** Exclusive end in the original text. */
	end: number;
	/** Replacement text. */
	value: string;
};

/** Planned file replacement, with compatibility for existing operation records. */
export type FileChange = {
	/** Original absolute file path. */
	path: string;
} & ({
	/** Original contents in an older saved plan. */
	original: string;
	/** Replacement contents in an older saved plan. */
	updated: string;
} | {
	/** Original contents checksum. */
	before: string;
	/** Replacement contents checksum. */
	after: string;
	/** Ordered, nonoverlapping replacements in the original text. */
	edits: FileEdit[];
} | {
	/** Original contents checksum. */
	before: string;
	/** Replacement contents checksum. */
	after: string;
	/** Record transformation; no transcript text or per-record edits are stored. */
	rewrite: RecordRewrite;
});

/** Codex conversation fields changed by migration. */
export type DatabaseFields = {
	/** Saved working directory. */
	cwd: string;
	/** Serialized sandbox permissions. */
	sandbox_policy: string;
};

/** Codex index fields needed to identify and migrate a conversation. */
export type CodexRow = DatabaseFields & {
	/** Permanent conversation identifier. */
	id: string;
	/** Canonical transcript file path. */
	rollout_path: string;
};

/** Original and replacement fields of a selected database row. */
export type RowChange = {
	/** Permanent conversation identifier. */
	id: string;
	/** Original fields. */
	before: DatabaseFields;
	/** Replacement fields. */
	after: DatabaseFields;
};

/** Selected changes belonging to one database. */
export type DatabaseChange = {
	/** Absolute SQLite database path. */
	path: string;
	/** Conversation rows to update. */
	rows: RowChange[];
};

/** Conversation displayed in the migration preview. */
export type Conversation = PathMapping & {
	/** Application that owns the conversation. */
	application: 'Codex' | 'Claude Code';
	/** Permanent conversation identifier. */
	id: string;
};

/** Complete preview of the selected storage changes. */
export type MigrationPlan = PathMapping & {
	/** Format version. */
	version: 1;
	/** Planned file replacements. */
	files: FileChange[];
	/** Planned project storage moves. */
	moves: PathMapping[];
	/** Planned database updates. */
	databases: DatabaseChange[];
	/** Warnings about excluded records; absent in older saved plans. */
	warnings?: string[];
	/** Conversations included in the preview. */
	conversations: Conversation[];
};

/** Restore information for one changed file. */
export type BackupFile = {
	/** Original absolute file path. */
	path: string;
	/** Relative backup filename. */
	backup: string;
	/** Original contents checksum. */
	before: string;
	/** Migrated contents checksum. */
	after: string;
	/** Original access permissions. */
	mode: number;
};

/** Restore information for one project storage move. */
export type BackupMove = PathMapping & {
	/** Directory contents checksum before migration. */
	before: string;
	/** Directory contents checksum after migration. */
	after: string;
};

/** Versioned restoration information written before migration. */
export type BackupManifest = PathMapping & {
	/** Format version. */
	version: 1;
	/** Changed file backups. */
	files: BackupFile[];
	/** Moved project directories. */
	moves: BackupMove[];
	/** Original and replacement database fields. */
	databases: DatabaseChange[];
};

/** Database connection held while selected rows are checked and updated. */
export type OpenDatabase = {
	/** Open SQLite connection. */
	databaseSync: Sqlite.DatabaseSync;
	/** Selected changes for this connection. */
	entry: DatabaseChange;
};

/** Optional replacement contents used to calculate a directory checksum. */
export type TreeReplacement = {
	/** Absolute file path. */
	path: string;
	/** Planned replacement contents. */
	updated?: string;
	/** Explicit contents checksum used during interrupted restoration. */
	hash?: string;
};

/** Command-line options before migration-specific validation. */
export type CommandOptions = {
	/** Original project directory. */
	from?: string;
	/** Replacement project directory. */
	to?: string;
	/** Selected application name. */
	only: string;
	/** Codex storage directory. */
	codexHome: string;
	/** Claude Code storage directory. */
	claudeHome: string;
	/** Optional global configuration override. */
	claudeConfig?: string;
	/** Backup destination for migration. */
	backup?: string;
	/** Existing backup directory to restore. */
	restore?: string;
	/** Whether the command writes data. */
	apply?: boolean;
	/** Operation directory whose durable status should be displayed. */
	status?: string;
	/** Return after the independent worker starts. */
	detach?: boolean;
};
