/** @module core/runtime/features - user-facing feature switches */

export { FEATURES, featureIds, levelsFor, envPatchFor, defaultLevel } from "./_catalog.data.js";
export { READERS, readLevel, readAllLevels } from "./_readers.js";
export { envConfigPath, readSavedEnv, applyEnvPatch, mergedEnv } from "./_store.js";
export { resolveRequestedLevel, setFeatureLevel, parseFeatureSpecs } from "./_apply.js";
export { ADR_FEATURE_TOOLS, ADR_FEATURE_PROMPTS, isAdrFeatureOff } from "./_adr-gate.js";
