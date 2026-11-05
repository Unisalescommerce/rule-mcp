/** CI must scan the event's commits rather than the checked-out branch tip diff. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../../../.github/workflows/ci.yml", import.meta.url), "utf8");
const job = workflow.split("  secrets:\n", 2)[1].split("  test:\n", 1)[0];

test("CI selects event SHAs and handles new branches and manual runs", () => {
  assert.ok(job.includes("github.event.before"));
  assert.ok(job.includes("github.event.after"));
  assert.ok(job.includes("github.event.pull_request.base.sha"));
  assert.ok(job.includes("github.event.pull_request.head.sha"));
  assert.ok(job.includes('range="$head"'));
  assert.ok(!job.includes("git merge-base"));
  assert.ok(!job.includes('base="${{'));
});

test("CI pins the asset digest in the repository and requires the binary", () => {
  assert.ok(job.includes("230ef42dc3a0ee35e5148b7b4e9280224a412ef100cd4e74d3d6681d94e6ccb8"));
  assert.ok(job.includes('mkdir -p "$HOME/.local/bin"'));
  assert.ok(job.includes('test "$(betterleaks --version)" = "2.0.0-rc.7"'));
});
