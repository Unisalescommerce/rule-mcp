/** Guardrail `release-build-no-sources`: the published artifact builds without tool.uv.sources */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** A `uv build`, with or without flags. */
const BUILD = /\buv\s+build\b/u;

/** The one flag that makes the build match what another build tool would produce. */
const NO_SOURCES = /--no-sources\b/u;

export const releaseBuildNoSources = {
  id: "release-build-no-sources",
  label: "The release build passes --no-sources",
  description:
    "`uv build` honours `tool.uv.sources`, so a wheel built in a repository where a dependency points at a path or a git checkout bakes that substitution into the metadata. Consumers installing the sdist with pip or build get a package that cannot resolve, and nobody sees it until the release is out. `--no-sources` is the documented publish recommendation because it builds the package the way every other tool will.",
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

    const builds = workflow.jobs.flatMap((job) => job.steps).filter((step) => step.uses === "" && BUILD.test(step.run));

    if (builds.length === 0) {
      return { pass: true, note: "No build step in this workflow" };
    }

    const offenders = builds.filter((step) => !NO_SOURCES.test(step.run)).map((step) => step.run.split("\n", 1)[0]);

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Run `uv build --no-sources` in the job that produces the artifacts, and keep the sources resolution for local development.",
    };
  },
};
