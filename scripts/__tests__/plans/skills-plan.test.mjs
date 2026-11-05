/**
 * @module test/plans/skills-plan
 *
 * The plan catalog is a graph, and a graph nothing checks is prose.
 *
 * ADR 154 gives every plan a format: a status line from a closed vocabulary, a
 * `## Dependency graph` section with parseable lines, and checkbox steps. ADR 153
 * gives the catalog an order: nodes are plans, edges have four kinds, stages
 * order them, and a dependency sits in an earlier stage than the node that needs
 * it - unless the edge names a phase, because then what closes first is the
 * phase, not the plan.
 *
 * This test is the contract. It failed on the catalog as it stood on
 * 2026-10-21 (0 of 93 plans had a graph section) and it is meant to keep that
 * from happening again.
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { edges, graphLine, graphSection, nodeId, stagesFromPlan as stagesFromPlanText } from "./_plan-graph.fixture.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const plansRoot = join(root, "docs", "plans");
const skillsPlans = join(plansRoot, "skills");

/** Files under docs/plans that are not executable plans. */
const NOT_A_PLAN = new Set(["skills/README.md", "skills/DEPENDENCIES.md", "skills/_skills-plan.md", "_deepseek-prompts.md", "_plan-of-plans-reference.md", "plan-of-plans.md"]);
const STATUSES = new Set(["planned", "in-progress", "done", "blocked", "superseded"]);
const GRAPH_LINES = ["Depends on:", "Feeds:", "Shared files:"];
/** Every plan file, relative to docs/plans, sorted. */
function planFiles() {
  const found = [];

  for (const area of readdirSync(skillsPlans, { withFileTypes: true })) {
    if (!area.isDirectory()) {
      continue;
    }

    for (const entry of readdirSync(join(skillsPlans, area.name))) {
      if (entry.endsWith(".md")) {
        found.push(`skills/${area.name}/${entry}`);
      }
    }
  }

  for (const entry of readdirSync(plansRoot)) {
    if (entry.endsWith(".md")) {
      found.push(entry);
    }
  }

  return found.filter((path) => !NOT_A_PLAN.has(path)).sort();
}

const files = planFiles();
const texts = new Map(files.map((path) => [path, readFileSync(join(plansRoot, path), "utf8")]));
const planText = readFileSync(join(skillsPlans, "_skills-plan.md"), "utf8");
const levelZeroText = readFileSync(join(plansRoot, "plan-of-plans.md"), "utf8");

const stagesFromPlan = () => stagesFromPlanText(planText);

test("the level-zero index registers every self-registering top-level plan", () => {
  const missing = files.filter((path) => !path.startsWith("skills/") && texts.get(path).includes("WS0 - Register this plan")).filter((path) => !levelZeroText.includes(path));

  assert.deepEqual(missing, [], `register these plans in plan-of-plans.md: ${missing.join(", ")}`);
});

test("every plan carries a checkbox step", () => {
  const offenders = files.filter((path) => !/^- \[[ xX]\]/m.test(texts.get(path)));

  assert.deepEqual(offenders, [], `add at least one step to: ${offenders.join(", ")}`);
});

test("every plan carries a status from the closed vocabulary", () => {
  const offenders = [];

  for (const path of files) {
    const line = texts.get(path).match(/^Status:\s*(.+)$/m);

    if (!line) {
      offenders.push(`${path}: no Status: line`);
      continue;
    }

    const value = line[1].split(/[\s,.]/, 1)[0].replaceAll("`", "");

    if (!STATUSES.has(value)) {
      offenders.push(`${path}: "${value}"`);
    }
  }

  assert.deepEqual(offenders, [], `normalise these status lines: ${offenders.slice(0, 12).join("; ")}`);
});

test("every plan carries a dependency graph with its three lines", () => {
  const offenders = [];

  for (const path of files) {
    const section = graphSection(texts.get(path));

    if (!section) {
      offenders.push(`${path}: no section`);
      continue;
    }

    for (const label of GRAPH_LINES) {
      if (graphLine(section, label) === "") {
        offenders.push(`${path}: no ${label} line`);
      }
    }
  }

  assert.deepEqual(offenders, [], `retrofit these plans: ${offenders.slice(0, 12).join("; ")}`);
});

