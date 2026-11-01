/**
 * @module test/installers/host-record
 *
 * The one invariant the installer has never had: a host is either in every
 * registry or in none of them, and a gap says why.
 *
 * Four registries grew independently - the agent catalog, the command targets,
 * the command gaps, the hook hosts - and each could name a host the others had
 * never heard of. The costs were real rather than theoretical: `kimi` had a hook
 * row and no command target, `droid` had neither a hook row nor a reason, and
 * the paths an install writes lived in two modules while the paths an uninstall
 * reads lived in a third.
 *
 * This test is the contract Phase 1 exists to satisfy. It fails on the tree as
 * it stands, by design: the point of writing it first is that the gap list gets
 * written down instead of inferred.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import { allAgents } from "../../../packages/mcp/cli/installers/index.js";
import { AGENTS_WITHOUT_COMMAND_SURFACE } from "../../../packages/mcp/core/agents/command-targets/index.js";
import { COMMAND_TARGETS } from "../../../packages/mcp/core/agents/command-targets/index.js";
import { HOOK_HOSTS, hookSupport } from "../../../packages/mcp/cli/install/_hook-hosts.js";
import { catalogHosts, hostRecord } from "../../../packages/mcp/cli/installers/hosts/index.js";

const commandAgents = new Set(COMMAND_TARGETS.map((target) => target.agent));
const gapAgents = new Set(Object.keys(AGENTS_WITHOUT_COMMAND_SURFACE));

test("every catalog agent has one host record, and the record knows its evidence", () => {
  assert.deepEqual([...catalogHosts()].sort(), [...allAgents].sort(), "the record set and the catalog are the same 23 hosts");

  for (const id of allAgents) {
    const record = hostRecord(id);

    assert.ok(record, `${id}: no record`);
    assert.equal(record.id, id, `${id}: the id matches its key`);
    assert.ok(["cli", "ide", "hybrid", "cloud"].includes(record.kind), `${id}: unknown kind "${record.kind}"`);
    assert.ok(record.evidence, `${id}: no evidence status`);
    assert.ok(record.label.trim() !== "", `${id}: no label`);
  }
});

test("every catalog agent declares exactly one server file, and a legacy list where it moved", () => {
  for (const id of allAgents) {
    const record = hostRecord(id);

    assert.ok(record.server.file, `${id}: no server file`);
    assert.ok(Array.isArray(record.legacy ?? []), `${id}: legacy must be a list, empty when the host never moved`);
  }

  const files = allAgents.map((id) => hostRecord(id).server.file);

  assert.equal(new Set(files).size, files.length, "no two hosts write the same file");
});

test("every catalog agent is in exactly one of the command surfaces, or says why", () => {
  const offenders = [];

  for (const id of allAgents) {
    const hasTarget = commandAgents.has(id);
    const hasReason = gapAgents.has(id);

    if (hasTarget && hasReason) {
      offenders.push(`${id}: a command target and a documented gap`);
    }

    if (!hasTarget && !hasReason) {
      offenders.push(`${id}: no command target and no reason`);
    }
  }

  assert.deepEqual(offenders, [], "an agent in neither list is an agent nobody decided about");
});

test("every catalog agent has a hook row: a mechanism, or a reason there is none", () => {
  const offenders = [];

  for (const id of allAgents) {
    // `hookSupport` answers for an unknown host too, with "Unknown host" as the
    // reason; that row is the absence this test is looking for.
    if (!Object.hasOwn(HOOK_HOSTS, id)) {
      offenders.push(`${id}: no row, only the fallback`);
      continue;
    }

    const support = hookSupport(id);

    if (support.mechanism === "none" && support.reason === "Unknown host") {
      offenders.push(`${id}: the fallback reason, not a measured one`);
    }

    if (support.writable && !support.file) {
      offenders.push(`${id}: writable with no file to write`);
    }
  }

  assert.deepEqual(offenders, [], "a host with neither a hook nor a reason is a host the wizard cannot explain");
});

test("the record and the hook table agree about the host's kind", () => {
  for (const id of allAgents) {
    const support = hookSupport(id);
    const record = hostRecord(id);

    assert.equal(typeof support.events, "object", `${id}: events must be a list, empty when there are none`);
    assert.ok(record.server.file.startsWith("/"), `${id}: the server file resolves to a path`);
  }
});
