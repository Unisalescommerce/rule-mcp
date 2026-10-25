/** Guardrail `release-tag-trigger`: a publish workflow runs on tags, not on every push */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** A workflow that publishes an npm package; anything else is a CI job, not a release. */
const PUBLISHES = /\bnpm\s+(?:stage\s+)?publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

export const releaseTagTrigger = {
  id: "release-tag-trigger",
  label: "Releases are triggered by a tag",
  description:
    "A release workflow with no tag filter turns every push to the default branch into a publish attempt. The tag is the human decision that says *this commit is the version*; when the trigger drops it, the version becomes a side effect of a merge nobody described as a release.",
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

    const triggeredOnTag = /\btags\b/u.test(workflow.on.text);

    return {
      pass: triggeredOnTag,
      failCount: triggeredOnTag ? 0 : 1,
      detail: triggeredOnTag ? [] : [workflow.on.text || "on: (none)"],
      suggestion: "Add a `tags:` filter matching the repository's tag format (`v*`, `[0-9]*`, `<name>@*`).",
    };
  },
};
