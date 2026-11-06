/**
@module test/installers/attribution

Attribution is one table row per agent, and a row exists only with a page that
says so. The tests pin three things: the table covers every catalog agent and
marks what is not documented instead of guessing, an undocumented row leaves a
file byte-identical, and a documented row flips between hide and keep without
ever overwriting a value the user set.

@see docs/adr/_pending/attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md
*/

import test from "node:test";
import assert from "node:assert/strict";

import { allAgents } from "../_catalog.js";
import { attributionRow, attributionRows, applyAttribution } from "../_attribution.js";
import { attributionRows as rowsFromData } from "../_attribution.data.js";

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

test("the table has one row for every agent in the catalog", () => {
  const rows = attributionRows();

  assert.equal(rows.length, allAgents.length, `${rows.length} rows for ${allAgents.length} agents`);
  assert.deepEqual(
    rows.map((row) => row.agent),
    [...allAgents],
    "the table is in catalog order, so a new agent shows up here instead of being forgotten",
  );
  assert.deepEqual(
    rowsFromData().map((row) => row.agent),
    [...allAgents],
    "the data module and the reader agree",
  );
});

test("a row without a cited page carries no values at all", () => {
  const unverified = attributionRows().filter((row) => row.evidence === "unverified");

  assert.ok(unverified.length > 0, "most agents are undocumented today, and the table says so");
  for (const row of unverified) {
    assert.equal(row.mechanism, null, `${row.agent}: no mechanism is claimed`);
    assert.equal(row.file, null, `${row.agent}: no file is claimed`);
    assert.equal(row.key, null, `${row.agent}: no key is claimed`);
    assert.equal(row.keep, null);
    assert.equal(row.hide, null);
  }
});

test("Claude Code is documented from its settings reference", () => {
  const row = attributionRow("claude");

  assert.equal(row.mechanism, "commit-trailer");
  assert.equal(row.key, "attribution");
  assert.equal(row.hide, false, "setting attribution to false hides the commit trailer and the PR line");
  assert.match(row.evidence, /^https:\/\/code\.claude\.com\/docs\/en\/settings-reference/, "the page the row came from is cited");
});

test("Gemini documents no attribution control, so its row states that and writes nothing", () => {
  const row = attributionRow("gemini");

  assert.equal(row.mechanism, "none");
  assert.equal(row.key, null);
  assert.match(row.evidence, /google-gemini\/gemini-cli/, "the configuration page is cited");
});

test("an undocumented agent leaves the file byte-identical", () => {
  const before = json({ theme: "dark" });
  const result = applyAttribution("codex", before, { mode: "hide" });

  assert.equal(result.status, "not-documented");
  assert.equal(result.text, before);
});

test("a documented row hides, and keep puts the file back", () => {
  const start = json({ theme: "dark" });
  const hidden = applyAttribution("claude", start, { mode: "hide" });

  assert.equal(hidden.status, "applied");
  assert.deepEqual(JSON.parse(hidden.text), { theme: "dark", attribution: false });

  const kept = applyAttribution("claude", hidden.text, { mode: "keep" });

  assert.equal(kept.status, "applied");
  assert.deepEqual(JSON.parse(kept.text), { theme: "dark" }, "keep removes the marker an install wrote");
});

test("a value the user set survives both directions", () => {
  const mine = json({ attribution: { commit: "Co-Authored-By: me", pr: "" } });

  assert.equal(applyAttribution("claude", mine, { mode: "hide" }).text, mine, "hide never overwrites a user object");
  assert.equal(applyAttribution("claude", mine, { mode: "keep" }).text, mine);
  assert.equal(applyAttribution("claude", mine, { mode: "hide" }).status, "unchanged");
});

test("the same mode twice is idempotent", () => {
  const once = applyAttribution("claude", json({}), { mode: "hide" }).text;
  const twice = applyAttribution("claude", once, { mode: "hide" });

  assert.equal(twice.text, once);
  assert.equal(twice.status, "unchanged");
});

test("a file the writer cannot parse is refused, not overwritten", () => {
  const broken = '{ "attribution": false, }\n';
  const result = applyAttribution("claude", broken, { mode: "hide" });

  assert.equal(result.status, "refused");
  assert.equal(result.text, broken);
});
