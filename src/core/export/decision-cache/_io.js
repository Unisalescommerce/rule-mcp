/**
@module core/export/decision-cache/io

Persistence helpers for the export-owned decision-cache.json.
*/

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getProjectPaths } from "@src/cli/paths/index.js";

/** Bump only when a reader must refuse older files. */
export const SCHEMA_VERSION = 1;

/** Allowed decision statuses. */
export const STATUSES = new Set(["pending", "confirmed", "rejected"]);

/** Allowed write sources for a decision record. */
export const SOURCES = new Set(["rule-keep", "rule-export-interview", "rule-adr"]);

/** @returns {boolean} whether cache writes are enabled */
export const cacheEnabled = () => process.env.RULE_MCP_NO_CACHE !== "1";

/** @param {string} projectDir @returns {string} */
export function cacheFile(projectDir) {
  return join(getProjectPaths(projectDir).dir, "decision-cache.json");
}

/** @param {string} projectDir @returns {{ schemaVersion: number, records: object[] }} */
export function readStore(projectDir) {
  try {
    const file = cacheFile(projectDir);

    if (!existsSync(file)) {
      return { schemaVersion: SCHEMA_VERSION, records: [] };
    }

    const parsed = JSON.parse(readFileSync(file, "utf8"));

    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.records)) {
      return { schemaVersion: SCHEMA_VERSION, records: [] };
    }

    return parsed;
  } catch {
    return { schemaVersion: SCHEMA_VERSION, records: [] };
  }
}

/** @param {string} projectDir @param {{ schemaVersion: number, records: object[] }} store */
export function writeStore(projectDir, store) {
  const { dir } = getProjectPaths(projectDir);

  mkdirSync(dir, { recursive: true });
  writeFileSync(cacheFile(projectDir), JSON.stringify(store, undefined, 2));
}
