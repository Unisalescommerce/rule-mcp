/** Guardrail `release-dry-run-first`: the archive is built and checked before it is uploaded */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\bcargo\s+publish\b(?![^\n]*--dry-run)/u;

const publishes = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** The dry run, or `cargo package`, which performs the same first three steps. */
const DRY_RUN = /\bcargo\s+(?:publish\s+[^\n]*--dry-run|package\b)/u;

export const releaseDryRunFirst = {
  id: "release-dry-run-first",
  label: "A dry run runs before the upload",
  description:
    "A publish is permanent: the version cannot be overwritten and the code cannot be deleted. `cargo publish --dry-run` (or `cargo package`, which is the same three steps) builds the archive, verifies it compiles and leaves it in `target/package`, so a crate that fails to package fails before the version exists. Without it, the first time anyone sees the contents is after the upload.",
  check: (code, context) => {
    if (!WORKFLOW_FILE.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a workflow file, skipping" };
    }

    const workflow = context.helpers.parseWorkflow(code);

    if (!workflow) {
      return { pass: true, note: "Not a readable workflow, skipping" };
    }

    if (!publishes(workflow)) {
      return { pass: true, note: "Not a release workflow, skipping" };
    }

    const verifies = workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && DRY_RUN.test(step.run)));

    return {
      pass: verifies,
      failCount: verifies ? 0 : 1,
      detail: verifies ? [] : ["no `cargo publish --dry-run` or `cargo package` before the upload"],
      suggestion: "Add a verify job (or a step) that runs `cargo publish --dry-run --locked` before the publish job.",
    };
  },
};
