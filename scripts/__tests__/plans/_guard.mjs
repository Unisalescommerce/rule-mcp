/**
 * The plan papers are local working documents, never published.
 *
 * `docs/plans/`, `docs/audits/` and `docs/reviews/` sit in `.gitignore`, so a
 * clone has no plans. The suites that read them skip there, and say why.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/** The plans directory, as it exists on a machine that works on this repo. */
export const plansRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "docs", "plans");

/** Whether the local working papers are on disk. */
export const plansAvailable = () => existsSync(plansRoot);

/** The reason a skipped test carries, in one line. */
export const SKIP = "docs/plans is local only: this repository does not publish its working papers";

/**
 * `test`, skipped when the plans are not on disk.
 *
 * @param {string} name
 * @param {Function} fn
 */
export const planTest = (name, fn) => test(name, { skip: plansAvailable() ? false : SKIP }, fn);
