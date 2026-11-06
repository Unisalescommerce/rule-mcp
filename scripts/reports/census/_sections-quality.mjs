/**
 * @module scripts/reports/census/_sections-quality
 *
 * The sections that describe how the server judges code: the persona registry,
 * the guardrail families, and the resource surface.
 */

import { FAMILY_SCOPE } from "./_areas.data.mjs";
import { table } from "./_format.mjs";
import { resourceKinds } from "./_registries.mjs";

/** One role, one axis. */
export function personaSection(data) {
  return [
    "## Review personas",
    "",
    "One role owns one axis. No lens belongs to two roles. A role is `active` or",
    "`proposed`.",
    "",
    ...table(
      ["Role", "Title", "Years", "Lenses", "Status", "Evidence skills"],
      data.roles.map((role) => [
        `\`${role.id}\``,
        role.role,
        role.yearsOfExperience,
        (role.lenses ?? []).length,
        role.status,
        (role.evidenceSkills ?? []).map((skill) => `\`${skill}\``).join(", ") || "-",
      ]),
    ),
    "",
    "## Lenses and aliases",
    "",
    "A lens is one thing that the role examines. An alias is a word that a request",
    "can use to reach the role.",
    "",
    ...data.roles.flatMap((role) => [
      `### ${role.role} (\`${role.id}\`)`,
      "",
      `- **Lenses**: ${(role.lenses ?? []).map((lens) => `\`${lens}\``).join("; ") || "-"}`,
      `- **Aliases**: ${(role.aliases ?? []).map((alias) => `\`${alias}\``).join(", ") || "-"}`,
      "",
    ]),
  ];
}

/** Every rule, with what it rejects, grouped by the family that carries it. */
export function guardrailSection(data) {
  const rules = new Map();

  for (const [family, list] of data.families) {
    for (const rule of list) {
      rules.set(rule.id, { rule, families: [...(rules.get(rule.id)?.families ?? []), family] });
    }
  }

  const baseline = new Set(data.families.filter(([name]) => data.baselineSkills?.has(name)).flatMap(([, list]) => list.map((rule) => rule.id)));
  const scope = (name) => (data.baselineSkills?.has(name) ? "Every check" : (FAMILY_SCOPE[name] ?? (name.startsWith("rule-") ? "A check for this skill" : "")));

  return [
    `## Guardrail rules (${data.guardrailIds.size} distinct)`,
    "",
    "`rule_tool_check` runs these rules. The repository also runs them on itself.",
    "An advisory rule reports a finding and does not fail the check.",
    `${baseline.size} rules run on every check. The other rules run when the check names their skill.`,
    "One rule can be in two families, so the family counts add up to more than the total.",
    "",
    ...table(
      ["Family", "Rules", "Applies to"],
      data.families.map(([name, list]) => [`[\`${name}\`](#${name.replace(":", "")})`, list.length, scope(name)]),
    ),
    "",
    ...data.families.flatMap(([family, list]) => [
      `### ${family}`,
      "",
      ...table(
        ["Rule", "Label", "What it rejects", "Also in"],
        list.map((rule) => [`\`${rule.id}\``, rule.label ?? "", rule.description ?? "", (rules.get(rule.id)?.families ?? []).filter((name) => name !== family).join(", ") || "-"]),
      ),
      "",
    ]),
  ];
}

/** The fixed resources, and the pair every skill mints. */
export function resourceSection(data) {
  const kinds = resourceKinds(data.resources, data.skillDirs);

  return [
    `## MCP resources (${data.resources.length})`,
    "",
    "A client reads a resource with `resources/read`. Each resource is JSON or Markdown.",
    "A read does not call a model and does not write.",
    "",
    "### The fixed indexes",
    "",
    ...table(
      ["URI", "Name", "Media type"],
      kinds.fixed.map((resource) => [`\`${resource.uri}\``, resource.name ?? "-", `\`${resource.mimeType ?? "-"}\``]),
    ),
    "",
    "### Per skill",
    "",
    `There are ${kinds.perSkill} more resources, two for each skill:`,
    "",
    "- `rule://<skill>` - the whole `SKILL.md`",
    "- `rule://<skill>/summary` - the short form that the router returns",
    "",
    "[The skills page](13-skills.md) lists the skills.",
    "",
  ];
}
