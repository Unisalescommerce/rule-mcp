/**
@module test/setup/attribution-task

The install step that applies attribution. It writes only the agents a page
documents, reports the ones it left alone with the reason, and never touches a
file for an agent whose row says `unverified`.

@see docs/adr/_pending/attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "rule-attribution-home-"));

process.env.HOME = home;
mkdirSync(join(home, ".claude"), { recursive: true });

const { attributionTargets, attributionTask } = await import("../../setup/_task-attribution.js");

const claudeSettings = join(home, ".claude", "settings.json");

test.after(() => rmSync(home, { recursive: true, force: true }));

test("only the agents with a cited control are written, the rest are named", () => {
  const { targets, skipped } = attributionTargets();

  assert.deepEqual(targets.map((row) => row.agent), ["claude"], "gemini documents no control, so it is not a target");
  assert.ok(skipped.some((entry) => entry.agent === "gemini" && /no attribution control/.test(entry.reason)));
  assert.ok(skipped.some((entry) => entry.agent === "codex" && /not documented/.test(entry.reason)));
});

test("narrowing by agent keeps only that agent", () => {
  const { targets } = attributionTargets({ agents: ["claude"] });

  assert.deepEqual(targets.map((row) => row.agent), ["claude"]);
  assert.deepEqual(attributionTargets({ agents: ["codex"] }).targets, [], "an undocumented agent is not a target");
});

test("hide writes the documented value into the agent's own file", () => {
  writeFileSync(claudeSettings, `${JSON.stringify({ theme: "dark" }, null, 2)}\n`);

  const result = attributionTask({ mode: "hide" }).run({ dryRun: false });

  assert.equal(result.status, "ok");
  assert.deepEqual(JSON.parse(readFileSync(claudeSettings, "utf8")), { theme: "dark", attribution: false });
  assert.ok(result.lines.some((line) => /skipped\s+gemini/.test(line)), "the untouched agents are reported");
});

test("keep removes only what a hide wrote", () => {
  writeFileSync(claudeSettings, `${JSON.stringify({ theme: "dark", attribution: false }, null, 2)}\n`);

  attributionTask({ mode: "keep" }).run({ dryRun: false });

  assert.deepEqual(JSON.parse(readFileSync(claudeSettings, "utf8")), { theme: "dark" });
});

test("a dry run reports the file and writes nothing", () => {
  writeFileSync(claudeSettings, `${JSON.stringify({ theme: "dark" }, null, 2)}\n`);
  const before = readFileSync(claudeSettings, "utf8");

  const result = attributionTask({ mode: "hide" }).run({ dryRun: true });

  assert.ok(result.lines.some((line) => line.includes(".claude/settings.json")));
  assert.equal(readFileSync(claudeSettings, "utf8"), before);
});

test("an agent with no settings file is created, not skipped", () => {
  rmSync(claudeSettings, { force: true });

  attributionTask({ mode: "hide" }).run({ dryRun: false });

  assert.ok(existsSync(claudeSettings));
  assert.deepEqual(JSON.parse(readFileSync(claudeSettings, "utf8")), { attribution: false });
});
