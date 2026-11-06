/**
 * @module scripts/reports/census/_sections-env
 *
 * Where the code reads each `RULE_MCP_*` variable, and whether the code and the
 * hand-written table agree.
 *
 * Both directions matter. A variable the code reads and nobody documents cannot
 * be found. A variable the table promises and nothing reads does not exist.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { documentedEnvVars, envVarsInCode } from "./_env-scan.mjs";
import { table } from "./_format.mjs";
import { DOCS } from "./_registries.mjs";

/** The hand-written table of variables. */
export const ENV_TABLE = "10-env-variables.md";

/** The readers of every variable, then the two disagreement lists. */
export function envReadersSection() {
  const readers = envVarsInCode();
  const documented = documentedEnvVars(readFileSync(join(DOCS, ENV_TABLE), "utf8"));
  const undocumented = [...readers.keys()].filter((name) => !documented.has(name));
  const unread = [...documented].filter((name) => !readers.has(name));
  const names = (list) => list.map((name) => `\`${name}\``).join(", ");

  return [
    "## Where each variable is read",
    "",
    `This table lists the modules in \`packages/mcp/\`, \`packages/shared/\` and \`bin/\` that name each variable. [The variable table](${ENV_TABLE}) says what each variable does.`,
    "",
    ...table(
      ["Variable", "Read in"],
      [...readers.entries()].map(([name, paths]) => [`\`${name}\``, paths.map((path) => `\`${path}\``).join(", ")]),
    ),
    "",
    `The code reads ${readers.size} variables. The table documents ${documented.size}.`,
    "",
    undocumented.length > 0 ? `Read but not documented: ${names(undocumented)}.` : "The table documents every variable that the code reads.",
    "",
    unread.length > 0 ? `Documented but not read: ${names(unread)}.` : "The code reads every variable that the table documents.",
    "",
  ];
}
