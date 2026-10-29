/**
 * The install and uninstall flows, driven through a fake screen.
 *
 * The port, the stubs and the screen live in `_wizard.fixture.mjs`; what stays
 * here is what each flow asks and what the plan it builds contains.
 */
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { test } from "node:test";

import {
  BACK,
  FEATURE_ANSWERS,
  SCOPE_ANSWER,
  UNINSTALL_STEPS,
  fakeScreen,
  reset,
  runInstallWizard,
  runUninstallWizard,
  uninstallOrder,
} from "./_wizard.fixture.mjs";

test.after(() => rmSync(process.env.RULE_MCP_HOME, { recursive: true, force: true }));

test("a standard install asks every step and plans the whole profile", async () => {
  reset();
  const screen = fakeScreen(["next", "standard", ["claude"], SCOPE_ANSWER, "auto", "stdio", "standard", ...FEATURE_ANSWERS, "run", "close"]);

  const outcome = await runInstallWizard({ screen });

  assert.equal(outcome.dryRun, false);
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), [
    "runtime-home",
    "features",
    "attribution",
    "agent:claude",
    "rules",
    "commands",
    "skills",
    "cli",
    "manifest",
    "doctor",
  ]);
  assert.deepEqual(screen.steps, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "the rail lights once per step, in order");
  assert.match(screen.confirms.at(-1).title, /Complete/u);
  assert.ok(
    screen.frames.some((frame) => frame.rows.length > 0),
    "the plan is drawn while it runs",
  );
  assert.equal(
    screen.asks.some((ask) => ask.title === "Which slash commands?"),
    false,
    "Surface is the only tier picker",
  );
});

test("the surface defaults to the one the profile implies", async () => {
  reset();
  const screen = fakeScreen(["next", "full", ["claude"], SCOPE_ANSWER, "auto", "stdio", "full", ...FEATURE_ANSWERS, "run", "close"]);

  await runInstallWizard({ screen });

  assert.deepEqual(screen.asks.find((ask) => ask.title === "Which surface?").initial, ["full"]);
});

test("back from the agents screen re-asks the profile and has no commands step", async () => {
  reset();
  const screen = fakeScreen(["next", "standard", BACK, "minimal", ["claude"], SCOPE_ANSWER, "auto", "stdio", "minimal", ...FEATURE_ANSWERS, "run", "close"]);

  await runInstallWizard({ screen });

  assert.equal(screen.asks.filter((ask) => ask.title === "Which installation profile?").length, 2);
  assert.equal(
    screen.asks.some((ask) => ask.title === "Which slash commands?"),
    false,
    "commands ride with Surface, they are not a second screen",
  );
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), [
    "runtime-home",
    "features",
    "attribution",
    "agent:claude",
    "commands",
    "skills",
    "cli",
    "manifest",
  ]);
});

test("a custom profile asks for its dimensions and uses them", async () => {
  reset();
  const screen = fakeScreen([
    "next",
    "custom",
    ["server", "commands"],
    ["claude"],
    SCOPE_ANSWER,
    "auto",
    "stdio",
    "full",
    ...FEATURE_ANSWERS,
    "run",
    "close",
  ]);

  await runInstallWizard({ screen });

  assert.ok(screen.asks.some((ask) => ask.title === "What should this install write?"));
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), [
    "runtime-home",
    "features",
    "attribution",
    "agent:claude",
    "commands",
    "skills",
    "cli",
    "manifest",
  ]);
});

test("the review can arm a dry run before the plan runs", async () => {
  reset();
  const screen = fakeScreen(["next", "standard", ["claude"], SCOPE_ANSWER, "auto", "stdio", "standard", ...FEATURE_ANSWERS, "dry", "run", "close"]);

  const outcome = await runInstallWizard({ screen });

  assert.equal(outcome.dryRun, true);
  assert.equal(screen.confirms.filter((confirm) => confirm.title === "Review").length, 2, "the review is shown again with the new mode");
});

test("a blocked preflight quits without planning anything", async () => {
  reset();
  globalThis.__wizardStub.preflight.context.blocked = true;
  const screen = fakeScreen(["next"]);

  assert.equal(await runInstallWizard({ screen }), null);
  assert.deepEqual(globalThis.__wizardStub.plans, []);
  assert.match(screen.confirms[0].lines.map((line) => line.text).join("\n"), /Fix the failures/u);
});

test("the uninstall offers the scan, the purge and then removes", async () => {
  reset();
  globalThis.__wizardStub.scan = {
    groups: [
      { id: "agents", label: "Agent configs", count: 1, items: ["claude"], detail: "the MCP entry" },
      { id: "rules", label: "Instruction rules", count: 1, items: ["CLAUDE.md"], detail: "the workflow block" },
    ],
    purge: [{ id: "state", label: "State", dir: "/home/me/.rule-mcp/state", exists: true, files: 2 }],
    agents: ["claude"],
  };
  const screen = fakeScreen([["rules"], [], "run", "close"]);

  const outcome = await runUninstallWizard({ screen });

  assert.equal(outcome.dryRun, false);
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), ["rules"]);
  assert.deepEqual(screen.steps, [0, 1, 2, 3, 4]);
  assert.match(screen.confirms.at(-1).title, /Complete/u);
});

test("an uninstall with nothing to remove says so and stops", async () => {
  reset();
  const screen = fakeScreen(["close"]);

  const outcome = await runUninstallWizard({ screen });

  assert.deepEqual(outcome.results, []);
  assert.match(screen.confirms[0].title, /Nothing to remove/u);
  assert.deepEqual(globalThis.__wizardStub.plans, []);
});


