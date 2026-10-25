/** Guardrail `release-no-pypi-token`: no PyPI credential anywhere in a release workflow */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** A workflow that publishes a Python package; anything else is a CI job, not a release. */
const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/**
 * The names the Python ecosystem publishes a registry credential under: uv's own
 * variables, the twine pair people carry over from older pipelines, and the
 * generic API-token secret name.
 */
const CREDENTIAL = /(?:uv_publish_token|uv_publish_password|pypi_api_token|twine_password|secrets\.\w*pypi)/iu;

/** A `uv publish` that takes the token on the command line. */
const FLAG = /\buv\s+publish\b[^\n]*--(?:token|password)\b/u;

export const releaseNoPypiToken = {
  id: "release-no-pypi-token",
  label: "No PyPI token in a release workflow",
  description:
    "A PyPI token can upload any version of any project its owner can reach, it survives the release, and it is the first secret a compromised dependency looks for. Trusted Publishing removes the reason to hold one - uv exchanges the workflow's OIDC identity for a short-lived credential and revokes it afterwards, even when the upload fails - so a workflow that still carries a token has not finished the migration.",
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

    const steps = workflow.jobs.flatMap((job) => job.steps);
    const candidates = [...workflow.env, ...workflow.jobs.flatMap((job) => [...job.env, ...job.steps.flatMap((step) => step.env)]), ...steps.map((step) => step.run)];
    const offenders = candidates.filter((line) => CREDENTIAL.test(line) || FLAG.test(line));

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion:
        "Delete the credential, add a Trusted Publisher on PyPI for this workflow filename, and let `uv publish` request its own token with `permissions: id-token: write`.",
    };
  },
};
