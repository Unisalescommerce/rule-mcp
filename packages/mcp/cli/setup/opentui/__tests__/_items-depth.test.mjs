/**
 * The depth screen reads in words, not in rungs.
 *
 * `L0..L4` is the vocabulary of `--level` and of the ceiling table in
 * `docs/04-operations.md`, and it stays there because a flag needs a short
 * spelling. A person choosing what an install should write does not: the screen
 * used to say "L2 - server, rules, commands" and "claude: up to L2", which asks
 * the reader to hold a table in their head to answer a question about their own
 * machine.
 *
 * The single code left is the one line that names the flag, and that line exists
 * for the reader who wants to script the same install.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { depthItems } from "../_items-depth.js";

const RUNG = /L[0-4]/u;

test("no row label or note carries a rung code", () => {
  for (const row of depthItems(["claude", "zed"])) {
    assert.ok(!RUNG.test(row.label), `the label must be words: ${row.label}`);
    assert.ok(!RUNG.test(row.note), `the note must be words: ${row.note}`);
  }
});

test("the rows name what gets written, in order", () => {
  assert.deepEqual(
    depthItems([]).map((row) => row.label),
    ["Everything each host supports", "Server only", "Server and rules", "Server, rules and commands", "Server, rules, commands and hooks", "Everything, plus a native handler"],
  );
});

test("every host line says where that host stops, in words", () => {
  const detail = depthItems(["claude", "zed"]).find((row) => row.id === "L3").detail;
  const hosts = detail.slice(detail.indexOf("") + 1);

  assert.deepEqual(hosts, ["claude: server, rules, commands and hooks", "zed: server only"]);
});

test("the only code on the screen is the flag a scripted install would use", () => {
  const capped = depthItems(["claude"]).filter((row) => row.id !== "auto");
  const lines = capped.flatMap((row) => row.detail).filter((line) => RUNG.test(line));

  assert.equal(lines.length, capped.length, "one scripted-install line per capped row, and nothing else");

  for (const line of lines) {
    assert.match(line, /--level L[0-4]/u, `a code belongs only in the flag hint: ${line}`);
  }
});

test("the default row sets no cap and says so", () => {
  const auto = depthItems(["claude"]).find((row) => row.id === "auto");

  assert.equal(auto.note, "no cap");
  assert.match(auto.detail[0], /no cap/iu);
});
