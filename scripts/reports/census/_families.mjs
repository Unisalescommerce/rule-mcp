/** @module scripts/reports/census/_families - the guardrails the server checks, by family */

const guardrails = await import("../../../packages/mcp/core/guardrails/index.js");
const { loadLayerGuardrails } = await import("../../../packages/mcp/core/layers/_guardrails.js");

/**
 * Every guardrail, by family: one family per skill that owns rules, then the
 * families the guardrail module exports.
 *
 * @returns {Promise<Array<[string, object[]]>>}
 */
export async function guardrailFamilies() {
  const families = [];

  for (const [skill, layer] of await loadLayerGuardrails()) {
    if ((layer?.guardrails ?? []).length > 0) {
      families.push([skill, layer.guardrails]);
    }
  }

  for (const [key, value] of Object.entries(guardrails)) {
    if (key.endsWith("GUARDRAILS") && Array.isArray(value)) {
      families.push([key.replace("_GUARDRAILS", "").toLowerCase(), value]);
    }
  }

  for (const [framework, rules] of Object.entries(guardrails.FRAMEWORK_GUARDRAILS ?? {})) {
    if (families.every(([name]) => name !== framework)) {
      families.push([`framework:${framework}`, rules]);
    }
  }

  return families.sort(([left], [right]) => left.localeCompare(right));
}
