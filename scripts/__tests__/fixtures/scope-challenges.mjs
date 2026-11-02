/**
 * @module test/scope-challenges
 *
 * One scope challenge per family of the reduction signal in
 * `packages/mcp/tools/ai/_reduction-signal.js`. Every prompt has to carry a
 * signal and land on `rule-process-ai`, or the vocabulary drifted away from the
 * requests it exists to catch.
 *
 * Kept apart from `routing-corpus.mjs` on purpose: this measures a keyword
 * signal, not ranking, so adding it to the ranked set would move that set's
 * floors for a reason the two do not share.
 *
 * @see docs/plans/skills/process/_rule-mcp-process-ai.md - Workstream F
 */

/** @type {string[]} */
export const SCOPE_CHALLENGES = [
  "this feels over-engineered for what we need",
  "can we avoid the extra table",
  "do we need a cache here",
  "that's out of scope for this ticket",
  "keep it minimal please",
  "is this abstraction premature",
  "simplify this implementation",
  "too many flags in this config",
  "yagni: skip the interface for now",
  "should I split this into a separate module",
];
