/** The rules rule-process-uv-release owns, in canonical order. */
import { releaseActionsPinned } from "./_actions-pinned.js";
import { releaseAttestations } from "./_attestations.js";
import { releaseBuildNoSources } from "./_build-no-sources.js";
import { releaseIdTokenIsolated } from "./_id-token-isolated.js";
import { releaseLeastPrivilege } from "./_least-privilege.js";
import { releaseNoPypiToken } from "./_no-pypi-token.js";
import { releaseSyncLocked } from "./_sync-locked.js";
import { releaseVersionNotInWorkflow } from "./_version-not-in-workflow.js";

export const GUARDRAILS = [
  releaseNoPypiToken,
  releaseBuildNoSources,
  releaseActionsPinned,
  releaseIdTokenIsolated,
  releaseSyncLocked,
  releaseVersionNotInWorkflow,
  releaseAttestations,
  releaseLeastPrivilege,
];
