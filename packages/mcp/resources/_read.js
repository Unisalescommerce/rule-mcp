/** @module resources/read - serve one rule:// body; `./_serve.js` is the way out callers use */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getSkillsDirs as getSkillsDirectories } from "../cli/paths/index.js";
import { readSkill } from "../tools/router/index.js";
import { projectBody } from "./_read-project.js";

/** One JSON body, the shape half of this module's answers share. */
const json = (uri, value) => ({ contents: [{ uri, mimeType: "application/json", text: JSON.stringify(value, null, 2) }] });

/**
 * Serve a resource by its URI, before compression.
 *
 * @param {string} uri - e.g. "rule://skills", "rule://rule-frontend-react"
 * @returns {Promise<{ contents: Array<{ uri: string, mimeType: string, text: string }> }>}
 */
export async function serveResource(uri) {
  // Bundled skills only - the same single source of truth the tool surface uses.
  const { embeddedSkills } = getSkillsDirectories();

  // ── Skill index ────────────────────────────────────────────────
  if (uri === "rule://skills") {
    const directories = [];

    for (const base of [embeddedSkills]) {
      try {
        for (const entry of readdirSync(base, { withFileTypes: true })) {
          // The catalog prefix is `rule-` (ADR 160); the URI pattern below
          // accepts both spellings so an old link still resolves.
          if (!(entry.isDirectory() && entry.name.startsWith("rule-"))) {
            continue;
          }

          const sp = join(base, entry.name, "SKILL.md");
          try {
            const c = readFileSync(sp, "utf8");
            directories.push({ name: entry.name, path: sp, length: c.length });
          } catch {
            /* no SKILL.md */
          }
        }
      } catch {
        /* no dir */
      }
    }

    return json(uri, directories);
  }

  // ── Templates catalog ──────────────────────────────────────────
  if (uri === "rule://templates") {
    const { listTemplateCategories } = await import("../core/scaffold/templates/index.js");

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(listTemplateCategories(), null, 2),
        },
      ],
    };
  }

  // ── rule-mcp skill ───────────────────────────────────────────
  if (uri === "rule://ai") {
    return { contents: [{ uri, mimeType: "text/markdown", text: readSkill("rule") || "" }] };
  }

  // ── A11y resources ─────────────────────────────────────────────
  if (uri === "rule://a11y") {
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text:
            "For a11y testing with Playwright + axe-core, see rule-styleguide-a11y and /rule-persona-a11y.\n\n" +
            "Use `/rule-area-styleguide` (and related styleguide skills) for templates and config generation.",
        },
      ],
    };
  }

  if (uri === "rule://a11y/test-basic") {
    const { getTemplate } = await import("../core/scaffold/templates/index.js");
    const tmpl = getTemplate("a11y-test-basic");

    return { contents: [{ uri, mimeType: "text/plain", text: typeof tmpl === "string" ? tmpl : tmpl?.html || "" }] };
  }

  if (uri === "rule://a11y/test-forms") {
    const { getTemplate } = await import("../core/scaffold/templates/index.js");
    const tmpl = getTemplate("a11y-test-forms");

    return { contents: [{ uri, mimeType: "text/plain", text: typeof tmpl === "string" ? tmpl : tmpl?.html || "" }] };
  }

  // ── rule://community - list community skills ───────────────────
  if (uri === "rule://community") {
    const { getSkillNames, isPluginSkill, readSkill } = await import("../tools/router/index.js");
    const allSkills = getSkillNames();
    const plugins = [];

    for (const name of allSkills) {
      if (!isPluginSkill(name)) {
        continue;
      }

      const content = readSkill(name);
      const desc = content?.match(/^description:\s*(.+)$/m)?.[1]?.trim() || "User-defined plugin skill";
      plugins.push({ name, description: desc, type: "plugin", source: "~/.agents/skills/" });
    }

    const result = { plugins, known_community: [], total: plugins.length };

    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result, null, 2) }] };
  }

  // ── rule://project - analyze project and suggest tools ──────────
  if (uri === "rule://project") {
    return json(uri, await projectBody());
  }

  // ── Dynamic: rule://<skill-name> or rule://<skill-name>/<part> ──
  // Both protocol spellings are accepted: `rulemcp://` is the alias a released
  // client may still send.
  const m = uri?.match(/^(?:rulemcp|rule):\/\/(rule-(?:mcp-)?(?:[a-z0-9]+-)*[a-z0-9]+)(?:\/(\w+))?$/u);

  if (m) {
    const [, skillName, section] = m;
    const content = readSkill(skillName);

    if (content) {
      if (section === "summary") {
        const lines = content.split("\n").slice(0, 30).join("\n");

        return { contents: [{ uri, mimeType: "text/markdown", text: `# ${skillName} (summary)\n\n${lines}\n\n...` }] };
      }

      return { contents: [{ uri, mimeType: "text/markdown", text: content }] };
    }
  }

  return { contents: [{ uri, mimeType: "text/plain", text: "Resource not found" }] };
}
