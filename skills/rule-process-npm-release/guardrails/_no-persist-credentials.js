/** Guardrail `release-no-persist-credentials`: a checkout in a release workflow keeps no token */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** A workflow that publishes an npm package; anything else is a CI job, not a release. */
const PUBLISHES = /\bnpm\s+(?:stage\s+)?publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** The action that leaves the job's token in `.git/config` unless told not to. */
const CHECKOUT = /^actions\/checkout@/u;

const KEPT = /^persist-credentials:\s*false$/iu;

export const releaseNoPersistCredentials = {
  id: "release-no-persist-credentials",
  label: "Checkout keeps no credentials",
  description:
    "`actions/checkout` writes the job's token into the clone by default, and every later step in that job can push with it. A release job needs to read the repository, not write to it, so the credential is a capability nobody asked for - and the publish job is exactly where a leaked one costs the most.",
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

    const offenders = workflow.jobs
      .flatMap((job) => job.steps)
      .filter((step) => CHECKOUT.test(step.uses) && step.with.every((line) => !KEPT.test(line)))
      .map((step) => step.uses);

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Add `with: persist-credentials: false` to every checkout in the release workflow.",
    };
  },
};
