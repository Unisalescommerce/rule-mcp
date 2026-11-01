/**
 * @module test/smoke
 *
 * Smoke test for rule-mcp.
 * Verifies that:
 * - The bin entry point exists
 * - package.json has correct structure
 * - All packages/mcp files are present and non-empty
 * - SDK and Zod dependencies are importable
 */

import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");

// Hermetic: exercise tool wiring, not the result cache.
process.env.RULE_MCP_NO_CACHE = "1";
process.env.RULE_MCP_NO_AUTOUPDATE = "1"; // hermetic: no real git ops in tests

console.log("rule-mcp smoke test");

let failures = 0;

// 1. Check bin entry point
const bin = join(root, "bin", "rule-mcp.js");
assert.ok(existsSync(bin), `bin entry point missing: ${bin}`);
console.log("  ✅ bin/rule-mcp.js exists");

// 2. Check package.json
const workspace = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
assert.ok(workspace.name === "rule-mcp-workspace", `Wrong workspace name: ${workspace.name}`);
assert.ok(workspace.private === true, "workspace must be private");
assert.ok(workspace.bin["rule-mcp"], "Missing bin entry");
const package_ = JSON.parse(readFileSync(join(root, "packages/mcp/package.json"), "utf8"));
assert.ok(package_.name === "rule-mcp", `Wrong package name: ${package_.name}`);
assert.ok(package_.dependencies["@modelcontextprotocol/sdk"], "Missing @modelcontextprotocol/sdk dependency");
assert.ok(package_.dependencies["zod"], "Missing zod dependency");
assert.ok(package_.dependencies["rule-mcp-shared"], "Missing rule-mcp-shared dependency");
console.log("  ✅ workspace + packages/mcp package.json valid with SDK + Zod deps");

// 3. Check src files (SDK-based layout - no mcp/ directory)
const sourceFiles = [
  "server/index.js",
  "index.js",
  "tools/router/index.js",
  "tools/skill/index.js",
  "core/skills/index.js",
  "core/scaffold/templates/index.js",
  "core/guardrails/index.js",
  "resources/index.js",
  "prompts/index.js",
  "cli/paths/index.js",
  "cli/install/index.js",
  "cli/commands/index.js",
  "cli/doctor/index.js",
  "cli/index.js",
];
for (const f of sourceFiles) {
  const p = join(root, "packages/mcp", f);
  assert.ok(existsSync(p), `Missing packages/mcp/${f}`);
  const source = readFileSync(p, "utf8");
  assert.ok(source.length > 50, `packages/mcp/${f} too short`);
  assert.ok(source.includes("/**"), `packages/mcp/${f} missing JSDoc`);
}
console.log("  ✅ All packages/mcp files present with JSDoc");

// 4. Check SDK is importable
try {
  await import("@modelcontextprotocol/sdk/server/index.js");
  console.log("  ✅ @modelcontextprotocol/sdk importable");
} catch (error) {
  console.log("  ❌ @modelcontextprotocol/sdk import failed:", error.message);
  failures++;
}

// 5. Check Zod is importable
try {
  await import("zod/v4");
  console.log("  ✅ zod importable");
} catch (error) {
  console.log("  ❌ zod import failed:", error.message);
  failures++;
}

// 6. Check server exports
try {
  const server = await import("../../packages/mcp/server/index.js");
  assert.ok(typeof server.startServer === "function", "startServer not exported");
  assert.ok(typeof server.stopServer === "function", "stopServer not exported");
  console.log("  ✅ packages/mcp/server.js exports startServer + stopServer");
} catch (error) {
  console.log("  ❌ packages/mcp/server.js export check failed:", error.message);
  failures++;
}

// 7. Check tool router exports
try {
  const router = await import("../../packages/mcp/tools/router/index.js");
  assert.ok(typeof router.registerTool === "function", "registerTool not exported");
  assert.ok(typeof router.listTools === "function", "listTools not exported");
  assert.ok(typeof router.callTool === "function", "callTool not exported");
  console.log("  ✅ packages/mcp/tools/router/index.js exports registerTool, listTools, callTool");
} catch (error) {
  console.log("  ❌ packages/mcp/tools/router/index.js export check failed:", error.message);
  failures++;
}

if (failures > 0) {
  console.log(`\n❌ ${failures} failure(s) - see above`);
  process.exit(1);
}
console.log("\n  ✅ All checks passed");
