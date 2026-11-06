/**
@module cli/setup/path-complete
 *
 * Turning a typed path into a list a menu can show.
 *
 * Two rules decide it. A directory that holds credentials is never listed, and a
 * suggestion only appears once the text names one - so typing `p` at an install
 * prompt cannot walk a user through `.ssh`. Everything else is presentation: the
 * caller gets a prefix, so the widget can replace what it typed, and values end
 * in `/` so the next suggestion descends.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

/** Directories whose names never reach a suggestion list. */
const SENSITIVE = ["~/.ssh", "~/.aws", "~/.config/gh", "~/.gnupg", "~/.password-store", "~/.kube", "/etc/ssh"].map((path) =>
  path.startsWith("~") ? join(homedir(), path.slice(2)) : path,
);

/** A name with a control character in it (macOS writes `Icon\r` in every folder). */
const hasControlCharacter = (name) => /[\u0000-\u001F\u007F]/.test(name);

/**
 * Expand `~` and a relative path against a working directory.
 *
 * @param {string} text
 * @param {string} [cwd]
 * @returns {string}
 */
export function expandPath(text, cwd = process.cwd()) {
  if (!text) {
    return cwd;
  }

  if (text === "~") {
    return homedir();
  }

  if (text.startsWith("~/")) {
    return join(homedir(), text.slice(2));
  }

  return isAbsolute(text) ? resolve(text) : resolve(cwd, text);
}

/**
 * Whether a directory is one the prompt must not offer.
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isSensitiveDir(path) {
  const absolute = expandPath(path);

  return SENSITIVE.some((secret) => absolute === secret || absolute.startsWith(`${secret}/`));
}

/**
 * The suggestions for the text typed so far.
 *
 * @param {string} text
 * @param {string} [cwd]
 * @returns {null | { prefix: string, items: Array<{ name: string, value: string }> }}
 */
export function suggestPaths(text, cwd = process.cwd()) {
  if (!text.includes("/")) {
    return null;
  }

  // The split is on the typed text, not the resolved path: `resolve("./.")`
  // collapses the dot, and the dot is exactly the prefix the caller typed.
  const cut = text.lastIndexOf("/");
  const head = text.slice(0, cut + 1);
  const partial = text.slice(cut + 1);
  const base = expandPath(head, cwd);

  if (isSensitiveDir(base) || !existsSync(base)) {
    return { prefix: text, items: [] };
  }

  let names;

  try {
    names = readdirSync(base);
  } catch {
    return { prefix: text, items: [] };
  }

  const items = names
    .filter((name) => !hasControlCharacter(name))
    .filter((name) => existsSync(join(base, name)) && statSync(join(base, name)).isDirectory())
    .filter((name) => (partial === "" ? true : name.toLowerCase().startsWith(partial.toLowerCase())))
    // A dot folder is offered once a dot is typed, including the `.` of `../`.
    .filter((name) => !name.startsWith(".") || partial.startsWith(".") || partial === "")
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({
      name,
      value: `${text.slice(0, text.length - partial.length)}${name}/`,
    }));

  return { prefix: text, items };
}
