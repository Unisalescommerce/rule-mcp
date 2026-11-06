/**
@module core/export/promote

EX-09: prime the tool-cache from transcript (or export) tool results, but only
when the existing cacheability rules allow it. Never invent a second allowlist:
NON_CACHEABLE + cachePrime are the floor.

@see docs/plans/_export.md Step 7
*/

import { NON_CACHEABLE } from "../../cache/tool-cache/_state.js";
import { cacheEnabled, cachePrime } from "../../cache/tool-cache/index.js";

/** Host MCP prefixes that wrap the bare `rule_tool_*` name. */
const HOST_PREFIXES = ["mcp__rule_mcp__", "mcp__rule-mcp__"];

/**
 * Strip a host MCP prefix so transcript names match the tool-cache key space.
 *
 * @param {string} toolName
 * @returns {string}
 */
export function normalizeToolName(toolName) {
  const raw = (toolName ?? "");

  for (const prefix of HOST_PREFIXES) {
    if (raw.startsWith(prefix)) {
      return raw.slice(prefix.length);
    }
  }

  return raw;
}

/**
 * Whether a tool may enter the tool-cache under the existing denylist.
 *
 * @param {string} toolName
 * @returns {boolean}
 */
export function isPromotableTool(toolName) {
  const name = normalizeToolName(toolName);

  return Boolean(name) && !NON_CACHEABLE.has(name);
}

/**
 * Prime tool-cache entries from candidate transcript calls.
 *
 * Uses `cachePrime` so an existing local answer is never overwritten. Skips
 * NON_CACHEABLE tools, error results, and a disabled cache.
 *
 * @param {{ tool: string, args?: object, result?: object }[]} calls
 * @returns {{
 *   promoted: number,
 *   skipped: { tool: string, reason: string }[],
 * }}
 */
export function promoteToolResults(calls = []) {
  const skipped = [];
  let promoted = 0;

  if (!cacheEnabled()) {
    for (const call of calls) {
      skipped.push({ tool: normalizeToolName(call?.tool), reason: "cache-disabled" });
    }

    return { promoted: 0, skipped };
  }

  for (const call of calls) {
    const tool = normalizeToolName(call?.tool);
    const args = call?.args ?? {};
    const result = call?.result;

    if (!tool) {
      skipped.push({ tool: String(call?.tool ?? ""), reason: "missing-tool" });
      continue;
    }

    if (!isPromotableTool(tool)) {
      skipped.push({ tool, reason: "non-cacheable" });
      continue;
    }

    if (!result || result.isError) {
      skipped.push({ tool, reason: "error-result" });
      continue;
    }

    if (cachePrime(tool, args, result)) {
      promoted += 1;
    } else {
      skipped.push({ tool, reason: "already-stored" });
    }
  }

  return { promoted, skipped };
}
