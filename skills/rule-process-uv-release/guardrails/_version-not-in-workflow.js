/** Guardrail `release-version-not-in-workflow`: the version comes from the tag, not from a literal */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** `uv version <literal>`, and not the `--bump`, `--dry-run` or bare read form. */
const LITERAL = /\buv\s+version\s+["']?\d+\.\d+\.\d+/u;

export const releaseVersionNotInWorkflow = {
  id: "release-version-not-in-workflow",
  label: "The version is not written in the workflow",
  description:
    "A version baked into a tag-triggered workflow is a second source of truth: the tag says one thing, the step writes another, and whichever lands second wins silently. Either the version lives in `pyproject.toml` and the workflow only reads it, or it is bumped in the same commit the tag points at - a literal in the workflow is the case where nobody agrees.",
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
      .map((step) => step.run)
      .filter((run) => LITERAL.test(run));

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Read the version from `pyproject.toml`, or bump it with `uv version --bump <part>` in the commit the tag points at.",
    };
  },
};
