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

/** Planned replacement of one file. */
export type FileChange = {
	/** Original absolute file path. */
	path: string;
	/** Contents before migration. */
	original: string;
	/** Contents after migration. */
	updated: string;
};

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
	/** Operator confirmation that storage writers have stopped. */
	applicationsStopped?: boolean;
};
