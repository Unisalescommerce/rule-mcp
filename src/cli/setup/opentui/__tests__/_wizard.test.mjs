/**
 * The install and uninstall flows, driven through a fake screen.
 *
 * The flow talks to a port - `setStep`, `ask`, `confirm`, `progress` - so the
 * real navigation, the real copy and the real plan are exercised with no
 * terminal and no native renderer. The dependencies that read or write the
 * machine are stubbed; everything the user reads is not.
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

process.env.RULE_MCP_HOME = mkdtempSync(join(tmpdir(), "rule-mcp-wizard-"));

const STUBBED = new Set(["../_preflight.js", "../_agent-rows.js", "../_rules-apply.js", "../_run-plan.js", "../_scan.js"]);
const stubUrl = pathToFileURL(join(import.meta.dirname, "_wizard-deps.stub.mjs")).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith("/opentui/_wizard.js") && STUBBED.has(specifier)) {
      return { url: stubUrl, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },
});

const CATALOG = {
  items: [
    { id: "claude", label: "Claude Code", detail: ["the reference host"] },
    { id: "copilot", label: "GitHub Copilot", detail: ["no hooks"] },
  ],
  detected: ["claude"],
};

globalThis.__wizardStub = {
  plans: [],
  preflight: {
    checks: [
      { label: "Node.js", status: "ok", detail: "v26.4.0" },
      { label: "git", status: "warn", detail: "not found" },
    ],
    context: { blocked: false, hasLocalBin: false },
  },
  catalog: CATALOG,
  ruleTargets: [],
  scan: { groups: [], purge: [], agents: [] },
};

const { INSTALL_STEPS, installOrder, runInstallWizard, runUninstallWizard, UNINSTALL_STEPS, uninstallOrder } = await import("../_wizard.js");
const { BACK, CANCEL } = await import("../_answers.js");

/**
 * A screen that answers from a script and records what it was asked.
 *
 * @param {Array<unknown|Function>} script
 */
function fakeScreen(script) {
  const queue = [...script];
  const screen = { asks: [], confirms: [], steps: [], frames: [] };
  const take = (spec) => {
    const answer = queue.shift();

    return typeof answer === "function" ? answer(spec) : answer;
  };

  screen.setStep = (index) => screen.steps.push(index);
  screen.ask = async (spec) => {
    screen.asks.push(spec);

    return take(spec);
  };
  screen.confirm = async (spec) => {
    screen.confirms.push(spec);

    return take(spec);
  };
  screen.progress = (spec) => screen.frames.push(spec);

  return screen;
}

const reset = () => {
  globalThis.__wizardStub.plans.length = 0;
  globalThis.__wizardStub.preflight.context.blocked = false;
  globalThis.__wizardStub.scan = { groups: [], purge: [], agents: [] };
};

test("a standard install asks every step and plans the whole profile", async () => {
  reset();
  const screen = fakeScreen(["next", "standard", ["claude"], "auto", "stdio", "standard", "run", "close"]);

  const outcome = await runInstallWizard({ screen });

  assert.equal(outcome.dryRun, false);
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), ["runtime-home", "agent:claude", "rules", "commands", "skills", "cli", "manifest", "doctor"]);
  assert.deepEqual(screen.steps, [0, 1, 2, 3, 4, 5, 6, 7, 8], "the rail lights once per step, in order");
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
  const screen = fakeScreen(["next", "full", ["claude"], "stdio", "full", "run", "close"]);

  await runInstallWizard({ screen });

  assert.deepEqual(screen.asks.find((ask) => ask.title === "Which surface?").initial, ["full"]);
});

test("back from the agents screen re-asks the profile and has no commands step", async () => {
  reset();
  const screen = fakeScreen(["next", "standard", BACK, "minimal", ["claude"], "stdio", "minimal", "run", "close"]);

  await runInstallWizard({ screen });

  assert.equal(screen.asks.filter((ask) => ask.title === "Which installation profile?").length, 2);
  assert.equal(
    screen.asks.some((ask) => ask.title === "Which slash commands?"),
    false,
    "commands ride with Surface, they are not a second screen",
  );
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), ["runtime-home", "agent:claude", "commands", "skills", "cli", "manifest"]);
});

test("a custom profile asks for its dimensions and uses them", async () => {
  reset();
  const screen = fakeScreen(["next", "custom", ["server", "commands"], ["claude"], "stdio", "full", "run", "close"]);

  await runInstallWizard({ screen });

  assert.ok(screen.asks.some((ask) => ask.title === "What should this install write?"));
  assert.deepEqual(globalThis.__wizardStub.plans.at(-1), ["runtime-home", "agent:claude", "commands", "skills", "cli", "manifest"]);
});

test("the review can arm a dry run before the plan runs", async () => {
  reset();
  const screen = fakeScreen(["next", "standard", ["claude"], "auto", "stdio", "standard", "dry", "run", "close"]);

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

test("canceling at any step writes nothing", async () => {
  reset();
  const screen = fakeScreen(["next", CANCEL]);

  assert.equal(await runInstallWizard({ screen }), null);
  assert.deepEqual(globalThis.__wizardStub.plans, []);
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

test("the rails and the orders are pure data", () => {
  assert.deepEqual(INSTALL_STEPS, ["Preflight", "Profile", "Agents", "Depth", "Transport", "Surface", "Review", "Install", "Done"]);
  assert.deepEqual(UNINSTALL_STEPS, ["Select", "Purge", "Review", "Remove", "Done"]);
  assert.deepEqual(installOrder(), ["preflight", "profile", "agents", "depth", "transport", "surface", "review"]);
  assert.deepEqual(uninstallOrder({ hasPurge: true }), ["select", "purge", "review"]);
  assert.deepEqual(uninstallOrder(), ["select", "review"]);
});
