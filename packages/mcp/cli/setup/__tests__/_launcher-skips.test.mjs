/**
@module test/setup/launcher-skips

A gate that was skipped is a fact a reader can find, not a message that scrolled
by. The hook writes one line when it cannot run the validator, and doctor prints
the last one: the difference between "the security gate is on" and "it was off
yesterday at 14:02" is the whole point of recording it.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { appendSkip, lastSkip, skipLogPath, trimSkips } from "../_launcher-skips.js";

const root = mkdtempSync(join(tmpdir(), "rule-skips-"));

test.after(() => rmSync(root, { recursive: true, force: true }));

test("a skip is one line, and the log lives under state/", () => {
  const row = appendSkip({ root, reason: "commit-msg: rule-mcp exists but cannot run", now: () => "2026-10-29T14:02:11Z" });

  assert.equal(skipLogPath({ root }), join(root, "state", "launcher-skips.log"));
  assert.equal(readFileSync(skipLogPath({ root }), "utf8"), "2026-10-29T14:02:11Z commit-msg: rule-mcp exists but cannot run\n");
  assert.deepEqual(row, { at: "2026-10-29T14:02:11Z", reason: "commit-msg: rule-mcp exists but cannot run" });
});

test("the last skip is the last line, and its date is readable", () => {
  appendSkip({ root, reason: "pre-push: rule-mcp is not on PATH", now: () => "2026-10-29T15:00:00Z" });
  const last = lastSkip({ root });

  assert.equal(last.reason, "pre-push: rule-mcp is not on PATH");
  assert.equal(last.at, "2026-10-29T15:00:00Z");
});

test("no log means no skip, not an error", () => {
  assert.equal(lastSkip({ root: join(root, "empty") }), undefined);
});

test("the log is capped, and the newest lines are the ones kept", () => {
  const small = join(root, "capped");

  for (let index = 0; index < 12; index += 1) {
    appendSkip({ root: small, reason: `skip ${index}`, now: () => `2026-10-29T15:00:${String(index).padStart(2, "0")}Z` });
  }

  const trimmed = trimSkips({ root: small, keep: 5 });
  const lines = readFileSync(skipLogPath({ root: small }), "utf8")
    .trim()
    .split("\n");

  assert.equal(trimmed, 5);
  assert.equal(lines.length, 5);
  assert.match(lines.at(-1), /skip 11$/u, "the newest line survives the trim");
});

test("a log that is not there is nothing to trim", () => {
  assert.equal(trimSkips({ root: join(root, "nope"), keep: 3 }), 0);
});

test("a line that is not timestamped still reads as the last skip", () => {
  const odd = join(root, "odd");

  appendSkip({ root: odd, reason: "first", now: () => "2026-10-29T15:00:00Z" });
  writeFileSync(skipLogPath({ root: odd }), `${readFileSync(skipLogPath({ root: odd }), "utf8")}a bare line\n`);

  assert.equal(lastSkip({ root: odd }).reason, "a bare line");
});

test("a skip the doctor reads is the same line the hook writes", async () => {
  const { hookBody } = await import("../../../core/commit/_hook.js");
  const { appendSkip: append } = await import("../_launcher-skips.js");
  const written = append({ root, reason: "pre-push: rule-mcp exists but cannot run", now: () => "2026-10-29T16:00:00Z" });

  assert.match(hookBody("pre-push", "rule-mcp", { root }), /launcher-skips\.log/u, "the hook writes the file the reader opens");
  assert.equal(lastSkip({ root }).at, written.at);
});
