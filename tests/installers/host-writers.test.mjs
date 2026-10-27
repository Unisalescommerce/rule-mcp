/**
 * @module test/installers/host-writers
 *
 * Phase 2 contract: the installer and uninstaller maps are lookups on the
 * host record, not a second table of the same 23 names. A host that gains an
 * install function without landing on the record (or the reverse) fails here.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import { allAgents, installers, uninstallers } from "../../src/cli/installers/index.js";
import { catalogHosts, hostRecord } from "../../src/cli/installers/hosts/index.js";

test("installers and uninstallers cover exactly the catalog hosts", () => {
  assert.deepEqual([...catalogHosts()].sort(), [...allAgents].sort());
  assert.deepEqual(Object.keys(installers).sort(), [...allAgents].sort());
  assert.deepEqual(Object.keys(uninstallers).sort(), [...allAgents].sort());
});

test("installers[id] is hostRecord(id).install for every catalog host", () => {
  for (const id of allAgents) {
    const record = hostRecord(id);

    assert.ok(record, `${id}: no record`);
    assert.equal(typeof record.install, "function", `${id}: record.install missing`);
    assert.equal(installers[id], record.install, `${id}: installers map is not the record lookup`);
  }
});

test("uninstallers[id] is hostRecord(id).uninstall for every catalog host", () => {
  for (const id of allAgents) {
    const record = hostRecord(id);

    assert.ok(record, `${id}: no record`);
    assert.equal(typeof record.uninstall, "function", `${id}: record.uninstall missing`);
    assert.equal(uninstallers[id], record.uninstall, `${id}: uninstallers map is not the record lookup`);
  }
});
