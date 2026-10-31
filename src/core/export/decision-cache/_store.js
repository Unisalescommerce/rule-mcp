/**
@module core/export/decision-cache/store

Export-owned decision cache (EX-04 / EX-08). Not the L3 routing gate cache.
*/

import { SCHEMA_VERSION, SOURCES, STATUSES, cacheEnabled, readStore, writeStore } from "./_io.js";

export { SCHEMA_VERSION } from "./_io.js";

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

/**
 * Write one confirmed decision (the `/rule-keep` path).
 *
 * @param {{ projectDir: string, fingerprint: string, choice: unknown, source?: string, agent?: string }} options
 * @returns {{ ok: boolean, record?: object, reason?: string }}
 */
export function keepDecision({ projectDir, fingerprint, choice, source = "rule-keep", agent }) {
  return putDecision({ projectDir, fingerprint, choice, status: "confirmed", source, agent });
}
