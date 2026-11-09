/** @module cli/guard/staged - guardrail failures over the staged files */

import { execFileSync } from "node:child_process";
import { checkCode } from "../../core/guardrails/index.js";
import { skillsForPath } from "./_route.js";

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
      .filter((line) => line && skillsForPath(line).length > 0);
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

    const failures = new Set();

    for (const skill of skillsForPath(file)) {
      const report = check(skill, code, { fileName: file });

      for (const failed of report.allPass ? [] : report.failed) {
        failures.add(failed.id);
      }
    }

    if (failures.size > 0) {
      results.push({ file, failures: [...failures] });
    }
  }

  return results;
}
