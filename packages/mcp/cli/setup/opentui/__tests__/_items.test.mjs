/**
 * Every sentence the wizard shows, asserted as data.
 *
 * The flow is tested against a fake screen in `_wizard.test.mjs`; this file is
 * about what each screen says. A dimension row that promises a write the plan
 * does not make is a bug you can only catch here.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { getSkillNames } from "../../../../tools/router/index.js";
import {
  dimensionItems,
  doneLines,
  installedDimensions,
  preflightLines,
  profileItems,
  progressRows,
  purgeItems,
  reviewLines,
  surfaceAreaItems,
  surfaceItems,
  selectionFromSurface,
  surfaceLabel,
  surfaceSkillItems,
  tallyLine,
  uninstallItems,
} from "../_items.js";
import { modeItems } from "../_items-depth.js";

test("every profile says which dimensions and which surface it turns on", () => {
  const profiles = profileItems();

  assert.deepEqual(
    profiles.map((item) => item.id),
    ["minimal", "standard", "full", "custom"],
  );
  assert.ok(profiles.every((item) => item.detail.some((line) => line.startsWith("Tool surface:"))));
  assert.match(profiles.find((item) => item.id === "custom").detail.join("\n"), /Nothing is preselected/u);
});

test("the dimension rows name the agents and the files they touch", () => {
  const rows = dimensionItems({ agents: ["claude"], ruleFiles: ["/home/me/CLAUDE.md"] });

  assert.match(rows.find((row) => row.id === "rules").detail.join("\n"), /\/home\/me\/CLAUDE\.md/u);
  assert.match(rows.find((row) => row.id === "commands").detail.join("\n"), /claude: .*commands/u, "the row names the directory it writes");
  assert.equal(rows.find((row) => row.id === "hooks").disabled, false, "claude documents a writable hook file");
  assert.equal(rows.find((row) => row.id === "doctor").disabled, undefined);
});

test("the hooks row is disabled, with a reason, when no selected host can take one", () => {
  const rows = dimensionItems({ agents: ["copilot", "aider"] });
  const hooks = rows.find((row) => row.id === "hooks");

  assert.equal(hooks.disabled, true);
  assert.equal(hooks.note, "no host");
  assert.match(hooks.detail.join("\n"), /No selected agent documents a hook/u);
});

test("a transport the selected agents cannot use says who", () => {
  const rows = modeItems(["pi", "copilot"]);
  const daemon = rows.find((row) => row.id === "daemon");

  assert.match(daemon.label, /not recommended for copilot/u);
  assert.match(daemon.note, /^pi, vscode only$/u);
});

test("with no agent selected the remote transports are offered without a warning", () => {
  assert.deepEqual(
    modeItems([]).map((row) => row.label),
    ["stdio", "daemon", "docker"],
  );
});

test("every surface preset states its price and mentions the slash commands", () => {
  const rows = surfaceItems();
  const skills = getSkillNames().length;

  assert.deepEqual(
    rows.map((row) => row.id),
    ["full", "standard", "custom"],
  );
  assert.equal(rows[0].note, `${skills} skill tools`);
  assert.match(rows[1].note, /^\d+ hub tools$/u);
  assert.ok(rows.every((row) => /slash|commands/i.test(row.detail.join(" "))));
});

test("the custom surface drill-down lists areas then their skills", () => {
  const areas = surfaceAreaItems();

  assert.ok(areas.length > 0);
  assert.ok(areas.every((area) => /^\d+ skills$/u.test(area.note)));

  const skills = surfaceSkillItems([areas[0].id]);

  assert.ok(skills.length > 0);
  assert.ok(skills.every((skill) => skill.id.startsWith(`rule-${areas[0].id}`)));
});

test("a surface answer becomes one review line", () => {
  assert.equal(surfaceLabel(null), "saved surface (unchanged)");
  assert.equal(surfaceLabel({ preset: "full" }), "surface full");
  assert.equal(surfaceLabel({ areas: ["core", "ui"] }), "surface areas core,ui");
  assert.equal(surfaceLabel({ skills: ["a", "b"] }), "surface 2 skills");
});

test("the command selection follows the surface tier", () => {
  assert.deepEqual(selectionFromSurface({ preset: "standard" }), { preset: "standard" });
  assert.deepEqual(selectionFromSurface({ areas: ["frontend", "data"] }), {
    families: ["areas", "personas", "tasks"],
    areas: ["frontend", "data"],
  });
  assert.deepEqual(selectionFromSurface({ skills: ["rule-ai"] }), {
    families: ["areas", "personas", "tasks"],
    skills: ["rule-ai"],
  });
  assert.equal(selectionFromSurface(null), null);
});

test("the review hides a long plan behind a count and states whether it is a dry run", () => {
  const plan = Array.from({ length: 5 }, (_, index) => ({ id: `t${index}`, title: `Task ${index}`, detail: "" }));
  const live = reviewLines(plan, { limit: 2 });
  const dry = reviewLines(plan, { limit: 2, dryRun: true });

  assert.match(live[2].text, /3 more/u);
  assert.match(live.at(-1).text, /Live run/u);
  assert.match(dry.at(-1).text, /Dry run/u);
});

test("the closing summary lists failures by message, not by count", () => {
  const summary = doneLines({
    counts: { ok: 1, warn: 0, fail: 1, skip: 0 },
    results: [
      { id: "a", title: "A", status: "ok", summary: "" },
      { id: "b", title: "B", status: "fail", summary: "disk full" },
    ],
    dryRun: false,
    nextSteps: ["rule-mcp doctor"],
  });

  assert.equal(summary.heading, "Finished with failures");
  assert.match(summary.lines.map((line) => line.text).join("\n"), /disk full/u);
  assert.match(summary.lines.map((line) => line.text).join("\n"), /rule-mcp doctor/u);
});

test("a run row uses a spinner while the task is running", () => {
  const rows = progressRows([
    { id: "a", title: "A", status: "running", summary: "" },
    { id: "b", title: "B", status: "ok", summary: "done" },
  ]);

  assert.equal(rows[0].tone, "info");
  assert.equal(rows[0].bold, true);
  assert.match(rows[1].text, /done/u);
});

test("the tally line omits statuses with nothing in them", () => {
  assert.doesNotMatch(tallyLine({ ok: 2, warn: 0, fail: 0, skip: 0 }), /warn|fail|skip/u);
});

test("only recorded dimensions are offered for removal, and the doctor never is", () => {
  assert.deepEqual(installedDimensions({ dimensions: { server: true, rules: false, doctor: true } }), ["server"]);
  assert.deepEqual(installedDimensions({}), []);
});

test("the uninstall list is the manifest first, then what the scan found", () => {
  const groups = [
    { id: "agents", label: "Agent configs", count: 2, items: ["claude", "cursor"], detail: "the MCP entries" },
    { id: "rules", label: "Instruction rules", count: 1, items: ["CLAUDE.md"], detail: "the workflow block" },
    { id: "skills", label: "Copied skills", count: 3, items: ["a", "b", "c"], detail: "the skill directories" },
  ];
  const offered = uninstallItems({ manifest: { dimensions: { server: true, rules: true, doctor: true } }, groups });

  assert.deepEqual(
    offered.map((item) => item.id),
    ["agents", "rules", "skills"],
    "the doctor has nothing to remove, and the scan covers what the manifest never recorded",
  );
  assert.match(offered[0].note, /2 recorded/u);
});

test("a machine with no manifest falls back to the scan, and agents stay out of it", () => {
  const groups = [
    { id: "agents", label: "Agent configs", count: 1, items: ["claude"], detail: "" },
    { id: "rules", label: "Instruction rules", count: 1, items: ["CLAUDE.md"], detail: "" },
  ];

  assert.deepEqual(
    uninstallItems({ manifest: {}, groups }).map((item) => item.id),
    ["rules"],
  );
});

test("a purge row states whether the directory exists and how much it holds", () => {
  const rows = purgeItems([
    { id: "state", label: "State", dir: "/home/me/.rule-mcp/state", exists: true, files: 4 },
    { id: "config", label: "Config", dir: "/home/me/.rule-mcp/config", exists: false, files: 0 },
  ]);

  assert.equal(rows[0].note, "4 file(s)");
  assert.equal(rows[1].note, "absent");
});

test("preflight checks keep their glyph and their tone", () => {
  const rows = preflightLines([{ label: "Node.js", status: "ok", detail: "v26.4.0" }]);

  assert.match(rows[0].text, /Node\.js/u);
  assert.equal(rows[0].tone, "ok");
});
