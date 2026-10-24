/** @module cli/setup/opentui/clipboard - copy through OpenTUI or the OS */
import { execFileSync } from "node:child_process";

/** The command each platform uses when OpenTUI's clipboard is unavailable. */
const FALLBACK = { darwin: ["pbcopy", []], win32: ["clip", []], linux: ["wl-copy", []] };

/**
 * Copy text, preferring OpenTUI's clipboard and falling back to the OS command.
 *
 * @param {string} text
 * @returns {Promise<boolean>} whether something accepted the text
 */
export async function copyToClipboard(text) {
  try {
    const { Clipboard } = await import("@opentui/core");

    if (Clipboard?.writeText) {
      await Clipboard.writeText(text);

      return true;
    }
  } catch {
    /* the native renderer is absent: the OS command still works */
  }

  const fallback = FALLBACK[process.platform];

  if (!fallback) {
    return false;
  }

  try {
    execFileSync(fallback[0], fallback[1], { input: text, stdio: ["pipe", "ignore", "ignore"] });

    return true;
  } catch {
    return false;
  }
}

/**
 * Show a short confirmation and remove it after the timeout.
 *
 * @param {object} renderer - the OpenTUI renderer
 * @param {string} message
 * @param {number} [ms]
 * @returns {Promise<void>}
 */
export async function toast(renderer, message, ms = 2000) {
  const { BoxRenderable, TextRenderable } = await import("@opentui/core");
  const box = new BoxRenderable(renderer, { flexDirection: "row", padding: 1 });
  const text = new TextRenderable(renderer, { content: message, fg: "#8AE234" });

  box.add(text);
  renderer.root.add(box);
  await new Promise((resolve) => setTimeout(resolve, ms));
  renderer.root.remove(box);
}
