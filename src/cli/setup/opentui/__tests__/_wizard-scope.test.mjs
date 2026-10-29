/**
@module test/setup/wizard-scope

The Scope step: where the install writes, which projects, and which kind of
entry. A global answer costs one radio; a project answer carries the roots and
builds the project plan instead.

@see ADR 193 - setup --scope project records projects.json and wires install writers
*/

import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { FEATURE_ANSWERS, INSTALL_STEPS, SCOPE_ANSWER, UNINSTALL_STEPS, fakeScreen, installOrder, reset, runInstallWizard, uninstallOrder } from "./_wizard.fixture.mjs";

const base = ["next", "standard", ["claude"]];

test("a global answer records the scope and writes no project", async () => {
  reset();
  const screen = fakeScreen([...base, SCOPE_ANSWER, "auto", "stdio", "standard", ...FEATURE_ANSWERS, "run", "close"]);

  await runInstallWizard({ screen });

  assert.ok(screen.asks.some((ask) => ask.title === "Where does this install write?"), "the scope is asked once");
  const plan = globalThis.__wizardStub.plans.at(-1);

  assert.ok(plan.includes("agent:claude"), `a global answer writes the agent config: ${plan.join(", ")}`);
  assert.equal(plan.some((id) => String(id).includes(process.cwd())), false, "and writes nothing into a project");
});

test("a project answer asks for the roots and the kind, and plans the project installs", async () => {
  reset();
  const screen = fakeScreen([...base, "project", ["cwd"], "shared", "auto", "stdio", "standard", ...FEATURE_ANSWERS, "run", "close"]);

  await runInstallWizard({ screen });

  const plan = globalThis.__wizardStub.plans.at(-1);

  assert.ok(plan.some((id) => String(id).includes(resolve(process.cwd()))), `the plan writes into the chosen root: ${plan.join(", ")}`);
  assert.equal(plan.some((id) => String(id).startsWith("agent:")), false, "and does not write a global agent config");
});

test("the rails and the orders are pure data", () => {
  assert.deepEqual(INSTALL_STEPS, ["Preflight", "Profile", "Agents", "Scope", "Depth", "Transport", "Surface", "Features", "Review", "Install", "Done"]);
  assert.deepEqual(UNINSTALL_STEPS, ["Select", "Purge", "Review", "Remove", "Done"]);
  assert.deepEqual(installOrder(), ["preflight", "profile", "agents", "scope", "depth", "transport", "surface", "features", "review"]);
  assert.deepEqual(uninstallOrder({ hasPurge: true }), ["select", "purge", "review"]);
  assert.deepEqual(uninstallOrder(), ["select", "review"]);
});
test("a typed path comes from the path field, not from a free-text answer", async () => {
  reset();
  const root = resolve(process.cwd(), "src");
  const screen = fakeScreen([...base, "project", ["p"], root, "shared", "auto", "stdio", "standard", ...FEATURE_ANSWERS, "run", "close"]);

  await runInstallWizard({ screen });

  assert.equal(screen.paths.length, 1, "the field is asked once");
  assert.equal(screen.paths[0].title, "Project root");
  const plan = globalThis.__wizardStub.plans.at(-1);

  assert.ok(plan.some((id) => String(id).includes(root)), `the typed root is planned: ${plan.join(", ")}`);
});
