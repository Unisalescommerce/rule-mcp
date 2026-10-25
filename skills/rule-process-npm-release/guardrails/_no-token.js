/** Guardrail `release-no-npm-token`: no npm credential anywhere in a release workflow */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/**
 * A credential by the names the npm ecosystem publishes it under: the token a
 * workflow would set in `.npmrc`, and the environment variables setup-node and
 * the npm CLI read. Matching the name is enough - a release workflow has no
 * legitimate reason to hold one.
 */
const CREDENTIAL = /(?:secrets\.\w*npm|npm_token|node_auth_token|npm_auth_token|_authtoken)/iu;

export const releaseNoNpmToken = {
  id: "release-no-npm-token",
  label: "No npm token in a release workflow",
  description:
    "A token in the workflow is the whole supply chain attack surface of an npm release: it can publish any version of any package its owner can reach, it survives the release, and it is the one secret a compromised dependency is hunting for. Trusted Publishing removes the reason to hold it - npm mints a short-lived credential from the workflow's OIDC identity - so a workflow that still carries one is a workflow that has not finished the migration.",
  check: (code, context) => {
    if (!WORKFLOW_FILE.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a workflow file, skipping" };
    }

    const workflow = context.helpers.parseWorkflow(code);

    if (!workflow) {
      return { pass: true, note: "Not a readable workflow, skipping" };
    }

    const steps = workflow.jobs.flatMap((job) => job.steps);
    const candidates = [...workflow.env, ...workflow.jobs.flatMap((job) => [...job.env, ...job.steps.flatMap((step) => step.env)]), ...steps.map((step) => step.run)];
    const offenders = candidates.filter((line) => CREDENTIAL.test(line));

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Delete the credential, add a Trusted Publisher on npmjs.com for this workflow, and let the workflow request its own token with `permissions: id-token: write`.",
    };
  },
};
