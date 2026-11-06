/** Automatic ADRs: which calls write, where they go, and how they are named. */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { autoLog } from "../_auto-log.js";

const result = { content: [{ text: JSON.stringify({ route: "rule-frontend", confidence: 1 }) }] };

/** A repository whose policy writes as the decision is made. */
function project(t, policy = "full") {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-auto-log-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });

  git("init", "-q", "-b", "main");
  git("-c", "user.name=x", "-c", "user.email=x@example.org", "commit", "-q", "--allow-empty", "-m", "chore(x): seed");
  mkdirSync(join(dir, ".context"));
  writeFileSync(join(dir, ".context", "adr.json"), JSON.stringify({ default: policy }));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  return { dir, git };
}

test("the off switch writes nothing", async (t) => {
  const { dir } = project(t);

  process.env.RULE_MCP_DISABLE_AUTO_ADR = "1";
  await autoLog("rule_tool", { projectDir: dir, prompt: "x" }, result);
  delete process.env.RULE_MCP_DISABLE_AUTO_ADR;

  assert.equal(existsSync(join(dir, "docs")), false);
});

test("a policy that waits for the handoff writes nothing mid-task", async (t) => {
  const { dir } = project(t, "handoff");

  await autoLog("rule_tool", { projectDir: dir, prompt: "x" }, result);

  assert.equal(existsSync(join(dir, "docs")), false);
});

test("a tool that decides nothing writes nothing", async (t) => {
  const { dir } = project(t);

  await autoLog("rule_tool_check", { projectDir: dir }, result);

  assert.equal(existsSync(join(dir, "docs")), false);
});

test("a call on trunk gets a number, and a call on a branch goes to pending", async (t) => {
  const { dir, git } = project(t);

  await autoLog("rule_tool", { projectDir: dir, prompt: "route this" }, result);
  assert.ok(readdirSync(join(dir, "docs", "adr")).some((name) => /^\d{3}-/u.test(name)));

  git("switch", "-q", "-c", "feature");
  await autoLog("rule_tool", { projectDir: dir, prompt: "route that" }, result);
  assert.ok(existsSync(join(dir, "docs", "adr", "_pending")));
});
