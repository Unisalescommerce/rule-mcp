/**
 * @module test/docs/integration-levels
 *
 * The ceiling table in `docs/04-operations.md` is data the installer already
 * knows, so it is recomputed here rather than trusted.
 *
 * A hand-written table of 23 hosts drifts the first time a hook row or a command
 * target changes, and the drift is invisible: the reader has no way to tell a
 * stale ceiling from a measured one. This test closes the gap the census cannot,
 * because the census reads the tool surface and this reads the host records.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { allAgents } from "../../src/cli/installers/index.js";
import { hostRecord } from "../../src/cli/installers/hosts/index.js";

const DOC = fileURLToPath(new URL("../../docs/04-operations.md", import.meta.url));

/** The rows between the markers, as `{ host: [ceiling, ...] }`. */
function documentedRows() {
  const body = readFileSync(DOC, "utf8").split("<!-- levels:start -->")[1]?.split("<!-- levels:end -->")[0] ?? "";
  const rows = new Map();

  for (const line of body.split("\n")) {
    const cells = line.split("|").map((cell) => cell.trim());
    const host = cells[1]?.replaceAll("`", "");

    if (!host || host === "Host" || host.startsWith("-")) {
      continue;
    }

    rows.set(host, cells.slice(2, 7));
  }

  return rows;
}

const yes = (flag) => (flag ? "yes" : "-");

test("the documented ceiling table lists every catalog host and nothing else", () => {
  const documented = [...documentedRows().keys()].sort();

  assert.deepEqual(documented, [...allAgents].sort(), "a host in the table and not in the catalog, or the other way round");
});

test("every documented rung matches the record it claims to describe", () => {
  const offenders = [];

  for (const [host, [ceiling, rules, commands, hooks, handler]] of documentedRows()) {
    const record = hostRecord(host);
    const expected = [
      record.ceiling,
      yes(record.levels.L1.supported),
      yes(record.levels.L2.supported),
      yes(record.levels.L3.supported),
      record.levels.L4.supported ? (record.levels.L4.status ?? "yes") : "-",
    ];

    if (JSON.stringify([ceiling, rules, commands, hooks, handler]) !== JSON.stringify(expected)) {
      offenders.push(`${host}: documented ${JSON.stringify([ceiling, rules, commands, hooks, handler])}, record says ${JSON.stringify(expected)}`);
    }
  }

  assert.deepEqual(offenders, [], "regenerate the table from hostRecord() rather than editing a cell");
});

test("the four levels the table cannot show are the ones with prose instead", () => {
  const text = readFileSync(DOC, "utf8");

  assert.match(text, /install --agent <id> --level <Lx>/u, "the flag is documented where the levels are");
  assert.match(text, /`cursor-cli` is covered by `cursor`/u, "a covered product says so");
  assert.match(text, /no documented MCP config file/u, "and the seven with no file are named");
});
