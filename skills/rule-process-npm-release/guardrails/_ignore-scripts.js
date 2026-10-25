/** Guardrail `release-ignore-scripts`: installing and publishing run no lifecycle script */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** A workflow that publishes an npm package; anything else is a CI job, not a release. */
const PUBLISHES = /\bnpm\s+(?:stage\s+)?publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** An install or a publish, with the rest of the line untouched. */
const SCRIPTED = /\b(?:npm|pnpm|yarn|bun)\s+(?:ci|install|stage\s+publish|publish)\b/u;

const FLAG = /--ignore-scripts\b/u;

export const releaseIgnoreScripts = {
  id: "release-ignore-scripts",
  label: "Installs and publishes pass --ignore-scripts",
  description:
    "A dependency's install script runs on the machine that is about to publish, with whatever the publish job can reach. The release job is the one place where that trade is never worth it: nothing it installs needs a script, and the flag turns every compromised package with a `postinstall` into a failed install instead of an incident.",
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
      .filter((step) => step.uses === "" && SCRIPTED.test(step.run) && !FLAG.test(step.run))
      .map((step) => step.run.split("\n", 1)[0]);

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Add `--ignore-scripts` to the install and to the publish command.",
    };
  },
};
