/** Guardrail `release-stage-publish`: a release stages the version before it publishes it */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** The staged form, removed before the plain form is looked for. */
const STAGED = /\bnpm\s+stage\s+publish\b/gu;

/** The publish that goes straight to the registry. */
const PLAIN = /\bnpm\s+publish\b/u;

export const releaseStagePublish = {
  id: "release-stage-publish",
  label: "Publish through staging, not directly",
  description:
    "Staged publishing turns one irreversible step into two: `npm stage publish` uploads the tarball where nobody can install it, and the stage is approved separately before it becomes a version. A workflow that calls `npm publish` has already given up that window - by the time anyone reads the run, the version exists.",
  check: (code, context) => {
    if (!WORKFLOW_FILE.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a workflow file, skipping" };
    }

    const workflow = context.helpers.parseWorkflow(code);

    if (!workflow) {
      return { pass: true, note: "Not a readable workflow, skipping" };
    }

    const offenders = workflow.jobs
      .flatMap((job) => job.steps)
      .map((step) => step.run)
      .filter((run) => run.trim() !== "")
      .filter((run) => PLAIN.test(run.split(STAGED).join("")));

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Use `npm stage publish`, then approve the stage - the tarball exists, the version does not.",
    };
  },
};
