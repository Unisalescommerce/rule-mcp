/** Reading the plan graph: ids, edges, retirement and cascade levels. */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Where plans live, relative to the project root. */
const PLAN_DIR = "docs/plans";
const ADR_DIR = "docs/adr";

/** Indexes and queues: they carry no steps and no edges. */
const NOT_A_PLAN = new Set(["plan-of-plans.md", "_plan-of-plans-reference.md", "README.md", "DEPENDENCIES.md", "_skills-plan.md"]);

/** Every markdown file under a directory, recursively. */
function markdownFiles(dir) {
  const out = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...markdownFiles(path));
    } else if (entry.name.endsWith(".md")) {
      out.push(path);
    }
  }

  return out;
}

/** The id a plan's edges use: the file stem with `_` and `rule-mcp-` normalized. */
export function planId(file) {
  const stem = file.split("/").pop().replace(/\.md$/, "").replace(/^_/, "");

  return stem.replace(/^rule-mcp-/, "rule-");
}

/** How many unchecked steps a plan still carries. */
export function openSteps(text) {
  return (text.match(/^\s*-\s*\[ \]\s+\S/gm) ?? []).length;
}

/** The edges a plan declares, as `{ id, kind }`, in the order they are written. */
export function edgesOf(text) {
  const line = text.match(/^Depends on:\s*(.*)$/m)?.[1] ?? "";
  const edges = Array.from(line.matchAll(/`([a-z0-9-]+)(?:#\d+)?`\s*\((HARD|ORDER|CONFLICT|CONTRACT)\)/g), (match) => ({ id: match[1], kind: match[2] }));

  return edges;
}

/** Every plan file with its status, open count and edges.

@param {string} projectDir
@returns {Map<string, { id: string, file: string, path: string, status: string, open: number, edges: Array<{id: string, kind: string}> }>}
*/
export function readPlans(projectDir) {
  const plans = new Map();
  const root = join(projectDir, PLAN_DIR);
  let files;

  try {
    files = markdownFiles(root);
  } catch {
    return plans;
  }

  for (const file of files) {
    const relative = file.slice(projectDir.length + 1);
    const name = file.split("/").pop();

    if (NOT_A_PLAN.has(name)) {
      continue;
    }

    const text = readFileSync(file, "utf8");

    plans.set(planId(file), {
      id: planId(file),
      file,
      path: relative,
      status: text.match(/^Status:\s*`?([a-z-]+)`?/m)?.[1] ?? "none",
      open: openSteps(text),
      edges: edgesOf(text),
    });
  }

  return plans;
}

/** The plan ids a closeout ADR already retired, so their edges count as met. */
export function retiredPlans(projectDir) {
  let files;

  try {
    files = readdirSync(join(projectDir, ADR_DIR)).filter((name) => /close-out-plan-.*\.md$/.test(name));
  } catch {
    return new Set();
  }

  const retired = new Set();

  for (const file of files) {
    const text = readFileSync(join(projectDir, ADR_DIR, file), "utf8");
    const stem = text.match(/Close out plan (_?[A-Za-z0-9-]+)/)?.[1];

    if (stem) {
      retired.add(stem.replace(/^_/, "").replace(/^rule-mcp-/, "rule-"));
    }
  }

  return retired;
}

/**
Whether a plan's prerequisites are met: a dependency is satisfied when its
plan has no open step, and a gap in the plan directory is satisfied only when
a closeout ADR names it. Anything else is an unknown edge, which the report
names instead of guessing.

@param {string} id
@param {Map<string, object>} plans
@param {Set<string>} retired
@returns {"met"|"blocked"|"unknown"}
*/
export function dependencyState(id, plans, retired) {
  if (plans.has(id)) {
    return plans.get(id).open === 0 ? "met" : "blocked";
  }

  return retired.has(id) ? "met" : "unknown";
}

/** The cascade level of a plan: 1 when nothing precedes it, else one past its deepest prerequisite. */
export function levelOf(id, plans, retired, seen = new Set()) {
  const plan = plans.get(id);

  if (!plan || seen.has(id)) {
    return 1;
  }

  seen.add(id);
  const hard = plan.edges.filter((edge) => edge.kind === "HARD" && plans.has(edge.id));

  return 1 + Math.max(0, ...hard.map((edge) => levelOf(edge.id, plans, retired, seen)));
}
