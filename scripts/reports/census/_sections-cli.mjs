/**
 * @module scripts/reports/census/_sections-cli
 *
 * The CLI reference: every command, with the arguments and options it reads.
 *
 * It is rendered from the commander program itself, not from a declaration
 * beside it. Commander owns both what parses and what `--help` prints, so a
 * second registry to render from would be the copy that goes stale: anything
 * this page says about a flag is a flag the binary actually reads.
 */

import { cell, table } from "./_format.mjs";
import { cliCommands } from "./_registries.mjs";

/** A markdown anchor for the heading this section writes. */
const anchor = (name) => `#rule-mcp-${name.replaceAll(/[^\w-]/gu, "")}`;

/** An empty cell reads better as a dash than as nothing. */
const orDash = (value) => (value === undefined || value === null || value === "" ? "-" : cell(String(value)));

/** One command: what it is, how it is typed, what it takes. */
function commandSection(entry) {
  return [
    `## rule-mcp ${entry.name}`,
    "",
    ...(entry.summary ? [entry.summary, ""] : []),
    "```sh",
    ["rule-mcp", entry.name, ...entry.args.map((argument) => argument.name)].join(" "),
    "```",
    "",
    ...(entry.args.length === 0
      ? []
      : [
          "**Arguments**",
          "",
          ...table(
            ["Argument", "Default", "Description"],
            entry.args.map((argument) => [`\`${argument.name}\``, orDash(argument.default), orDash(argument.description)]),
          ),
          "",
        ]),
    ...(entry.options.length === 0
      ? ["Takes no options beyond the global `-h, --help`.", ""]
      : [
          "**Options**",
          "",
          ...table(
            ["Flag", "Default", "Choices", "Description"],
            entry.options.map((option) => [
              `\`${option.flags}\``,
              orDash(option.default),
              Array.isArray(option.choices) ? option.choices.map((choice) => `\`${choice}\``).join(", ") : "-",
              orDash(option.description),
            ]),
          ),
          "",
        ]),
  ];
}

/** The whole reference: the index first, then one section per command. */
export function cliSection() {
  const commands = cliCommands();

  return [
    `## The commands (${commands.length})`,
    "",
    "This page lists each command with its arguments and options. The text comes",
    "from the definitions that parse them. `rule-mcp <command> --help` prints the same data.",
    "",
    "`rule-mcp` with no command starts the stdio server. An agent starts it this way. `-h, --help` works on every command; `-v, --version` prints",
    "the package version from anywhere. An error exits 1 and prints to stderr;",
    "`--help` exits 0.",
    "",
    ...table(
      ["Command", "Options", "What it does"],
      commands.map((entry) => [`[\`${entry.name}\`](${anchor(entry.name)})`, entry.options.length, orDash(entry.summary)]),
    ),
    "",
    ...commands.flatMap((entry) => commandSection(entry)),
  ];
}
