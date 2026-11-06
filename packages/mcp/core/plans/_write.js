/**
@module core/plans/write

Materialize a durable development plan under docs/plans/_*.md and register
it in plan-of-plans.md (ADR 146). Host CreatePlan session files are not
written here.
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { DEVELOPMENT_PLAN_SHAPE_GUIDE, scanDevelopmentPlanShape } from "./_shape.js";

const PLANS_DIR = "docs/plans";
const INDEX_FILE = "plan-of-plans.md";

/**
Force a single-segment `_<slug>` filename stem.

@param {unknown} slug
@returns {{ ok: true, slug: string, filename: string } | { ok: false, error: string }}
*/
export function normalizePlanSlug(slug) {
  const raw = String(slug ?? "").trim();

  if (!raw) {
    return { ok: false, error: "slug is required" };
  }

  if (raw.includes("/") || raw.includes("\\") || raw.includes("..")) {
    return { ok: false, error: "slug must be a single path segment (no / or ..)" };
  }

  const base = raw.replace(/\.md$/i, "");
  const withUnderscore = base.startsWith("_") ? base : `_${base}`;

  if (withUnderscore === "_") {
    return { ok: false, error: "slug is empty after normalize" };
  }

  return { ok: true, slug: withUnderscore, filename: `${withUnderscore}.md` };
}

/**
Minimal scaffold when the caller passes title/topic but no body.

@param {{ title: string, topic?: string }} fields
@returns {string}
*/
export function buildPlanScaffold({ title, topic }) {
  const heading = title.trim() || "untitled plan";
  const note = topic?.trim() ? `\n\nTopic: ${topic.trim()}\n` : "\n";

  return [
    `# Plan: ${heading}`,
    "",
    "Status: `planned`",
    `Notes: subordinate plan (leading \`_\`); coordinated by [plan-of-plans](plan-of-plans.md).`,
    note,
    "## Dependency graph",
    "",
    "```",
    "WS1  (fill edges)",
    "```",
    "",
    "Depends on: -",
    "",
    "Feeds: -",
    "",
    "Shared files: -",
    "",
    "### WS1 - First workstream",
    "",
    "- [ ] **WS1-T1**: replace with the first concrete task",
    "",
    `<!-- shape: ${DEVELOPMENT_PLAN_SHAPE_GUIDE} -->`,
    "",
  ].join("\n");
}

/**
Insert a snapshot row and a WS-D checkbox when the filename is new.

@param {string} indexText
@param {{ filename: string, label: string, status?: string, openWork?: string }} entry
@returns {string}
*/
export function patchPlanOfPlans(indexText, { filename, label, status = "planned", openWork = "own graph" }) {
  let next = indexText;

  if (!next.includes(`\`${filename}\``) && !next.includes(`](${filename})`)) {
    const row = `| ${label} | \`${filename}\` | \`${status}\` | ${openWork} |`;
    const snapshotTable = /(##\s+1\b[\s\S]*?\n\|[-|\s]+\|\n)([\s\S]*?)(\n##\s+)/;

    if (snapshotTable.test(next)) {
      next = next.replace(snapshotTable, (_, head, rows, rest) => `${head}${rows.trimEnd()}\n${row}\n${rest}`);
    } else {
      next = `${next.trimEnd()}\n\n${row}\n`;
    }

    const checkbox = `- [ ] [\`${filename}\`](${filename}) - ${openWork}.`;

    if (/###\s+WS-D\b/.test(next)) {
      next = next.replace(/(###\s+WS-D\b[^\n]*\n(?:.*\n)*?)(?=\n###\s|\n##\s|$)/, (block) => (block.includes(filename) ? block : `${block.trimEnd()}\n${checkbox}\n`));
    } else {
      next = `${next.trimEnd()}\n\n### WS-D - Single-document tracks\n\n${checkbox}\n`;
    }
  }

  return next;
}

/**
Write `docs/plans/_<slug>.md` and register it in `plan-of-plans.md`.

@param {{
  projectDir?: string,
  slug: string,
  title: string,
  body?: string,
  topic?: string,
  overwrite?: boolean,
  openWork?: string,
}} input
@returns {{
  ok: true,
  path: string,
  slug: string,
  filename: string,
  indexPatched: boolean,
} | {
  ok: false,
  error: string,
  path?: string,
}}
*/
export function writeDevelopmentPlan(input) {
  const projectDir = input.projectDir || ".";
  const normalized = normalizePlanSlug(input.slug);

  if (!normalized.ok) {
    return { ok: false, error: normalized.error };
  }

  const plansDir = join(projectDir, PLANS_DIR);
  const filePath = join(plansDir, normalized.filename);
  const relativePath = `${PLANS_DIR}/${normalized.filename}`;

  if (existsSync(filePath) && !input.overwrite) {
    return {
      ok: false,
      error: `${relativePath} already exists; pass overwrite:true to replace it`,
      path: relativePath,
    };
  }

  const body = (input.body && String(input.body).trim()) || buildPlanScaffold({ title: input.title, topic: input.topic });
  const shape = scanDevelopmentPlanShape(body);

  if (!shape.ok) {
    return {
      ok: false,
      error: `plan body fails development-plan shape: ${shape.findings.map((finding) => finding.detail).join("; ")}`,
    };
  }

  const indexPath = join(plansDir, INDEX_FILE);

  if (!existsSync(indexPath)) {
    return { ok: false, error: `missing ${PLANS_DIR}/${INDEX_FILE}; create the index before registering a plan` };
  }

  mkdirSync(plansDir, { recursive: true });
  writeFileSync(filePath, body.endsWith("\n") ? body : `${body}\n`);

  const indexText = readFileSync(indexPath, "utf8");
  const patched = patchPlanOfPlans(indexText, {
    filename: normalized.filename,
    label: String(input.title || normalized.slug).trim() || normalized.slug,
    openWork: input.openWork || "own graph",
  });

  if (patched !== indexText) {
    writeFileSync(indexPath, patched.endsWith("\n") ? patched : `${patched}\n`);
  }

  return {
    ok: true,
    path: relativePath,
    slug: normalized.slug,
    filename: normalized.filename,
    indexPatched: patched !== indexText,
  };
}
