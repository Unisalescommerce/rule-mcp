/**
 * The plan refuses an agent list it cannot act on.
 *
 * The wizard's agent screen used to carry a row whose id was `measured:none`, a
 * note about the study rather than a product. Ticking it put a task in the plan
 * that could only fail with `Unsupported agent` - and because the plan report
 * shows a failed row in red, the symptom appeared at the end of the install
 * instead of at the choice that caused it.
 *
 * The screen is fixed. This is the boundary behind it: whatever a screen, a flag
 * or a caller passes, a plan never carries an agent it cannot install into.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { allAgents } from "../../installers/index.js";
import { buildInstallPlan } from "../_plan-install.js";

test("a name that is not an agent never reaches the plan", () => {
  assert.throws(() => buildInstallPlan({ agents: ["measured:none"] }), /Not an agent name: "measured:none"/u);
});

test("the refusal names every offender at once", () => {
  assert.throws(() => buildInstallPlan({ agents: ["claude", "section:ides", "ghost"] }), /"section:ides", "ghost"/u);
});

test("every catalog agent is still accepted", () => {
  const plan = buildInstallPlan({ agents: [...allAgents] });
  const configured = plan.filter((task) => task.id.startsWith("agent:"));

  assert.equal(configured.length, allAgents.length, "one configure task per agent, none dropped");
});
