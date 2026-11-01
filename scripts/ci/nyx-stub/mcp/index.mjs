/**
 * Minimal Nyx MCP adapter surface so `nyx-gateway/mcp` resolves when the
 * sibling checkout is missing. Production loads stay off via RULE_MCP_NO_NYX=1.
 */

/** @returns {object} Adapter with the methods rule-mcp may call. */
export function createMcpAdapter() {
  return {
    describe: () => ({ model: "ci-stub", backends: [], embeddings: false, modes: [] }),
    embed: async (texts) => texts.map(() => [0]),
    classify: async () => ({ decision: { cacheGroup: "other|easy|plain" } }),
    shouldReplay: async () => ({ replay: false, reason: "ci-stub", similarity: 0 }),
  };
}

/** Config-file entry used when RULE_MCP_NYX_CONFIG is set; unused under the stub. */
export function createMcpAdapterFromConfigFile() {
  return createMcpAdapter();
}
