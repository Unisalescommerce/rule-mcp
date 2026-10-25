/** Guardrail `release-id-token-isolated`: the OIDC exchange happens in a job that only publishes */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

const WRITE = /^id-token:\s*write$/u;

/** Steps that pull an interpreter, dependencies or a cache into the job. */
const SETUP = /^(?:actions\/setup-python|astral-sh\/setup-uv|actions\/cache)/u;

/** A run that syncs or installs dependencies. */
const INSTALLS = /\buv\s+(?:sync|pip\s+install)\b|\bpip\s+install\b/u;

export const releaseIdTokenIsolated = {
  id: "release-id-token-isolated",
  label: "The publish token lives in one job that does not install",
  description:
    "`id-token: write` is what lets a job ask PyPI for a short-lived publish token, and any code that job runs can ask for one too. A job that also syncs dependencies hands that power to every build hook in the tree, and a job that shares the permission with another job hands it over twice. One job, no sync, no cache: the publish step and nothing else that resolves a dependency.",
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
        const caches = step.with.some((line) => /^cache:/iu.test(line));

        if (setup || installs || caches) {
          offenders.push(`${job.id}: ${step.uses || step.run.split("\n", 1)[0]} runs beside the publish token`);
        }
      }
    }

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Build and sync in a job without the permission; hand `dist/` to the one job that publishes.",
    };
  },
};
