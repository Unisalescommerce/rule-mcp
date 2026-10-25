/** Guardrail `release-no-long-lived-token`: the publish token is exchanged, not stored */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** A workflow that actually publishes; `--dry-run` is verification, not a release. */
const PUBLISHES = /\bcargo\s+publish\b(?![^\n]*--dry-run)/u;

const publishes = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** The names cargo reads a registry token from. */
const TOKEN = /\bcargo_registr(?:y_token|ies_\w+_token)\b/iu;

/** A value that comes from a repository secret, which is the shape a long-lived token has. */
const SECRET = /secrets\./u;

export const releaseNoLongLivedToken = {
  id: "release-no-long-lived-token",
  label: "No long-lived crates.io token in a release workflow",
  description:
    "crates.io supports Trusted Publishing: an OIDC exchange returns a token that expires in 30 minutes and the action that fetches it revokes it when the job ends. A workflow that still reads `CARGO_REGISTRY_TOKEN` from `secrets.` holds a credential that can publish any version of any crate its owner can reach, and it survives the release - which is the one thing the exchange removes.",
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

    const steps = workflow.jobs.flatMap((job) => job.steps);
    const candidates = [...workflow.env, ...workflow.jobs.flatMap((job) => [...job.env, ...job.steps.flatMap((step) => step.env)])];
    const offenders = candidates.filter((line) => TOKEN.test(line) && SECRET.test(line));

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion:
        "Add a Trusted Publisher on crates.io for this workflow filename and let `rust-lang/crates-io-auth-action` mint the token: `env: CARGO_REGISTRY_TOKEN: ${{ steps.auth.outputs.token }}`.",
    };
  },
};
