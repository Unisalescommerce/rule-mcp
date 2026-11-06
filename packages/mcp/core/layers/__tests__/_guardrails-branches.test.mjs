/** A custom guardrail folder that exports a list, a single rule, and things that are not rules. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-layer-rules-home-"));

process.env.RULE_MCP_HOME = home;

const { loadLayerGuardrails } = await import("../_guardrails.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

test("usable rules load, and each bad export is reported", async () => {
  const dir = join(home, "skills", "my-mixed-rules");

  mkdirSync(join(dir, "guardrails"), { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), "---\nname: my-mixed-rules\ndescription: x\nguardrails: [listed, single]\n---\n\n# my-mixed-rules\n");
  writeFileSync(
    join(dir, "guardrails", "index.js"),
    [
      'export const list = [{ id: "listed", check: () => ({ pass: true }) }, null, "text"];',
      'export const single = { id: "single", check: () => ({ pass: true }) };',
      "export const noId = { check: () => ({ pass: true }) };",
      'export const noCheck = { id: "no-check", check: "nope" };',
      "export const other = 7;",
      "",
    ].join("\n"),
  );

  const loaded = await loadLayerGuardrails();
  const layer = loaded.get("my-mixed-rules");
  const ids = (layer?.guardrails ?? []).map((rule) => rule.id);

  assert.deepEqual(ids.sort(), ["listed", "single"]);
});
