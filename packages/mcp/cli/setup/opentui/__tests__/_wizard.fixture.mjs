/**
The install and uninstall flows, driven through a fake screen.

The flow talks to a port - `setStep`, `ask`, `confirm`, `progress` - so the
real navigation, the real copy and the real plan are exercised with no
terminal and no native renderer. The dependencies that read or write the
machine are stubbed; everything the user reads is not.
*/

import { mkdtempSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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

Reflect.set(globalThis, "__wizardStub", {
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
});

const { INSTALL_STEPS, installOrder, runInstallWizard, runUninstallWizard, UNINSTALL_STEPS, uninstallOrder } = await import("../_wizard.js");
const { BACK, CANCEL } = await import("../_answers.js");

/**
A screen that answers from a script and records what it was asked.

@param {Array<unknown|Function>} script
*/
function fakeScreen(script) {
  const queue = [...script];
  const screen = { asks: [], paths: [], confirms: [], steps: [], frames: [] };
  const take = (spec) => {
    const answer = queue.shift();

    return typeof answer === "function" ? answer(spec) : answer;
  };

  screen.setStep = (index) => screen.steps.push(index);
  screen.ask = async (spec) => {
    screen.asks.push(spec);

    return take(spec);
  };
  // The path field is its own port call: a fake that only knew `ask` left the
  // typed-path branch unexercised.
  screen.askPath = async (spec) => {
    screen.paths.push(spec);

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

/** Default answers for the five Features screens (catalog order). */
/** One answer per feature screen, then the single attribution question. */
const FEATURE_ANSWERS = ["on", "full", "notify", "on", "off", "keep"];

/** The Scope answer a global run gives: one radio, nothing else. */
const SCOPE_ANSWER = "global";

/** The steps a global run plans, in order, without the profile-specific tail. */
const GLOBAL_PLAN_HEAD = ["runtime-home", "features", "launcher", "attribution", "agent:claude"];

export {
  GLOBAL_PLAN_HEAD,
  INSTALL_STEPS,
  UNINSTALL_STEPS,
  installOrder,
  uninstallOrder,
  runInstallWizard,
  runUninstallWizard,
  BACK,
  CANCEL,
  fakeScreen,
  reset,
  FEATURE_ANSWERS,
  SCOPE_ANSWER,
};
