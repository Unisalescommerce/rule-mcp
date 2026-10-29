/**
Options only the wizard's plan performs, by the flag that asks for them.

`install` without a wizard is the narrow command it always was: it writes the
mcp.json entry and the router command file, and nothing else. Every entry below
belongs to the plan, so a flag naming one is a flag this path cannot honor.
*/
export const WIZARD_ONLY = {
  rules: "--rules",
  commands: "--commands",
  skills: "--skills",
  service: "--service",
  doctor: "--doctor",
  commandsPreset: "--commands-preset",
  commandsFamilies: "--commands-families",
  commandsAreas: "--commands-areas",
  commandsSkills: "--commands-skills",
};
