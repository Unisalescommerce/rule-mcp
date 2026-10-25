/** Guardrail `release-package-list`: somebody looks at what the crate will contain */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\bcargo\s+publish\b(?![^\n]*--dry-run)/u;

const publishes = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

const LISTS = /\bcargo\s+package\b[^\n]*--list/u;

export const releasePackageList = {
  id: "release-package-list",
  label: "The packed file list is inspected before the upload",
  description:
    "`cargo package --list` is the only view of what the `.crate` will contain, and it is the step people skip. A crate that packs test fixtures, a `target/` remnant or a large asset directory either fails at upload - crates.io refuses anything over 10 MB - or ships something nobody meant to publish, and both are permanent.",
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

    const lists = workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && LISTS.test(step.run)));

    return {
      pass: lists,
      failCount: lists ? 0 : 1,
      detail: lists ? [] : ["no `cargo package --list` before the upload"],
      suggestion: "Add `cargo package --list` and read it: it is the diff of the release nobody reviews.",
    };
  },
};
