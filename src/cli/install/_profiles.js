/** @module cli/install/profiles - the one profile vocabulary */

/** The dimensions an install can write. */
export const DIMENSIONS = ["server", "rules", "commands", "hooks", "doctor"];

/** Every profile, with the dimensions it turns on and what each one writes. */
export const PROFILES = {
  minimal: { label: "Minimal", dimensions: ["server", "commands"], description: "The MCP entry and the slash commands: enough for the agent to answer." },
  standard: {
    label: "Standard",
    dimensions: ["server", "rules", "commands", "hooks", "doctor"],
    description: "Everything: MCP entry, instruction rules, slash commands, guard hooks and the closing health check.",
  },
  full: { label: "Full", dimensions: ["server", "rules", "commands", "hooks", "doctor"], description: "Standard plus the full tool surface: every skill tool is exposed." },
  custom: { label: "Custom", dimensions: [], description: "Pick each dimension yourself; every row says what it writes." },
};

/** Human-readable detail for one dimension, shown beside its checkbox. */
export const DIMENSION_DETAIL = {
  server: "Writes the rule-mcp entry in the agent MCP config. Without it the agent cannot see the server.",
  rules: "Writes the instruction blocks in CLAUDE.md, AGENTS.md, GEMINI.md or copilot-instructions.",
  commands: "Writes the /rule-* files into each agent command directory.",
  hooks: "Installs PreToolUse/PostToolUse guards where the host documents them (Claude, Cursor, Gemini).",
  doctor: "Runs the health check for what was installed; it never blocks the install.",
};

/**
 * Resolve a profile name to its dimensions.
 *
 * @param {string} name
 * @returns {{ label: string, dimensions: string[], description: string }}
 */
export function resolveProfile(name) {
  const profile = PROFILES[name];

  if (!profile) {
    throw new Error(`Unknown profile "${name}". Known: ${Object.keys(PROFILES).join(", ")}`);
  }

  return profile;
}
