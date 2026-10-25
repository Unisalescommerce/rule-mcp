/**
 * @module cli/commands/lifecycle-install
 *
 * The install side of `rule-mcp install`: what the level means, and how a refusal
 * reads.
 *
 * Split from `_lifecycle.js` because the level check is the part with a rule in
 * it - a named host above its ceiling is refused, `all` is capped per host - and
 * the uninstall path shares none of it.
 */

import { levelSupport } from "../installers/hosts/index.js";

/**
 * The level a caller asked for, checked against every selected host's ceiling.
 *
 * `all` is not refused for asking for more than some hosts can do: the level is a
 * cap, and a host that cannot reach it installs what it supports. A named host is
 * refused, because there the caller asked a question with one answer.
 *
 * @param {{ agent: string, level?: string }} opts
 * @returns {{ ok: boolean, refusals: Array<{ id: string, ceiling: string, missing: Array<{ rung: string, reason: string }> }>, hooks: boolean }}
 */
export function checkLevel(opts) {
  const harnessHooks = opts.hooks === true;

  if (!opts.level) {
    return { ok: true, refusals: [], hooks: harnessHooks };
  }

  const targets = opts.agent === "all" ? [] : [opts.agent];
  const refusals = targets
    .map((agent) => levelSupport(agent, opts.level))
    .filter((support) => support && !support.allowed)
    .map((support) => ({ id: support.id, ceiling: support.ceiling, missing: support.missing }));

  return { ok: refusals.length === 0, refusals, hooks: harnessHooks && Number(String(opts.level).replace(/^L/u, "")) >= 3 };
}
