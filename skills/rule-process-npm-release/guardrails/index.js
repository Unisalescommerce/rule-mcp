/** The rules rule-process-npm-release owns, in canonical order. */
import { releaseActionsPinned } from "./_actions-pinned.js";
import { releaseIdTokenIsolated } from "./_id-token-isolated.js";
import { releaseIgnoreScripts } from "./_ignore-scripts.js";
import { releaseLeastPrivilege } from "./_least-privilege.js";
import { releaseNoNpmToken } from "./_no-token.js";
import { releaseNoPersistCredentials } from "./_no-persist-credentials.js";
import { releaseStagePublish } from "./_stage-publish.js";
import { releaseTagTrigger } from "./_tag-trigger.js";

export const GUARDRAILS = [
  releaseNoNpmToken,
  releaseStagePublish,
  releaseActionsPinned,
  releaseIdTokenIsolated,
  releaseTagTrigger,
  releaseIgnoreScripts,
  releaseNoPersistCredentials,
  releaseLeastPrivilege,
];
