/** The bundler family rules rule-toolchain owns, in canonical order. */
import { bundlerDevNotExposed } from "./_bundler-dev-not-exposed.js";
import { bundlerIoDeclared } from "./_bundler-io-declared.js";
import { bundlerNoPublicSecret } from "./_bundler-no-public-secret.js";
import { bundlerSourcemapPolicy } from "./_bundler-sourcemap-policy.js";
import { bundlerTargetDeclared } from "./_bundler-target-declared.js";

/** The family rules, in canonical order. */
export const GUARDRAILS = [bundlerNoPublicSecret, bundlerDevNotExposed, bundlerTargetDeclared, bundlerIoDeclared, bundlerSourcemapPolicy];