test("the stage tables list every node exactly once", () => {
  const stageOf = stagesFromPlan();
  const seen = new Map();

  for (const [id, stage] of stageOf) {
    seen.set(id, (seen.get(id) ?? 0) + 1);

    if (seen.get(id) > 1) {
      assert.fail(`${id} appears in a stage table twice`);
    }

    assert.ok(stage >= 0, `${id} has no stage number`);
  }

  const missing = [...texts.keys()]
    .filter((path) => path.startsWith("skills/") && !path.endsWith("_skills-plan.md"))
    .map(nodeId)
    .filter((id) => !stageOf.has(id));

  assert.deepEqual(missing, [], `add these nodes to a stage table: ${missing.join(", ")}`);
});

test("the graph is acyclic", () => {
  const nodes = new Set([...texts.keys()].map(nodeId));
  const edgesOf = new Map();

  for (const path of files) {
    const deps = edges(graphLine(graphSection(texts.get(path)), "Depends on:"))
      .map((edge) => edge.id)
      .filter((target) => nodes.has(target));

    edgesOf.set(nodeId(path), deps);
  }

  const state = new Map();
  const cycle = [];

  const visit = (id) => {
    if (state.get(id) === "done") {
      return;
    }

    if (state.get(id) === "open") {
      cycle.push(id);

      return;
    }

    state.set(id, "open");

    for (const next of edgesOf.get(id) ?? []) {
      visit(next);
    }

    state.set(id, "done");
  };

  for (const id of edgesOf.keys()) {
    visit(id);
  }

  assert.deepEqual(cycle, [], `dependency cycle through: ${cycle.join(" -> ")}`);
});

test("a CONTRACT edge names a phase the target plan has", () => {
  const offenders = [];

  for (const path of files) {
    for (const edge of edges(graphLine(graphSection(texts.get(path)), "Depends on:"))) {
      if (edge.kind !== "CONTRACT") {
        continue;
      }

      if (edge.phase === null) {
        offenders.push(`${path}: contract with ${edge.id} names no phase`);
        continue;
      }

      const target = files.find((candidate) => nodeId(candidate) === edge.id);

      if (!target) {
        offenders.push(`${path}: contract with ${edge.id}, which is not a plan`);
        continue;
      }

      if (!new RegExp(String.raw`^#{2,4} Phase ${edge.phase}\b`, "m").test(texts.get(target))) {
        offenders.push(`${path}: contract with ${edge.id}#${edge.phase}, which has no such phase`);
      }
    }
  }

  assert.deepEqual(offenders, [], `fix these phase references: ${offenders.join("; ")}`);
});

test("a dependency sits in an earlier stage than the node", () => {
  const stageOf = stagesFromPlan();
  const offenders = [];

  for (const path of files) {
    const id = nodeId(path);

    if (!stageOf.has(id)) {
      continue;
    }

    for (const edge of edges(graphLine(graphSection(texts.get(path)), "Depends on:"))) {
      // A contract blocks on one exporting phase, so its target plan may sit in
      // the same stage: the phase closes first, not the plan.
      if (edge.phase !== null || !stageOf.has(edge.id)) {
        continue;
      }

      if (stageOf.get(edge.id) >= stageOf.get(id)) {
        offenders.push(`${path}: ${edge.id} is stage ${stageOf.get(edge.id)}, node is ${stageOf.get(id)}`);
      }
    }
  }

  assert.deepEqual(offenders, [], `move a node or an edge: ${offenders.join("; ")}`);
});

test("done means no open box, and the progress table matches the files", () => {
  const offenders = [];

  for (const path of files) {
    const text = texts.get(path);
    const open = [...text.matchAll(/^- \[ \]/gm)].length;

    if (/^Status:\s*`?done`?/m.test(text) && open > 0) {
      offenders.push(`${path}: done with ${open} open step(s)`);
    }
  }

  for (const row of planText.split("\n")) {
    const cells = row.split("|").map((cell) => cell.trim());
    const id = cells[1]?.match(/^`([a-z0-9-]+)`$/)?.[1];
    const target = id ? files.find((path) => nodeId(path) === id) : null;

    if (!target) {
      continue;
    }

    const total = [...texts.get(target).matchAll(/^- \[[ xX]\]/gm)].length;
    const closed = [...texts.get(target).matchAll(/^- \[[xX]\]/gm)].length;
    const cell = cells.find((value) => /^\d+\/\d+$/.test(value));

    if (cell && cell !== `${closed}/${total}`) {
      offenders.push(`${target}: table says ${cell}, file says ${closed}/${total}`);
    }
  }

  assert.deepEqual(offenders, [], `fix these: ${offenders.join("; ")}`);
});

test("every plan path in the catalog resolves", () => {
  const missing = files.filter((path) => !existsSync(join(plansRoot, path)));

  assert.deepEqual(missing, [], `resolve these paths: ${missing.join(", ")}`);
});
