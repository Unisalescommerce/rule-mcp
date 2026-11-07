/** @module core/skills/skill-tools - one tool per skill that asks for one */

import { exposesTool, getSkillNames } from "../../tools/router/index.js";
import { registerSkillTool } from "../../tools/skill/index.js";

/** The three names the server registers itself rather than as a per-skill tool. */
export const REGISTERED_BY_CODE = new Set(["rule-mcp", "rule-meta", "rule-process-adr"]);

/**
 * Register one tool per skill that asks for one.
 *
 * A skill from a project or a home directory mints a tool only when its
 * frontmatter asks (ADR 081), so dropping a folder in adds rules and
 * searchable evidence without growing the surface every turn pays for.
 */
export function registerSkillTools() {
  for (const name of getSkillNames()) {
    if (!REGISTERED_BY_CODE.has(name) && exposesTool(name)) {
      registerSkillTool(name);
    }
  }
}
