/** Guardrail `release-token-step-scoped`: the temporary token reaches one step and no other */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\bcargo\s+publish\b(?![^\n]*--dry-run)/u;

const publishes = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** The names cargo reads a registry token from, at any level. */
const TOKEN = /\bcargo_registr(?:y_token|ies_\w+_token)\b/iu;

export const releaseTokenStepScoped = {
  id: "release-token-step-scoped",
  label: "The publish token is written on the publish step",
  description:
    "cargo cannot perform the OIDC exchange itself - `cargo publish --help` has no token or OIDC flag - so the temporary credential is injected through the environment. Where it is written decides who can read it: on the publish step it exists for that one command, at job level every step inherits it, and at workflow level every job does. The exchange buys nothing if the token is then handed to a build script.",
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

    const offenders = [];

    for (const line of workflow.env) {
      if (TOKEN.test(line)) {
        offenders.push(`workflow: ${line}`);
      }
    }

    for (const job of workflow.jobs) {
      for (const line of job.env) {
        if (TOKEN.test(line)) {
          offenders.push(`${job.id}: ${line}`);
        }
      }
    }

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Move the token to the `cargo publish` step's own `env:`, so no other step in the job can read it.",
    };
  },
};
