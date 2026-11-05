/** @module cli/guard/staged - guardrail failures over the staged files */

import { execFileSync } from "node:child_process";
import { CHECKABLE, skillForPath } from "./_decide.js";
import { extname } from "node:path";
import { checkCode } from "../../core/guardrails/index.js";

/** @param {{ cwd?: string }} [options] @returns {string[]} staged files worth checking */
export function stagedFiles({ cwd } = {}) {
  try {
    // Bounded: this runs inside a PreToolUse hook, so a git that blocks - an
    // index lock held by another process, a filesystem that stops answering -
    // would hang the agent's tool call rather than this helper.
    return execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM", "-z", "--"], {
      cwd,
      encoding: "utf8",
      timeout: 5000,
      killSignal: "SIGKILL",
      maxBuffer: 4 * 1024 * 1024,
    })
      .split("\0")
      .filter((line) => line && CHECKABLE.has(extname(line)));
  } catch {
    return [];
  }
}

/** @param {{ cwd?: string, check?: Function }} [options] @returns {Array<{ file: string, failures: string[] }>} */
export function stagedFailures({ cwd, check = checkCode } = {}) {
  const results = [];

  for (const file of stagedFiles({ cwd })) {
    let code;
    try {
      code = execFileSync("git", ["show", `:${file}`], { cwd, encoding: "utf8", timeout: 5000, killSignal: "SIGKILL", maxBuffer: 4 * 1024 * 1024 });
    } catch {
      continue;
    }

    const report = check(skillForPath(file), code, { fileName: file });

    if (!report.allPass) {
      results.push({ file, failures: report.failed.map((f) => f.id) });
    }
  }

  return results;
}
