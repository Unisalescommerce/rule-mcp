/**
 * Plan / apply / remove the pending-ADR landing hooks and merge driver.
 *
 * Tracked hooks live in `.githooks/`; the merge driver is configured in git
 * and attributes are either the tracked `.gitattributes` or a private
 * `.git/info/attributes` for local-only installs.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { gitDir } from "../git/_repo.js";

const DRIVER_NAME = "rule-mcp-index";
const DRIVER_CMD = "rule-mcp handoff merge-index %O %A %B %P";
const ATTRIBUTE_LINES = ["docs/adr/ADR.md merge=rule-mcp-index", "docs/handoff/HANDOFF.md merge=rule-mcp-index"];
const HOOK_EVENTS = ["post-merge", "post-rewrite"];

/**
 * @param {string} projectDir
 * @param {{"private"?: boolean}} [options]
 * @returns {{ hooks: { event: string, status: "missing" | "present" }[], driver: "missing" | "present", attributes: "missing" | "present" | "private" }}
 */
export function planLandHooks(projectDir, options = {}) {
  const hooks = HOOK_EVENTS.map((event) => {
    const tracked = join(projectDir, ".githooks", event);

    return { event, status: existsSync(tracked) ? "present" : "missing" };
  });
  const driver = gitConfig(projectDir, `merge.${DRIVER_NAME}.driver`) === DRIVER_CMD ? "present" : "missing";
  const attributes = attributeStatus(projectDir, options.private);

  return { hooks, driver, attributes };
}

/**
 * Idempotent apply: a second run is all "preserve".
 *
 * @param {string} projectDir
 * @param {{"private"?: boolean}} [options]
 * @returns {{ preserved: string[], written: string[] }}
 */
export function applyLandHooks(projectDir, options = {}) {
  const preserved = [];
  const written = [];
  const before = planLandHooks(projectDir, options);

  for (const hook of before.hooks) {
    if (hook.status === "present") {
      preserved.push(hook.event);
    }
  }

  if (before.driver === "present") {
    preserved.push("driver");
  } else {
    gitConfigSet(projectDir, `merge.${DRIVER_NAME}.driver`, DRIVER_CMD);
    written.push("driver");
  }

  if (before.attributes === "present" || before.attributes === "private") {
    preserved.push("attributes");
  } else if (options.private) {
    writePrivateAttributes(projectDir);
    written.push("attributes");
  } else {
    ensureTrackedAttributes(projectDir);
    written.push("attributes");
  }

  return { preserved, written };
}

/**
 * Remove the merge driver config and private attributes; tracked files stay.
 *
 * @param {string} projectDir
 * @returns {{ removed: string[] }}
 */
export function removeLandHooks(projectDir) {
  const removed = [];

  if (gitConfig(projectDir, `merge.${DRIVER_NAME}.driver`)) {
    gitConfigUnset(projectDir, `merge.${DRIVER_NAME}.driver`);
    removed.push("driver");
  }

  const privatePath = join(gitDir(projectDir) || projectDir, "info", "attributes");

  if (existsSync(privatePath)) {
    const body = readFileSync(privatePath, "utf8");
    const next = body
      .split("\n")
      .filter((line) => ATTRIBUTE_LINES.every((attribute) => !(line.trim() === attribute)))
      .join("\n");

    if (next !== body) {
      writeFileSync(privatePath, next);
      removed.push("private-attributes");
    }
  }

  return { removed };
}

function attributeStatus(projectDir, preferPrivate) {
  const tracked = join(projectDir, ".gitattributes");

  if (existsSync(tracked) && ATTRIBUTE_LINES.every((line) => readFileSync(tracked, "utf8").includes(line))) {
    return "present";
  }

  const absoluteGit = gitDir(projectDir);

  if (absoluteGit) {
    const privatePath = join(absoluteGit, "info", "attributes");

    if (existsSync(privatePath) && ATTRIBUTE_LINES.every((line) => readFileSync(privatePath, "utf8").includes(line))) {
      return "private";
    }
  }

  return preferPrivate ? "missing" : "missing";
}

function ensureTrackedAttributes(projectDir) {
  const path = join(projectDir, ".gitattributes");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const missing = ATTRIBUTE_LINES.filter((line) => !existing.includes(line));

  if (missing.length === 0) {
    return;
  }

  const block = `${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${missing.join("\n")}\n`;

  writeFileSync(path, `${existing}${block}`);
}

function writePrivateAttributes(projectDir) {
  const absoluteGit = gitDir(projectDir);

  if (!absoluteGit) {
    return;
  }

  const info = join(absoluteGit, "info");
  mkdirSync(info, { recursive: true });
  const path = join(info, "attributes");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const missing = ATTRIBUTE_LINES.filter((line) => !existing.includes(line));

  if (missing.length === 0) {
    return;
  }

  writeFileSync(path, `${existing}${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${missing.join("\n")}\n`);
}

function gitConfig(projectDir, key) {
  try {
    return execFileSync("git", ["config", "--get", key], {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function gitConfigSet(projectDir, key, value) {
  execFileSync("git", ["config", key, value], { cwd: projectDir, stdio: "ignore" });
}

function gitConfigUnset(projectDir, key) {
  try {
    execFileSync("git", ["config", "--unset", key], { cwd: projectDir, stdio: "ignore" });
  } catch {
    /* already absent */
  }
}
