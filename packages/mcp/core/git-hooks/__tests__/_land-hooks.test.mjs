/** The landing hooks are idempotent, and a remove leaves tracked files alone. */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { applyLandHooks, planLandHooks, removeLandHooks } from "../_land-hooks.js";

const ATTRIBUTES = "docs/adr/ADR.md merge=rule-mcp-index\ndocs/handoff/HANDOFF.md merge=rule-mcp-index\n";

/** A fresh repository, removed when the test ends. */
function repository(t) {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-land-hooks-"));

  execFileSync("git", ["init", "-q"], { cwd: dir });
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  return dir;
}

test("a fresh repository has nothing installed", (t) => {
  const dir = repository(t);
  const plan = planLandHooks(dir);

  assert.deepEqual(
    plan.hooks.map((hook) => hook.status),
    ["missing", "missing"],
  );
  assert.equal(plan.driver, "missing");
  assert.equal(plan.attributes, "missing");
});

test("a tracked hook reads as present", (t) => {
  const dir = repository(t);

  mkdirSync(join(dir, ".githooks"));
  writeFileSync(join(dir, ".githooks", "post-merge"), "#!/bin/sh\n");

  assert.equal(planLandHooks(dir).hooks[0].status, "present");
});

test("apply writes the driver and tracked attributes, and a second run preserves them", (t) => {
  const dir = repository(t);

  assert.deepEqual(applyLandHooks(dir).written, ["driver", "attributes"]);
  assert.match(readFileSync(join(dir, ".gitattributes"), "utf8"), /ADR\.md merge=rule-mcp-index/u);

  const second = applyLandHooks(dir);

  assert.deepEqual(second.written, []);
  assert.deepEqual(second.preserved, ["driver", "attributes"]);
});

test("apply keeps the lines a .gitattributes already holds", (t) => {
  const dir = repository(t);

  writeFileSync(join(dir, ".gitattributes"), "*.png binary");
  applyLandHooks(dir);

  const text = readFileSync(join(dir, ".gitattributes"), "utf8");

  assert.match(text, /^\*\.png binary$/mu);
  assert.match(text, /HANDOFF\.md merge=rule-mcp-index/u);
});

test("a private install writes .git/info/attributes and leaves the tree clean", (t) => {
  const dir = repository(t);

  assert.ok(applyLandHooks(dir, { private: true }).written.includes("attributes"));
  assert.equal(existsSync(join(dir, ".gitattributes")), false);
  assert.equal(planLandHooks(dir, { private: true }).attributes, "private");
  assert.ok(applyLandHooks(dir, { private: true }).preserved.includes("attributes"));
});

test("a private install adds to an attributes file that already has lines", (t) => {
  const dir = repository(t);
  const file = join(dir, ".git", "info", "attributes");

  mkdirSync(join(dir, ".git", "info"), { recursive: true });
  writeFileSync(file, "*.lock -diff");
  applyLandHooks(dir, { private: true });

  assert.match(readFileSync(file, "utf8"), /^\*\.lock -diff$/mu);
  assert.match(readFileSync(file, "utf8"), /ADR\.md merge=rule-mcp-index/u);
});

test("remove takes the driver and the private lines, and keeps other private lines", (t) => {
  const dir = repository(t);
  const file = join(dir, ".git", "info", "attributes");

  applyLandHooks(dir, { private: true });
  writeFileSync(file, `*.lock -diff\n${readFileSync(file, "utf8")}`);

  assert.deepEqual(removeLandHooks(dir).removed, ["driver", "private-attributes"]);
  assert.equal(readFileSync(file, "utf8").trim(), "*.lock -diff");
  assert.deepEqual(removeLandHooks(dir).removed, [], "a second remove finds nothing");
});

test("remove leaves a tracked .gitattributes alone", (t) => {
  const dir = repository(t);

  writeFileSync(join(dir, ".gitattributes"), ATTRIBUTES);
  applyLandHooks(dir);
  removeLandHooks(dir);

  assert.equal(readFileSync(join(dir, ".gitattributes"), "utf8"), ATTRIBUTES);
});

test("a directory with no repository reports missing and remove does nothing", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-land-hooks-plain-"));

  t.after(() => rmSync(dir, { recursive: true, force: true }));

  assert.equal(planLandHooks(dir).driver, "missing");
  assert.equal(planLandHooks(dir).attributes, "missing");
  assert.deepEqual(removeLandHooks(dir).removed, []);
});
