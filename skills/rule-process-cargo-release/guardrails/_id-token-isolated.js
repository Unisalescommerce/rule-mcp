/** Guardrail `release-id-token-isolated`: the OIDC exchange happens in a job that only publishes */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\bcargo\s+publish\b(?![^\n]*--dry-run)/u;

const publishes = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

const WRITE = /^id-token:\s*write$/u;

/** Steps that pull a toolchain, dependencies or a cache into the job. */
const SETUP = /^(?:dtolnay\/rust-toolchain|actions-rust-lang\/setup-rust-toolchain|actions\/cache|Swatinem\/rust-cache|actions\/setup-node)/u;

/** A run that resolves, builds or installs something. */
const INSTALLS = /\bcargo\s+(?:fetch|install|build|check|test)\b/u;

export const releaseIdTokenIsolated = {
  id: "release-id-token-isolated",
  label: "The publish token lives in one job that does not build",
  description:
    "`id-token: write` is what lets a job ask crates.io for a short-lived publish token, and any code that job runs can ask for one too. A job that also builds or fetches dependencies hands that power to every build script in the workspace - and a Rust workspace has a lot of them. One job, no toolchain install, no cache: the exchange and the publish, nothing else.",
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
      suggestion: "Build and fetch in a job without the permission; hand `target/package/` to the one job that publishes.",
    };
  },
};
