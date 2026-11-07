/**
 * @module cli/setup/warnings
 *
 * The one warning the renderer's dependency prints, and why it is dropped.
 *
 * OpenTUI loads `node:ffi` for its native core, and Node labels that module
 * experimental on every process that imports it. The notice names a dependency
 * the user cannot act on, and it lands after the alternate screen closes, where
 * it reads as a failure of the install. Every other warning still reaches
 * stderr: this filters one sentence, not the channel.
 */

/** Whether a warning is the renderer's FFI notice. */
export const isRendererFfiNotice = (warning) => warning?.name === "ExperimentalWarning" && /\bffi\b/iu.test(String(warning?.message ?? ""));

/**
 * Print a warning the way Node prints one nobody listens for.
 *
 * Node prints only when no listener answers, so replacing the default printer
 * means replacing its format too.
 *
 * @param {object} warning
 * @param {object} stderr
 */
const printWarning = (warning, stderr) => {
  const pid = process.pid;
  const name = warning?.name ?? "Warning";

  stderr.write(`(node:${pid}) ${name}: ${warning?.message ?? ""}\n`);
  stderr.write("(Use `node --trace-warnings ...` to show where the warning was created)\n");
};

/**
 * Keep the renderer's FFI notice off stderr, and every other warning on it.
 *
 * @param {object} [proc] - the process to filter, injectable for a test
 */
export function quietRendererWarnings(proc = process) {
  const listeners = proc.listeners("warning");

  proc.removeAllListeners("warning");
  proc.on("warning", (warning) => {
    if (isRendererFfiNotice(warning)) {
      return;
    }

    if (listeners.length > 0) {
      for (const listener of listeners) {
        listener(warning);
      }

      return;
    }

    printWarning(warning, proc.stderr);
  });
}
