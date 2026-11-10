import type { JsonObject, JsonValue } from './migration_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	JsonRecords — parses stored JSON values and checks object boundaries
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Reads JSON without exposing untyped values to migration code. */
export class JsonRecords {
	/**
	 * @param value Serialized JSON value.
	 * @returns The parsed JSON value.
	 */
	static parse(value: string): JsonValue {
		return JSON.parse(value) as JsonValue;
	}

	/**
	 * @param value Parsed JSON value that should be an object.
	 * @param source Description used when the value has the wrong shape.
	 * @returns The checked JSON object.
	 */
	static object(value: JsonValue | undefined, source: string): JsonObject {
		if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
			throw new Error(`Expected a JSON object in ${source}.`);
		}
		return value;
	}
}
