/**
 * @module test/installers/host-evidence
 *
 * The gate of Phase 0: every agent the installer knows has one evidence row, and
 * no row claims a documented mechanism without a page behind it.
 *
 * The value of the table is that it can be wrong out loud. A row that says
 * `research` is a gap somebody can pick up; a row that says `confirmed` with no
 * source is the same gap wearing a claim, which is how a compatibility table
 * starts lying.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { allAgents } from "../../src/cli/installers/index.js";
import {
  EVIDENCE_STATUSES,
  HOST_ALIASES,
  HOST_EVIDENCE,
  evidenceOf,
  hostsWithoutInstaller,
  resolvedConflicts,
  unbackedClaims,
} from "../../src/cli/installers/hosts/_evidence.data.js";

const KINDS = new Set(["cli", "ide", "hybrid", "cloud"]);
const ids = HOST_EVIDENCE.map((row) => row.id);

test("every catalog agent has exactly one evidence row", () => {
  const missing = allAgents.filter((agent) => !evidenceOf(agent));

  assert.deepEqual(missing, [], "these agents are installed by code with no evidence behind them");
  assert.equal(new Set(ids).size, ids.length, "a row id appears twice");
});

test("a row is complete and its status is from the closed vocabulary", () => {
  for (const row of HOST_EVIDENCE) {
    assert.ok(EVIDENCE_STATUSES.includes(row.status), `${row.id}: unknown status "${row.status}"`);
    assert.ok(KINDS.has(row.kind), `${row.id}: unknown kind "${row.kind}"`);
    assert.ok(row.label.trim() !== "", `${row.id}: no label`);
    assert.ok(row.note.trim().length > 20, `${row.id}: the note has to say what the mechanism is`);
    assert.ok(Array.isArray(row.sources) && row.sources.length > 0, `${row.id}: no source`);
    assert.equal(typeof row.installer, "boolean", `${row.id}: installer must be a boolean`);
  }
});

test("no confirmed row is a claim without a page", () => {
  assert.deepEqual(
    unbackedClaims().map((row) => row.id),
    [],
    "a confirmed row cites an https page, or it is not confirmed",
  );
});

test("a documented host without an installer is marked as a gap, not hidden", () => {
  assert.deepEqual(
    hostsWithoutInstaller()
      .map((row) => row.id)
      .sort(),
    ["aider", "amp", "continue", "cursor-cli", "goose", "junie", "openhands", "trae"],
    "the eight products the study measured with no installer row today",
  );
  assert.equal(HOST_EVIDENCE.length, 31, "the study measures 31 distinct products: windsurf is a deprecated name for devin");
});

test("a deprecated name resolves to the row that owns it", () => {
  assert.equal(evidenceOf("windsurf")?.id, "devin", "windsurf is devin's old name");
  assert.deepEqual(Object.keys(HOST_ALIASES), ["windsurf"], "one alias, and it is recorded rather than implied");
  assert.equal(evidenceOf("no-such-host"), null, "an unknown name answers null instead of a guess");
});

test("the contradictions were resolved, not only recorded", () => {
  const conflicts = HOST_EVIDENCE.filter((row) => row.conflict)
    .map((row) => row.id)
    .sort();

  assert.deepEqual(conflicts, ["codex", "roo"], "Phase 0's second item names exactly these two");
  assert.deepEqual(
    resolvedConflicts()
      .map((row) => row.id)
      .sort(),
    ["codex", "roo"],
    "a conflict without a resolution is an open question wearing a table row",
  );
});

test("the Roo Code row rests on a live page, and the tree no longer says otherwise", () => {
  const roo = evidenceOf("roo");
  const hooks = readFileSync(new URL("../../src/cli/install/_hook-hosts.js", import.meta.url), "utf8");

  assert.equal(roo.status, "confirmed", "the documentation documents the command files");
  assert.ok(
    roo.sources.some((url) => url.startsWith("https://roocodeinc.github.io")),
    "and the row cites it",
  );
  assert.doesNotMatch(hooks, /shut down in May 2026/u, "the retired claim is gone from the hook table");
});
