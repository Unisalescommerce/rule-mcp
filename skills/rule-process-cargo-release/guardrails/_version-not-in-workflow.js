/** Guardrail `release-version-not-in-workflow`: the version comes from the manifest, not from a literal */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\bcargo\s+publish\b(?![^\n]*--dry-run)/u;

const publishes = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** A version written into a step: `cargo set-version 1.2.3`, or a `sed` on the version line. */
const LITERAL = /\bcargo\s+set-version\s+["']?\d+\.\d+\.\d+|sed\b[^\n]*\bversion\s*=\s*["']?\d+\.\d+\.\d+/u;

export const releaseVersionNotInWorkflow = {
  id: "release-version-not-in-workflow",
  label: "The version is not written in the workflow",
  description:
    "A version baked into a tag-triggered workflow is a second source of truth: the tag says one thing, the step writes another, and whichever lands second wins silently. The version belongs in `Cargo.toml` (or `[workspace.package]`), bumped by `cargo-release`, `release-plz` or a human in the commit the tag points at - never rewritten by the release pipeline that is supposed to ship it.",
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

    const offenders = workflow.jobs
      .flatMap((job) => job.steps)
      .map((step) => step.run)
      .filter((run) => LITERAL.test(run));

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Bump the version in `Cargo.toml` in the commit the tag points at, or let `release-plz` do it; the pipeline should release a version, not invent one.",
    };
  },
};
