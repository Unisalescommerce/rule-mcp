/**
@module cli/commands/check

`rule-mcp check`: the guardrails as a gate a merge script, a CI job or a hook
can call on a set of files.

The engine is the one every other surface runs: the skill layers and the
project config are installed for the project root, each file goes to the
skills `skillsForPath` routes it to, and `checkCode` answers. Three exits:
`0` no `block` finding, `1` at least one, `2` the check did not run. The third
is not `0` on purpose - a check that could not happen must never read as a
clean one.

Decision: docs/adr/_pending/rule-mcp-check-runs-the-guardrails-on-changed-staged-or-named-files.md
*/

import { join } from "node:path";

import { checkCode } from "@mcp/core/guardrails/index.js";
import { installSkillGuardrails } from "@mcp/core/skills/_guardrail-layers.js";
import { findProjectRoot } from "../paths/index.js";
import { skillsForPath } from "../guard/_route.js";
import { collectFiles } from "./_check-files.js";

/** The prefix every line on stderr carries. */
const TAG = "rule-mcp check";

/**
Every finding for one file, across the skills it routes to. A rule two skills
share reports once, under the first skill that ran it - unless a later skill
grades it `block` where the first graded it `warn`: the stricter answer wins,
so a duplicate id can never turn a block finding into a warning.

@param {string} file
@param {string} code
@param {string} root
@returns {Array<{ skill: string, rule: string, severity: string, file: string, detail: string[], suggestion: string }>}
*/
function findingsFor(file, code, root) {
  const byRule = new Map();

  for (const skill of skillsForPath(file)) {
    const report = checkCode(skill, code, { fileName: file, filePath: join(root, file) });

    for (const rule of [...report.failed, ...(report.advisory ?? [])]) {
      const severity = rule.severity ?? "block";
      const earlier = byRule.get(rule.id);

      if (earlier && !(earlier.severity === "warn" && severity === "block")) {
        continue;
      }

      byRule.set(rule.id, { skill, rule: rule.id, severity, file, detail: rule.detail ?? [], suggestion: rule.suggestion ?? "" });
    }
  }

  return [...byRule.values()];
}

/**
Run the gate.

@param {{ changed?: boolean, staged?: boolean, files?: string, base?: string, json?: boolean, dir?: string }} [options]
@param {{ write?: (text: string) => void, writeError?: (text: string) => void }} [io]
@returns {Promise<number>} the process exit code
*/
export async function checkCommand(options = {}, io = {}) {
  const { write = (text) => process.stdout.write(text), writeError = (text) => process.stderr.write(text) } = io;
  const sources = [options.changed, options.staged, options.files !== undefined].filter(Boolean).length;

  if (sources !== 1) {
    writeError(`${TAG}: choose exactly one of --changed, --staged or --files\n`);

    return 2;
  }

  const root = findProjectRoot(options.dir ?? ".");
  const { problems } = await installSkillGuardrails({ cwd: root });

  // What the bundled catalog could not load is the server's to fix, not the
  // project's: only the project and user layers are named here.
  for (const { file, skill, layer, reason } of problems) {
    if (layer !== "native") {
      writeError(`${TAG}: ${skill ?? file}: ${reason}\n`);
    }
  }

  const findings = [];

  try {
    const { files, read } = collectFiles(root, options);

    for (const file of files.toSorted()) {
      if (skillsForPath(file).length === 0) {
        continue;
      }

      const code = read(file);

      if (code !== null) {
        findings.push(...findingsFor(file, code, root));
      }
    }
  } catch (error) {
    writeError(`${TAG}: nothing checked - ${error.stderr?.toString().trim() || error.message}\n`);

    return 2;
  }

  const blocking = findings.filter((finding) => finding.severity === "block").length;

  if (options.json) {
    write(`${JSON.stringify(findings, null, 2)}\n`);
  } else {
    const lines = findings.map(({ file, severity, rule, skill, suggestion }) => `${file}: ${severity.padEnd(5)} ${rule} (${skill}) - ${suggestion}`);

    write(`${[...lines, `${TAG}: ${blocking} blocking, ${findings.length - blocking} warning(s)`].join("\n")}\n`);
  }

  return blocking > 0 ? 1 : 0;
}
