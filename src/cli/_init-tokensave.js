/** The tokensave half of `init`: create the graph, or say why not. */

import { execFileSync } from "node:child_process";

import { probeFilesystem } from "../core/tokensave/index.js";

/** Why a command failed, as one line. */
const reasonOf = (error) => String(error?.stderr ?? error?.message ?? error);

/**
 * The tokensave binary on the PATH, or nothing.
 *
 * @returns {string|undefined}
 */
export function findTokensave() {
  try {
    return (
      execFileSync("command", ["-v", "tokensave"], {
        encoding: "utf8",
        shell: "/bin/sh",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || undefined
    );
  } catch {
    return;
  }
}

/**
 * Initialize the graph, reporting `existing` for a project that already has one.
 *
 * @param {string} projectDir
 * @param {object} [options]
 * @returns {string|undefined}
 */
export function initTokensave(projectDir, options = {}) {
  const binary = (options.tokensaveBinary ?? findTokensave)();

  if (!binary) {
    return "not installed";
  }

  const run = options.run ?? ((command, args, runOptions) => execFileSync(command, args, { ...runOptions, stdio: "ignore" }));
  const probe = options.probe ?? probeFilesystem;

  if (probe(projectDir).available) {
    return "existing";
  }

  try {
    run(binary, ["init"], { cwd: projectDir });

    return "initialized";
  } catch (error) {
    const reason = reasonOf(error);

    return /already initiali[sz]ed/i.test(reason) ? "existing" : `failed: ${reason.split("\n", 1)[0]}`;
  }
}
