/**
 * A hook we displaced must still fire.
 *
 * `writeHook` keeps a foreign hook as `<name>.rule-backup` and our body chains it
 * with `[ -x "$backup" ]`. The file was written without the executable bit, so a
 * backup nobody can run is a hook that silently stopped firing - on this machine,
 * tokensave's chain to the repository's own `pre-push` was stored 0644 and never
 * ran after integration.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { BACKUP_SUFFIX, writeHook } from "../_hook.js";

test("a displaced hook keeps its bytes and its executable bit", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-displaced-"));
  const path = join(dir, "pre-push");
  const foreign = '#!/bin/sh\necho "the other tool"\n';

  writeFileSync(path, foreign);

  const outcome = writeHook(dir, "pre-push");
  const backup = `${path}${BACKUP_SUFFIX}`;

  assert.equal(outcome, "integrated", "a foreign hook is integrated, not destroyed");
  assert.equal(readFileSync(backup, "utf8"), foreign, "the bytes are kept verbatim");
  assert.notEqual(statSync(backup).mode & 0o111, 0, "and it can run, or our chain to it is decorative");
});
