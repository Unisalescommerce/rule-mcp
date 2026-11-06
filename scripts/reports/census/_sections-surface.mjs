/**
 * @module scripts/reports/census/_sections-surface
 *
 * The sections that describe what the server serves: the counted summary, the
 * skill catalog, and the prompts.
 */

import { AREA_SUBJECT } from "./_areas.data.mjs";
import { firstSentence, table, toolOf } from "./_format.mjs";
import { COMMAND_TARGETS, HOOK_EVENTS, activeRoles, cliCommands, getSkillMetadata, personaCommandName } from "./_registries.mjs";

/** The counted summary, and the one number that needs explaining. */
export function summarySection(data) {
  return [
    "## Surface at a glance",
    "",
    ...table(
      ["Surface", "Count", "Defined in"],
      [
        ["MCP tools", data.tools.length, "`packages/mcp/tools/*` via `packages/mcp/tools/router/index.js`"],
        ["- action tools", data.actionTools.length, "one per module, registered explicitly"],
        ["- skill tools", data.skillTools.length, "one per catalog skill, generated"],
        ["MCP resources", data.resources.length, "`packages/mcp/resources/index.js`"],
        ["MCP prompts", data.prompts.length, "`packages/mcp/prompts/index.js`"],
        ["- reusable", data.reusablePrompts.length, "workflow and area prompts"],
        ["- persona", data.personaPrompts.length, `${activeRoles().length} active roles, one command each`],
        ["Skills", data.catalog.length, "`skills/rule-*/SKILL.md`"],
        ["Review personas", data.roles.length, "`packages/mcp/core/review/roles/index.js`"],
        ["Guardrail rules", data.guardrailIds.size, "`skills/*/guardrails/` and `packages/mcp/core/guardrails/index.js`"],
        ["Agent slash commands", data.commands.length, "`packages/mcp/core/agents/commands/index.js`"],
        ["Agent/IDE command targets", COMMAND_TARGETS.length, "`packages/mcp/core/agents/command-targets/index.js`"],
        ["CLI commands", cliCommands().length, "`packages/mcp/cli/_program.js`"],
        ["Hook events", HOOK_EVENTS.length, "`packages/mcp/core/agents/_hooks.js`"],
        ["Architecture decisions", data.adrs.length, "[`docs/adr/ADR.md`](adr/ADR.md)"],
      ].map((row) => row.map(String)),
    ),
    "",
  ];
}

/** The catalog, grouped the way the areas already group it. */
export function skillCatalogSection(data) {
  const areas = [...data.areas.entries()].sort(([left], [right]) => left.localeCompare(right));

  return [
    `## Skills (${data.catalog.length})`,
    "",
    "A skill is the source of truth for its topic. Each skill has one tool.",
    "[The guardrails page](19-guardrails.md) lists the rules that a skill checks.",
    "",
    "The router directory, `skills/rule/`, has no skill tool.",
    `So the catalog has ${data.catalog.length} skills and \`skills/\` has ${data.skillDirs.length} directories.`,
    "",
    ...table(
      ["Area", "Skills", "Covers"],
      areas.map(([area, names]) => [`[${area}](#${area})`, names.length, AREA_SUBJECT[area] ?? ""]),
    ),
    "",
    ...areas.flatMap(([area, names]) => [
      `### ${area}`,
      "",
      ...table(
        ["Skill", "Tool", "Frameworks", "Description"],
        names.map((name) => {
          const meta = getSkillMetadata(name) ?? {};

          return [`\`${name}\``, `\`${toolOf(name)}\``, (meta.frameworks ?? []).join(", ") || "-", meta.description ?? ""];
        }),
      ),
      "",
    ]),
  ];
}

/** The prompt surface, reusable and generated. */
export function promptSection(data) {
  return [
    `## MCP prompts (${data.prompts.length})`,
    "",
    `${data.reusablePrompts.length} reusable prompts, plus ${data.personaPrompts.length} generated from the persona registry.`,
    "Claude Code gets `/rule-*` command files with the same names. The install hides these prompts there.",
    "",
    "### Reusable",
    "",
    ...table(
      ["Prompt", "Arguments", "Description"],
      data.reusablePrompts.map((prompt) => [
        `\`/${prompt.name}\``,
        (prompt.arguments ?? []).map((argument) => (argument.required ? `<${argument.name}>` : `[${argument.name}]`)).join(" ") || "-",
        firstSentence(prompt.description),
      ]),
    ),
    "",
    "### Persona, one per role",
    "",
    "There is one command per role. The request sets the depth of the run:",
    "",
    "- If the request names a review, the run does the audit and the review.",
    "- If the request names a plan, the run does the audit, the review and the plan.",
    "- In all other cases, the run does the audit only.",
    "",
    "Each command accepts an optional free-text `topic`. The topic sets the focus of the run.",
    "",
    ...table(
      ["Role", "Command"],
      activeRoles().map((role) => [`\`${role.id}\``, `\`/${personaCommandName(role.id)}\``]),
    ),
    "",
  ];
}
