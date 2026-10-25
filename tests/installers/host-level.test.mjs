/**
 * @module test/installers/host-level
 *
 * The level ladder is a cap, and the cap has to be answerable: which rungs a host
 * supports, which it does not, and the reason for each one it does not.
 *
 * The unit side is checked against the record; the CLI side against the real
 * command, because the refusal is only worth anything if the install stops.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { allAgents } from "../../src/cli/installers/index.js";
import { hostRecord, levelSupport } from "../../src/cli/installers/hosts/index.js";

const ALIAS_HOOK = fileURLToPath(new URL("../../scripts/alias-hook.mjs", import.meta.url));
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const install = (args) =>
  execFileSync(process.execPath, ["--import", ALIAS_HOOK, "bin/rule-mcp.js", "install", ...args], {
    cwd: ROOT,
    env: { ...process.env, HOME: "/tmp/rule-mcp-level-test" },
    encoding: "utf8",
    stdio: "pipe",
  });

test("every rung of every host says whether it is supported, and why not", () => {
  for (const id of allAgents) {
    const record = hostRecord(id);

    for (const rung of ["L0", "L1", "L2", "L3", "L4"]) {
      const support = record.levels[rung];

      assert.equal(typeof support.supported, "boolean", `${id} ${rung}: no supported flag`);

      if (!support.supported) {
        assert.ok(support.reason?.trim(), `${id} ${rung}: unsupported with no reason`);
      }
    }

    assert.equal(record.levels.L0.supported, true, `${id}: every host reads an MCP entry`);
  }
});

test("the ceiling is the highest supported rung, not a guess", () => {
  for (const id of allAgents) {
    const { levels, ceiling } = hostRecord(id);
    const highest = ["L0", "L1", "L2", "L3", "L4"].filter((rung) => levels[rung].supported).at(-1);

    assert.equal(ceiling, highest, `${id}: ceiling ${ceiling} but ${highest} is the highest supported rung`);
  }
});

test("a named host above its ceiling is refused, with the rungs it cannot reach", () => {
  const zed = levelSupport("zed", "L2");

  assert.equal(zed.allowed, false, "Zed stores its prompts in profile storage, so L2 is not reachable");
  assert.equal(zed.ceiling, "L0", "and the ceiling says so");
  assert.ok(
    zed.missing.some((gap) => gap.rung === "L2" && gap.reason),
    "the gap names its rung and its reason",
  );

  assert.equal(levelSupport("kiro", "L3").allowed, true, "Kiro writes hooks, so L3 is inside its ceiling");
  assert.deepEqual(
    levelSupport("kiro", "L3").missing.map((gap) => gap.rung),
    ["L1", "L2"],
    "and reports the rungs it skips",
  );
  assert.equal(levelSupport("nope", "L0"), null, "an unknown host answers null");
  assert.equal(levelSupport("pi", "L9"), null, "a level outside L0..L4 answers null");
});

test("the install command refuses a level a host cannot reach, and the exit code says so", () => {
  let failure;

  try {
    install(["--agent", "zed", "--level", "L2", "--dry-run", "--no-wizard"]);
  } catch (error) {
    failure = error;
  }

  assert.ok(failure, "the install must not succeed");
  assert.equal(failure.status, 1, "a refused install exits non-zero");
  assert.match(String(failure.stderr), /zed reaches L0, not L2/u, "the message names the host, its ceiling and the ask");
  assert.match(String(failure.stderr), /L2: Zed stores/u, "and the reason for the rung it cannot reach");
});

test("a level inside the ceiling installs, and a level at or above L3 is what enables hooks", () => {
  const output = install(["--agent", "kiro", "--level", "L3", "--dry-run", "--no-wizard"]);

  assert.match(output, /rule-mcp install/u, "the install runs");
  assert.equal(levelSupport("zed", "L0").allowed, true, "L0 is always inside a ceiling");
});
