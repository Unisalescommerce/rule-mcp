/** Session listing for an agent it does not know, and for one with no data. */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { listSessions } from "../_sessions.js";

test("an unknown agent is skipped with the reason", () => {
  const result = listSessions({ agent: "nobody", projectDir: "/tmp" });

  assert.equal(result.skipped, true);
  assert.match(result.reason, /unknown agent: nobody/u);
});

for (const agent of ["claude", "codex", "opencode", "pi", "cursor"]) {
  test(`${agent} on an empty home lists no sessions`, (t) => {
    const home = mkdtempSync(join(tmpdir(), "rule-mcp-sessions-"));

    t.after(() => rmSync(home, { recursive: true, force: true }));

    assert.equal(listSessions({ agent, projectDir: "/tmp/none", home }).sessions.length, 0);
  });
}
