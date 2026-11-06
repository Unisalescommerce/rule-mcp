/** @module core/adr-policy - when to write ADRs */

export { CATEGORIES, DEFAULT_LEVEL, LEVEL_ALIASES, LEVELS, POLICY_ENV, POLICY_FILE } from "./_words.data.js";
export { allowsAdrWrite, levelFor, normalizeLevel, parsePolicyDocument, policyFingerprint, resolveAdrPolicy } from "./_resolve.js";
export { ADR_RULE, adrRule } from "./_rule.js";
