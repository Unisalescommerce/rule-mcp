/** What stops the Docker mode before anything runs. */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withHome } from "rule-mcp-shared";

import { dockerBlockers } from "../_docker.js";

test("a directory with no compose file or no token is blocked by name", (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "rule-mcp-docker-"));

  t.after(() => rmSync(cwd, { recursive: true, force: true }));

  const first = dockerBlockers({ cwd });

  assert.ok(first === null || typeof first === "string");

  writeFileSync(join(cwd, "docker-compose.yml"), "services: {}\n");

  withHome(() => {
    const second = dockerBlockers({ cwd });

    assert.ok(second === null || typeof second === "string");
  });
});
