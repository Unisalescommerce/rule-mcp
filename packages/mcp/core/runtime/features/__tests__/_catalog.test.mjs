/**
 * Features catalog: levels, default-first order, and env keys each level writes.
 *
 * Step 6 of installer-scope-adr-policy-features. A level's `null` removes the
 * key; every feature lists its default first.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { FEATURES, featureIds, levelsFor, envPatchFor } from "../_catalog.data.js";

test("the catalog names the five user-facing features in a stable order", () => {
  assert.deepEqual(featureIds(), ["adr", "telemetry", "update", "tokensave", "minimal-tools"]);
});

test("each feature lists levels with the default first", () => {
  assert.deepEqual(levelsFor("adr"), ["on", "off"]);
  assert.deepEqual(levelsFor("telemetry"), ["full", "anonymous", "off"]);
  assert.deepEqual(levelsFor("update"), ["auto", "notify", "off"]);
  assert.deepEqual(levelsFor("tokensave"), ["on", "autotrack", "off"]);
  assert.deepEqual(levelsFor("minimal-tools"), ["off", "on"]);
});

test("adr off writes NO_ADR; adr on clears it", () => {
  assert.deepEqual(envPatchFor("adr", "off"), { RULE_MCP_NO_ADR: "1" });
  assert.deepEqual(envPatchFor("adr", "on"), { RULE_MCP_NO_ADR: null });
});

test("telemetry anonymous drops prompt text and marks anonymous; off kills telemetry", () => {
  assert.deepEqual(envPatchFor("telemetry", "anonymous"), {
    RULE_MCP_NO_TELEMETRY: null,
    RULE_MCP_NO_PROMPT_TEXT: "1",
    RULE_MCP_NO_PROMPTS: null,
    RULE_MCP_TELEMETRY_ANONYMOUS: "1",
  });
  assert.deepEqual(envPatchFor("telemetry", "off"), {
    RULE_MCP_NO_TELEMETRY: "1",
    RULE_MCP_NO_PROMPT_TEXT: null,
    RULE_MCP_NO_PROMPTS: null,
    RULE_MCP_TELEMETRY_ANONYMOUS: null,
  });
  assert.deepEqual(envPatchFor("telemetry", "full"), {
    RULE_MCP_NO_TELEMETRY: null,
    RULE_MCP_NO_PROMPT_TEXT: null,
    RULE_MCP_NO_PROMPTS: null,
    RULE_MCP_TELEMETRY_ANONYMOUS: null,
  });
});

test("update / tokensave / minimal-tools map to the existing opt-out keys", () => {
  assert.deepEqual(envPatchFor("update", "off"), { RULE_MCP_NO_AUTOUPDATE: "1", RULE_MCP_AUTO_UPDATE: null });
  assert.deepEqual(envPatchFor("update", "notify"), { RULE_MCP_NO_AUTOUPDATE: null, RULE_MCP_AUTO_UPDATE: null });
  assert.deepEqual(envPatchFor("update", "auto"), { RULE_MCP_NO_AUTOUPDATE: null, RULE_MCP_AUTO_UPDATE: "upgrade" });

  assert.deepEqual(envPatchFor("tokensave", "off"), {
    RULE_MCP_NO_TOKENSAVE: "1",
    RULE_MCP_TOKENSAVE_AUTOTRACK: null,
  });
  assert.deepEqual(envPatchFor("tokensave", "autotrack"), {
    RULE_MCP_NO_TOKENSAVE: null,
    RULE_MCP_TOKENSAVE_AUTOTRACK: "1",
  });
  assert.deepEqual(envPatchFor("tokensave", "on"), {
    RULE_MCP_NO_TOKENSAVE: "0",
    RULE_MCP_TOKENSAVE_AUTOTRACK: null,
  });

  assert.deepEqual(envPatchFor("minimal-tools", "on"), { RULE_MCP_MINIMAL_TOOLS: "1" });
  assert.deepEqual(envPatchFor("minimal-tools", "off"), { RULE_MCP_MINIMAL_TOOLS: null });
});

test("an unknown feature or level throws", () => {
  assert.throws(() => envPatchFor("nope", "on"), /unknown feature/i);
  assert.throws(() => envPatchFor("adr", "maybe"), /unknown level/i);
  assert.equal(FEATURES.adr.levels.on.RULE_MCP_NO_ADR, null);
});
