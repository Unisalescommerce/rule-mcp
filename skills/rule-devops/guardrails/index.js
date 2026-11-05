/** The rules rule-devops owns, in canonical order. */
import { environmentGitignore } from "./_env-gitignore.js";
import { secretDetection } from "./_secret-detection.js";
import { findKnownSecrets } from "./_secret-known-pattern.js";

const secretDetectionWithPatterns = {
  ...secretDetection,
  check: (code, context) => secretDetection.check(code, { ...context, findKnownSecrets }),
};

/** Guardrails owned by the devops skill. */
export const GUARDRAILS = [environmentGitignore, secretDetectionWithPatterns];
