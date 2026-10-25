/** Guardrail `release-sync-locked`: CI resolves the committed lockfile instead of a fresh one */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

const SYNC = /\buv\s+sync\b/u;

const LOCKED = /--(?:locked|frozen)\b/u;

export const releaseSyncLocked = {
  id: "release-sync-locked",
  label: "CI syncs the lockfile it committed",
  description:
    "`uv sync` without `--locked` re-resolves the dependency tree on the machine that is about to build the release, so the artifact can carry a version of a package that exists in no commit. Whatever the lockfile says is what the release should ship; `--locked` turns a drift into a failed run instead of a wheel nobody can reproduce.",
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
      .filter((step) => step.uses === "" && SYNC.test(step.run) && !LOCKED.test(step.run))
      .map((step) => step.run.split("\n", 1)[0]);

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Pass `--locked` to every `uv sync` in the release workflow, and commit `uv.lock`.",
    };
  },
};
