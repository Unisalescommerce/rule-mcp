/**
@module cli/commands/secrets

`rule-mcp secrets`: the credential gate, run where a person can see it.

The commit hook stays silent when betterleaks is not installed, because a
hook that asks on every commit until somebody installs a tool gets switched
off. This command is the other half of that policy: the absence is loud here,
and here is where a CI job and a release checklist look.

Three exits, three answers: `0` nothing found, `1` credentials found, `2` the
scan did not run. The third one is not `0` on purpose - a scan that could not
happen must never read as a clean patch.

@see module:core/secrets/betterleaks - the scan
@see module:cli/guard/secrets - the same scan, inside the commit hook
*/

import { probeBetterleaks, scanRange, scanStaged } from "@mcp/core/secrets/index.js";

/** The prefix every line of the report carries. */
const TAG = "rule-mcp secrets";

/** One finding, as a person reads it. */
const line = ({ path, line: at, ruleId, description }) => `${path}:${at} ${ruleId}${description ? ` (${description})` : ""}`;

/**
Run the gate.

@param {{ range?: string, repo?: string, json?: boolean }} [options]
@param {{ probe?: Function, staged?: Function, ranged?: Function, write?: (text: string) => void, writeError?: (text: string) => void }} [io]
@returns {number} the process exit code
*/
export function secretsCommand(options = {}, io = {}) {
  const { probe = probeBetterleaks, staged = scanStaged, ranged = scanRange, write = (text) => process.stdout.write(text), writeError = (text) => process.stderr.write(text) } = io;
  const { range = "", repo, json = false } = options;
  const answer = probe();

  if (!answer.available || !answer.supported) {
    writeError(`${TAG}: nothing scanned - ${answer.reason}\nInstall betterleaks v2 to gate a commit on credentials.\n`);

    return 2;
  }

  const result = range ? ranged(range, { cwd: repo }) : staged({ cwd: repo });

  if (!result.scanned) {
    writeError(`${TAG}: nothing scanned - ${result.reason}\n`);

    return 2;
  }

  if (json) {
    write(`${JSON.stringify(result.findings, null, 2)}\n`);

    return result.findings.length === 0 ? 0 : 1;
  }

  if (result.findings.length === 0) {
    write(`${TAG}: no credentials found\n`);

    return 0;
  }

  write(`${result.findings.map(line).join("\n")}\n\n${TAG}: ${result.findings.length} finding(s). Rotate what is real, commit the fix, never the secret.\n`);

  return 1;
}
