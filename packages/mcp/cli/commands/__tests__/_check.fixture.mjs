/** The check test's project: a git repository with one project skill, and the command run with its output captured. */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "rule-check-home-"));

process.env.RULE_MCP_HOME = home;

const { checkCommand } = await import("../_check.js");
const { DEFAULT_GUARDRAIL_CONFIG, setGuardrailConfig, setSkillPaths } = await import("../../../core/guardrails/index.js");

/** Put back what a check installed, and remove the home. */
export function cleanUp() {
  setGuardrailConfig(DEFAULT_GUARDRAIL_CONFIG);
  setSkillPaths(new Map());
  rmSync(home, { recursive: true, force: true });
}

/** A rule source that fails when the code contains `needle`. */
export const rule = (id, needle, severity) =>
  `{ id: "${id}", label: "${id}", severity: "${severity}", check: (code) => ({ pass: !code.includes("${needle}"), failCount: 1, detail: ["${needle}"], suggestion: "remove ${needle}" }) }`;

/** A git repository (the project in `sub` of it, when given) with one project skill on supabase/migrations/**, the baseline off and the catalog SQL rule disabled. */
export function repo(sub = "") {
  const top = mkdtempSync(join(tmpdir(), "rule-check-repo-"));
  const cwd = join(top, sub);
  const git = (...args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: top, stdio: "pipe" });
  const skill = join(cwd, ".rule-mcp", "skills", "house-migrations");

  git("init", "-q");
  mkdirSync(join(skill, "guardrails"), { recursive: true });
  mkdirSync(join(cwd, "supabase", "migrations"), { recursive: true });
  writeFileSync(join(cwd, ".rule-mcp", "config.json"), JSON.stringify({ guardrails: { baseline: "minimal", disable: ["migration-safety"] } }));
  writeFileSync(join(skill, "SKILL.md"), '---\nname: house-migrations\npaths: ["supabase/migrations/**"]\nguardrails: [no-drop, no-todo]\n---\n\n# house\n');
  writeFileSync(join(skill, "guardrails", "index.js"), `export const GUARDRAILS = [${rule("no-drop", "drop table", "block")}, ${rule("no-todo", "TODO", "warn")}];\n`);
  writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "create table a (id int);\n");
  git("add", "-A");
  git("commit", "-q", "-m", "init");

  return { cwd, git, top };
}

/** Run the command with its output captured. */
export async function run(options) {
  const out = [];
  const err = [];
  const code = await checkCommand(options, { write: (text) => out.push(text), writeError: (text) => err.push(text) });

  return { code, out: out.join(""), err: err.join("") };
}
