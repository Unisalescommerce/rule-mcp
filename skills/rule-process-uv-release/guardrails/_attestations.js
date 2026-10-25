/** Guardrail `release-attestations`: a workflow that claims provenance produces it */

const WORKFLOW_FILE = /\.ya?ml$/iu;

const PUBLISHES = /\buv\s+publish\b/u;

const releases = (workflow) => workflow.jobs.some((job) => job.steps.some((step) => step.uses === "" && PUBLISHES.test(step.run)));

/** Any mention of provenance in the workflow text. */
const CLAIMS = /attestation/iu;

/** A step that actually creates one. */
const CREATES = /(?:pypi-attestations|gh\s+attestation|cosign\s+attest|sigstore)/u;

export const releaseAttestations = {
  id: "release-attestations",
  label: "Provenance is produced, not assumed",
  description:
    "`uv publish` uploads an attestation it finds beside an artifact and **creates none** - the docs say so, and a pipeline that assumes otherwise ships a release with no provenance while believing it has one. The rule fires on the gap: the workflow talks about attestations and no step produces them.",
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

    if (!CLAIMS.test(code)) {
      return { pass: true, note: "No provenance claim, nothing to check" };
    }

    const creates = workflow.jobs.some((job) => job.steps.some((step) => CREATES.test(step.run) || CREATES.test(step.uses)));

    return {
      pass: creates,
      failCount: creates ? 0 : 1,
      detail: creates ? [] : ["the workflow mentions attestations and no step creates them"],
      suggestion: "Add the step that generates `<artifact>.publish.attestation` before `uv publish`, or drop the claim - uv uploads attestations and never produces them.",
    };
  },
};
