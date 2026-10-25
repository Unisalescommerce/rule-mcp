/** The rules rule-process-cargo-release owns, in canonical order. */
import { releaseActionsPinned } from "./_actions-pinned.js";
import { releaseDryRunFirst } from "./_dry-run-first.js";
import { releaseIdTokenIsolated } from "./_id-token-isolated.js";
import { releaseManifestMetadata } from "./_manifest-metadata.js";
import { releaseNoLongLivedToken } from "./_no-long-lived-token.js";
import { releasePackageList } from "./_package-list.js";
import { releaseTokenStepScoped } from "./_token-step-scoped.js";
import { releaseVersionNotInWorkflow } from "./_version-not-in-workflow.js";

export const GUARDRAILS = [
  releaseNoLongLivedToken,
  releaseTokenStepScoped,
  releaseActionsPinned,
  releaseIdTokenIsolated,
  releaseDryRunFirst,
  releasePackageList,
  releaseManifestMetadata,
  releaseVersionNotInWorkflow,
];
