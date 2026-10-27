import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const { hookFile, mergeHookDocument, stripHookDocument } = await import("../_hook-files.js");

const launcher = { command: "/bin/rule-mcp" };

test("Claude gets the four events its settings file reads", () => {
  const document = mergeHookDocument("claude", {}, launcher);

  assert.deepEqual(Object.keys(document.hooks).sort(), ["PostToolUse", "PreToolUse", "SessionStart", "UserPromptSubmit"]);
});

test("Cursor keeps a foreign hook and replaces ours", () => {
  const current = {
    version: 1,
    hooks: { preToolUse: [{ command: "someone-else" }, { command: "/old guard bash  # rule-mcp-guard" }] },
  };
  const merged = mergeHookDocument("cursor", current, launcher);

  assert.equal(merged.hooks.preToolUse[0].command, "someone-else");
  assert.match(merged.hooks.preToolUse[1].command, /^\/bin\/rule-mcp guard --send bash/u);
  assert.equal(merged.hooks.preToolUse.length, 3);
});

test("Kiro replaces its named hooks and keeps the rest of the file", () => {
  const current = {
    version: "v1",
    hooks: [
      { name: "team-lint", trigger: "PostFileSave" },
      { name: "rule-mcp-bash-guard", trigger: "PreToolUse" },
    ],
  };
  const merged = mergeHookDocument("kiro", current, launcher);

  assert.equal(merged.hooks[0].name, "team-lint");
  assert.equal(merged.hooks.filter((hook) => hook.name === "rule-mcp-bash-guard").length, 1);
});

test("stripping removes only our entries and drops an empty container", () => {
  const cursor = stripHookDocument("cursor", { version: 1, hooks: { preToolUse: [{ command: "/bin/rule-mcp guard bash  # rule-mcp-guard" }] } });
  assert.equal(cursor.hooks, undefined);
  assert.equal(cursor.version, 1);

  const codex = stripHookDocument("codex", {
    hooks: {
      PreToolUse: [{ hooks: [{ type: "command", command: "/bin/rule-mcp guard bash  # rule-mcp-guard" }] }],
      Stop: [{ hooks: [{ type: "command", command: "not-ours" }] }],
    },
  });
  assert.deepEqual(Object.keys(codex.hooks), ["Stop"]);
});

test("a Kiro file that held only our hooks is deleted, a shared one is kept", () => {
  assert.equal(stripHookDocument("kiro", { hooks: [{ name: "rule-mcp-write-report" }] }), null);
  assert.deepEqual(stripHookDocument("kiro", { hooks: [{ name: "team-lint" }] }).hooks, [{ name: "team-lint" }]);
});

test("only the five native hosts have a hook file", () => {
  for (const agent of ["claude", "codex", "cursor", "gemini", "kiro"]) {
    assert.ok(hookFile(agent), agent);
  }

  assert.equal(hookFile("opencode"), null);
  assert.equal(hookFile("copilot"), null);
});

test("an install writes hooks only for the agents it was given", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-hooks-scope-"));

  try {
    const agentOps = new URL("../_agent-ops.js", import.meta.url).href;
    const aliasHook = new URL("../../../../scripts/alias-hook.mjs", import.meta.url).href;
    const script = `import { installAgent } from ${JSON.stringify(agentOps)}; installAgent({ agent: "cursor", entrypoint: "/tmp/rule.js", hooks: true });`;
    const child = spawnSync(process.execPath, ["--import", aliasHook, "--input-type=module", "--eval", script], { env: { ...process.env, HOME: home }, encoding: "utf8" });

    assert.equal(child.status, 0, child.stderr);
    assert.equal(existsSync(join(home, ".cursor", "hooks.json")), true);
    assert.equal(existsSync(join(home, ".codex", "hooks.json")), false);
    assert.equal(existsSync(join(home, ".kiro", "hooks", "rule-mcp.json")), false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("a Cursor install writes the hook file and a removal empties it", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-hooks-"));

  try {
    const module = new URL("../_hook-files.js", import.meta.url).href;
    const aliasHook = new URL("../../../../scripts/alias-hook.mjs", import.meta.url).href;
    const script = [
      `import { installHookFile, removeHookFile } from ${JSON.stringify(module)};`,
      'installHookFile({ agent: "cursor", entrypoint: "/tmp/rule.js" });',
      'removeHookFile({ agent: "cursor" });',
    ].join(" ");
    const child = spawnSync(process.execPath, ["--import", aliasHook, "--input-type=module", "--eval", script], { env: { ...process.env, HOME: home }, encoding: "utf8" });

    assert.equal(child.status, 0, child.stderr);

    const file = join(home, ".cursor", "hooks.json");
    assert.equal(existsSync(file), true);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { version: 1 });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
