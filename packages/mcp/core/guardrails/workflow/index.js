/**
 * @module core/guardrails/workflow
 *
 * A GitHub Actions workflow read as jobs and steps, with no YAML dependency.
 *
 * The release guardrails ask questions about structure, not about text: *is the
 * token inside the publish step's `env`?*, *which job carries `id-token`?*,
 * *does the job that publishes also install dependencies?* A regex over the
 * file cannot answer any of those, and three release skills would each need
 * their own answer, so the indentation rules live here once.
 *
 * A rule still imports nothing: the engine hands helpers over as
 * `context.helpers` (ADR 089), so adding `parseWorkflow` to that bag is a
 * contract change, taken when the first release rule needs it.
 */

import { blockOf, entriesAt, envOf, itemsOf, lineOf, mapOf, permissionsOf } from "./_lines.js";

/** One step, reduced to the fields a release rule asks about. */
function stepOf(entries, index) {
  const field = (key) => entries.find((entry) => entry.key === key);

  return {
    index,
    name: field("name")?.value ?? "",
    uses: field("uses")?.value ?? "",
    run: blockOf(field("run")),
    withKeys: mapOf(field("with")?.body ?? []).map((entry) => entry.key),
    with: mapOf(field("with")?.body ?? []).map(lineOf),
    env: envOf(field("env")),
  };
}

/** One job: its own block, and the steps a rule inspects. */
function jobOf(entry) {
  const fields = mapOf(entry.body);

  return {
    id: entry.key,
    permissions: permissionsOf(fields.find((field) => field.key === "permissions")),
    env: envOf(fields.find((field) => field.key === "env")),
    needs: fields.find((field) => field.key === "needs")?.value ?? "",
    steps: itemsOf(fields.find((field) => field.key === "steps")?.body ?? []).map(stepOf),
  };
}

/**
 * Read a workflow. Returns `null` when the text is not one, or when it is
 * written in a shape this reader does not claim to read.
 *
 * @param {string} text
 * @returns {{ on: { values: string[], text: string }, permissions: string[], env: string[], jobs: Array<{ id: string, permissions: string[], env: string[], needs: string, steps: Array<{ index: number, name: string, uses: string, run: string, withKeys: string[], with: string[], env: string[] }> }> }|null}
 */
export function parseWorkflow(text = "") {
  const source = text;

  // A tab in the indentation is a shape this reader does not read, and a rule
  // that passes is better than a rule that misparses a legitimate workflow.
  if (source.includes("\t")) {
    return null;
  }

  const top = entriesAt(source.split("\n"), 0);
  const jobs = top.find((entry) => entry.key === "jobs");
  const on = top.find((entry) => entry.key === "on");

  // An anchor, an alias or a merge key moves the structure somewhere this
  // reader cannot follow, so it reports nothing rather than part of a file.
  if (!jobs || !on || /^[&*]/u.test(jobs.value) || jobs.body.some((line) => line.trimStart().startsWith("<<"))) {
    return null;
  }

  return {
    on: {
      values: on.value ? [on.value] : mapOf(on.body).map(lineOf),
      text: [on.value, ...on.body.map((line) => line.trim())].filter(Boolean).join("\n"),
    },
    permissions: permissionsOf(top.find((entry) => entry.key === "permissions")),
    env: envOf(top.find((entry) => entry.key === "env")),
    jobs: mapOf(jobs.body).map(jobOf),
  };
}

/**
 * One job by id, or null.
 *
 * @param {ReturnType<typeof parseWorkflow>} workflow
 * @param {string} id
 * @returns {object|null}
 */
export function jobNamed(workflow, id) {
  return workflow?.jobs.find((job) => job.id === id) ?? null;
}

export * from "./_lines.js";
