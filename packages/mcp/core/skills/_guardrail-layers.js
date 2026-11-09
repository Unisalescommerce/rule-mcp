/** @module core/skills/guardrail-layers - install the rules the skills own */

/**
 * Resolve the three skill layers and hand the guardrail engine the rules each
 * skill owns (ADR 081), with the project's choices about which of them run
 * (`.rule-mcp/config.json`, see core/guardrails/engine/project-config).
 *
 * Called before any tool registers, so the first check already sees them. What
 * a layer could not load is reported by the loader and stepped over: a broken
 * custom skill must not stop the server starting.
 *
 * @param {{ cwd?: string }} [options] - where to look for the project
 * @returns {Promise<{ problems: Array<object> }>} what could not be read
 */
export async function installSkillGuardrails(options = {}) {
  const { loadLayerGuardrails } = await import("../layers/_guardrails.js");
  const { readGuardrailConfig, setGuardrailConfig, setSkillGuardrails, setSkillPaths } = await import("../guardrails/index.js");
  const { config, file, problems } = readGuardrailConfig(options);
  const loaded = await loadLayerGuardrails(options);

  setGuardrailConfig(config);
  setSkillGuardrails(loaded);
  setSkillPaths(loaded);

  return { problems: [...problems.map((reason) => ({ file, layer: "project", reason })), ...loaded.problems] };
}
