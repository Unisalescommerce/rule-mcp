/**
@module core/export/decision-cache/store

Export-owned decision cache (EX-04 / EX-08). Not the L3 routing gate cache.
Persists under the project telemetry directory as `decision-cache.json`.
*/

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getProjectPaths } from "@src/cli/paths/index.js";

/** Bump only when a reader must refuse older files. */
export const SCHEMA_VERSION = 1;

const STATUSES = new Set(["pending", "confirmed", "rejected"]);
const SOURCES = new Set(["rule-keep", "rule-export-interview", "rule-adr"]);

const cacheEnabled = () => process.env.RULE_MCP_NO_CACHE !== "1";

/** @param {string} projectDir @returns {string} */
function cacheFile(projectDir) {
  return join(getProjectPaths(projectDir).dir, "decision-cache.json");
}

/** @param {string} projectDir @returns {{ schemaVersion: number, records: object[] }} */
function readStore(projectDir) {
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
function writeStore(projectDir, store) {
  const { dir } = getProjectPaths(projectDir);

  mkdirSync(dir, { recursive: true });
  writeFileSync(cacheFile(projectDir), JSON.stringify(store, undefined, 2));
}

/**
 * Insert or replace one decision by fingerprint.
 *
 * @param {{
 *   projectDir: string,
 *   fingerprint: string,
 *   choice: unknown,
 *   status: string,
 *   source: string,
 *   agent?: string,
 *   now?: number,
 * }} options
 * @returns {{ ok: boolean, record?: object, reason?: string }}
 */
export function putDecision({
  projectDir,
  fingerprint,
  choice,
  status,
  source,
  agent,
  now = Date.now(),
}) {
  if (!cacheEnabled()) {
    return { ok: false, reason: "NO_CACHE" };
  }

  if (!fingerprint || !STATUSES.has(status) || !SOURCES.has(source)) {
    return { ok: false, reason: "invalid" };
  }

  const store = readStore(projectDir);
  const record = {
    schemaVersion: SCHEMA_VERSION,
    fingerprint,
    choice,
    status,
    source,
    agent: agent ?? undefined,
    project: projectDir,
    updatedAt: now,
    createdAt: store.records.find((row) => row.fingerprint === fingerprint)?.createdAt ?? now,
  };

  store.records = [...store.records.filter((row) => row.fingerprint !== fingerprint), record];
  writeStore(projectDir, store);

  return { ok: true, record };
}

/**
 * @param {{ projectDir: string, fingerprint: string }} options
 * @returns {object|undefined}
 */
export function getDecision({ projectDir, fingerprint }) {
  if (!cacheEnabled()) {
    return;
  }

  return readStore(projectDir).records.find((row) => row.fingerprint === fingerprint);
}

/**
 * Transition status for an existing fingerprint.
 *
 * @param {{ projectDir: string, fingerprint: string, status: string, now?: number }} options
 * @returns {{ ok: boolean, record?: object, reason?: string }}
 */
export function setDecisionStatus({ projectDir, fingerprint, status, now = Date.now() }) {
  if (!cacheEnabled()) {
    return { ok: false, reason: "NO_CACHE" };
  }

  if (!STATUSES.has(status)) {
    return { ok: false, reason: "invalid" };
  }

  const existing = getDecision({ projectDir, fingerprint });

  if (!existing) {
    return { ok: false, reason: "missing" };
  }

  return putDecision({
    projectDir,
    fingerprint,
    choice: existing.choice,
    status,
    source: existing.source,
    agent: existing.agent,
    now,
  });
}

/**
 * @param {{ projectDir: string }} options
 * @returns {object[]}
 */
export function listDecisions({ projectDir }) {
  if (!cacheEnabled()) {
    return [];
  }

  return readStore(projectDir).records;
}
