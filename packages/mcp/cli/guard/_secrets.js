/**
@module cli/guard/secrets

What the betterleaks scan says about the patch a commit would add.

The guardrail collector reads the file extensions it knows how to check, so a
`.env`, a workflow file and a `Dockerfile` never reach it. This collector
reads the patch instead and therefore sees every staged file, which is the
whole reason it exists next to `stagedFailures`.

It answers with `installed` as well as `scanned`, because the two failures are
not the same: a binary that is not there is a repository that has not adopted
the gate yet and must not be nagged on every commit, while a binary that is
there and broke is a scan somebody believes they are running.

@see module:core/secrets/betterleaks - the scan itself
@see module:core/secrets/probe - whether the binary is there
*/

import { probeBetterleaks, scanStaged } from "@mcp/core/secrets/index.js";

/**
The secret scan of the staged patch.

@param {{ probe?: Function, scan?: Function, cwd?: string }} [options] - Injected dependencies and repository directory
@returns {{ installed: boolean, scanned: boolean, findings: Array<object>, reason: string }}
*/
export function secretFailures({ probe = probeBetterleaks, scan = scanStaged, cwd } = {}) {
  const answer = probe();

  if (!answer.available || !answer.supported) {
    return { installed: answer.available, scanned: false, findings: [], reason: answer.reason };
  }

  return { installed: true, ...scan({ cwd }) };
}
