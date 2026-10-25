/**
 * Test doubles for the wizard's read-only and side-effecting dependencies.
 *
 * `_wizard.test.mjs` redirects `../_preflight.js`, `../_agent-rows.js`,
 * `../_rules-apply.js`, `../_run-plan.js` and `../_scan.js` here, so the real
 * flow runs without touching the machine and without a terminal.
 *
 * Everything is read through `globalThis.__wizardStub`, which the test owns.
 */

const control = () => globalThis.__wizardStub;

/** The environment check the test asked for. */
export const preflight = () => control().preflight;

/** The agent catalog the test asked for. */
export const agentRows = () => control().catalog;

/** No instruction file exists in a test home. */
export const installableTargets = () => control().ruleTargets;

/** The installation scan the test asked for. */
export const scanInstallation = () => control().scan;

/** The state a task starts in. */
export const TASK_PENDING = "pending";

/**
 * Count the finished tasks the way the real runner does.
 *
 * @param {Array<{ status: string }>} results
 */
export function tally(results) {
  const counts = { ok: 0, warn: 0, fail: 0, skip: 0, total: results.length };

  for (const result of results) {
    counts[result.status] = (counts[result.status] ?? 0) + 1;
  }

  return counts;
}

/**
 * Report every task as successful, twice: once running and once done.
 *
 * The plan ids are recorded on the control object, which is how a test asserts
 * what the wizard was about to run without running it.
 *
 * @param {Array<{ id: string, title: string, detail: string }>} plan
 * @param {{ onUpdate?: Function }} [options]
 */
export async function runPlan(plan, { onUpdate = () => {} } = {}) {
  control().plans.push(plan.map((task) => task.id));

  const results = plan.map((task) => ({ id: task.id, title: task.title, detail: task.detail, status: "ok", summary: "stubbed", lines: [] }));

  onUpdate(results.map((result) => ({ ...result, status: "running" })));
  onUpdate(results);

  return results;
}
