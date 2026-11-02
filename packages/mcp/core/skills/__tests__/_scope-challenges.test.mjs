/**
 * @module test/scope-challenges.test
 *
 * A scope challenge is not a build request. The router reads a short phrase list
 * and sends the prompt to `rule-process-ai`; this suite pins one prompt per
 * family so a phrase that stops matching, or a route that stops landing there,
 * fails instead of silently costing the skill its entry point.
 *
 * @see test/scope-challenges.mjs - the prompts
 * @see docs/plans/skills/process/_rule-mcp-process-ai.md - Workstream F
 */

import test from "node:test";
import assert from "node:assert/strict";

process.env.RULE_MCP_NO_TELEMETRY = "1";
process.env.RULE_MCP_NO_AUTOUPDATE = "1";
process.env.RULE_MCP_NO_CACHE = "1";
process.env.RULE_MCP_SKILL_UNIVERSE = "base";

const { loadAllSkills } = await import("../index.js");
const { callTool } = await import("../../../tools/router/index.js");
const { SCOPE_CHALLENGES } = await import("../../../../../scripts/__tests__/fixtures/scope-challenges.mjs");
const { reductionSignal } = await import("../../../tools/ai/_reduction-signal.js");

await loadAllSkills(true);

/** @param {string} prompt @returns {Promise<object>} */
async function route(prompt) {
  return JSON.parse((await callTool("rule_tool", { prompt })).content[0].text);
}

test("every scope challenge carries a reduction signal and lands on rule-process-ai", async () => {
  const missed = [];

  for (const prompt of SCOPE_CHALLENGES) {
    const signal = reductionSignal(prompt.toLowerCase());
    const answer = await route(prompt);

    if (!signal || !answer.route.includes("process-ai")) {
      missed.push(`${prompt} -> ${signal ?? "no signal"} / ${answer.route}`);
    }
  }

  assert.deepEqual(missed, [], `the signal and the route have to agree:\n  ${missed.join("\n  ")}`);
});
