/** Guardrail `release-least-privilege`: no release job holds a write permission it does not need */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** The one write grant the publish job is supposed to hold. */
const OIDC = /^id-token:\s*write$/iu;

const WRITE = /:\s*write$/u;

export const releaseLeastPrivilege = {
  id: "release-least-privilege",
  label: "No write permission beyond the OIDC token",
  description:
    "A workflow with no `permissions` block gets the repository default, which is often read-write on contents - enough to push a commit or move the tag the release was triggered by. The publish job needs one permission, `id-token: write`, and it needs nothing else, so a second write grant is a capability nobody wrote down.",
  check: (code, context) => {
    if (!WORKFLOW_FILE.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a workflow file, skipping" };
    }

    const workflow = context.helpers.parseWorkflow(code);

    if (!workflow) {
      return { pass: true, note: "Not a readable workflow, skipping" };
    }

    if (!releases(workflow)) {
      return { pass: true, note: "Not a release workflow, skipping" };
    }

    const offenders = [];
    // A job block replaces the workflow block rather than merging, so a
    // workflow-level write only matters for the jobs that declare none.
    const inheriting = workflow.jobs.filter((job) => job.permissions.length === 0);

    if (workflow.permissions.length === 0) {
      offenders.push("no permissions block: the workflow inherits the repository default");
    }

    for (const line of workflow.permissions) {
      if (WRITE.test(line) && inheriting.length > 0) {
        offenders.push(`workflow (${inheriting.map((job) => job.id).join(", ")}): ${line}`);
      }
    }

    for (const job of workflow.jobs) {
      for (const line of job.permissions) {
        if (WRITE.test(line) && !OIDC.test(line)) {
          offenders.push(`${job.id}: ${line}`);
        }
      }
    }

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Declare `contents: read` on every job and `id-token: write` on the publish job alone.",
    };
  },
};
