/** Guardrail `release-id-token-isolated`: the OIDC exchange happens in a job that only publishes */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** A workflow that publishes an npm package; anything else is a CI job, not a release. */
const PUBLISHES = /\bnpm\s+(?:stage\s+)?publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

const WRITE = /^id-token:\s*write$/u;

/** Steps that pull code, dependencies or a cache into the job. */
const SETUP = /^(?:actions\/setup-node|actions\/cache|pnpm\/action-setup|oven-sh\/setup-bun)/u;

/** A run that installs dependencies. */
const INSTALLS = /(?:^|[\s;&|])(?:npm|pnpm|yarn|bun)\s+(?:ci|install)\b/u;

export const releaseIdTokenIsolated = {
  id: "release-id-token-isolated",
  label: "The publish token lives in one job that does not install",
  description:
    "`id-token: write` is what lets a job ask npm for a short-lived publish token, and any code that job runs can ask for one too. A job that also installs dependencies hands that power to every install script in the tree, and a job that shares the permission with another job hands it over twice. One job, no install, no cache: the minting step and the publishing step, nothing else.",
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

    if (workflow.permissions.some((line) => WRITE.test(line))) {
      return {
        pass: false,
        failCount: 1,
        detail: ["workflow-level permissions grant id-token: write to every job"],
        suggestion: "Move `id-token: write` onto the publishing job alone.",
      };
    }

    const holders = workflow.jobs.filter((job) => job.permissions.some((line) => WRITE.test(line)));
    const offenders = [];

    if (holders.length > 1) {
      offenders.push(`id-token: write on ${holders.map((job) => job.id).join(", ")}`);
    }

    for (const job of holders) {
      for (const step of job.steps) {
        const setup = SETUP.test(step.uses.replace(/@.*$/u, ""));
        const installs = step.uses === "" && INSTALLS.test(step.run);
        const caches = step.withKeys.includes("cache");

        if (setup || installs || caches) {
          offenders.push(`${job.id}: ${step.uses || step.run.split("\n", 1)[0]} runs beside the publish token`);
        }
      }
    }

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Install, build and cache in a job without the permission; hand the artifacts to the one job that publishes.",
    };
  },
};
