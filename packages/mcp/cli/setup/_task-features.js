/**
 * @module cli/setup/task-features
 *
 * Apply feature levels (and optional ADR policy) before host installs write
 * env into mcp configs.
 */

import { POLICY_ENV } from "../../core/adr-policy/_words.data.js";
import { parseFeatureSpecs, setFeatureLevel } from "../../core/runtime/features/index.js";
import { applyEnvPatch } from "../../core/runtime/features/_store.js";

/**
 * Persist wizard/flag feature answers into env.json.
 *
 * @param {{ features?: Array<{ id: string, level: string }>|string[], adrPolicy?: string|null }} answers
 * @returns {{ id: string, title: string, detail: string, run: Function }}
 */
export const featuresTask = ({ features = [], adrPolicy = null } = {}) => ({
  id: "features",
  title: "Feature switches",
  detail: features.length > 0 || adrPolicy ? "env.json" : "defaults kept",
  run: ({ dryRun }) => {
    const specs = Array.isArray(features) && typeof features[0] === "string" ? parseFeatureSpecs(features) : features;
    const lines = [];

    for (const { id, level } of specs) {
      const result = setFeatureLevel(id, level, { dryRun });

      lines.push(`${result.id}=${result.level}`);
    }

    if (adrPolicy) {
      applyEnvPatch({ [POLICY_ENV]: adrPolicy }, { dryRun });
      lines.push(`${POLICY_ENV}=${adrPolicy}`);
    }

    return {
      status: "ok",
      summary: lines.length > 0 ? `${lines.length} switch(es)` : "unchanged",
      lines,
    };
  },
});
