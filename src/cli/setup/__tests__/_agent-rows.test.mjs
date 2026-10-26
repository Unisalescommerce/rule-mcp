/**
 * The agent screen may only offer what the plan can act on.
 *
 * A row whose id is not an agent name is a finding, not a choice: the measured
 * group says "these products have no documented config file", and the section
 * headers only group the rows below them. Ticking one used to reach
 * `installAgent`, which answered "Unsupported agent: measured:none" - a red row
 * on the plan screen, produced by the wizard's own list.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { agentRows } from "../_agent-rows.js";
import { enabledIds } from "../opentui/_list.js";

test("every tickable row on the agent screen is a real agent name", () => {
  const { items } = agentRows();
  const sections = new Set(items.filter((item) => item.section).map((item) => item.id));
  const tickable = enabledIds(items);

  assert.ok(tickable.length > 0, "the screen must offer something");

  for (const id of tickable) {
    assert.ok(!sections.has(id), `${id} is a section header and must not be tickable`);
    assert.ok(!id.includes(":"), `${id} is not an agent name; the plan would answer "Unsupported agent"`);
  }
});

test("the measured group stays readable without being selectable", () => {
  const { items } = agentRows();
  const measured = items.find((item) => item.id === "measured:none");

  if (measured === undefined) {
    return; // nothing was measured as non-installable, so there is no group to show
  }

  assert.equal(measured.disabled, true, "a row the install cannot act on must be marked disabled");
  assert.ok(Array.isArray(measured.detail) && measured.detail.length > 0, "a disabled row keeps its detail so the reason travels");
});
