/**
WS1-T1.1: the betterleaks probe answers without ever throwing.

The gate this probe feeds runs inside a PreToolUse hook, so the one thing it
must never do is take the hook down with it: a binary that is absent, a
launcher whose target moved and a v1 install that answers a different command
set are three different "cannot scan" answers, and all three have to come
back as data. A throw here would surface as a broken hook, which the host
reads as "allow".
*/
import { strict as assert } from "node:assert";
import test from "node:test";

import { probeBetterleaks, readVersion } from "@mcp/core/secrets/_probe.js";

/** An exec that answers the way a binary printing `output` would. */
const answering = (output) => () => output;

/** An exec that fails the way the OS does when nothing answers to the name. */
const missing = () => {
  const error = new Error("spawnSync betterleaks ENOENT");

  error.code = "ENOENT";
  throw error;
};

/** An exec that fails the way a launcher with a moved target does. */
const failing = () => {
  const error = new Error("Command failed: betterleaks --version");

  error.status = 1;
  error.stderr = "Cannot find module '/opt/homebrew/bin/betterleaks'\n";
  throw error;
};

test("a v2 release is available and supported", () => {
  const probe = readVersion({ exec: answering("2.0.0-rc.1\n") });

  assert.equal(probe.available, true);
  assert.equal(probe.version, "2.0.0-rc.1");
  assert.equal(probe.major, 2);
  assert.equal(probe.supported, true);
});

test("an unparseable build is trusted, not refused", () => {
  const probe = readVersion({ exec: answering("dev\n") });

  assert.equal(probe.available, true);
  assert.equal(probe.version, null);
  assert.equal(probe.major, null);
  assert.equal(probe.supported, true, "a source build answers the v2 command set; refusing it would refuse a contributor");
});

test("a v1 install is available and not supported", () => {
  const probe = readVersion({ exec: answering("1.6.0\n") });

  assert.equal(probe.available, true);
  assert.equal(probe.major, 1);
  assert.equal(probe.supported, false);
  assert.match(probe.reason, /v2/);
});

test("an absent binary is data, not an exception", () => {
  const probe = readVersion({ exec: missing });

  assert.equal(probe.available, false);
  assert.equal(probe.version, null);
  assert.match(probe.reason, /not on PATH/);
});

test("a binary that cannot run reports the line it failed with", () => {
  const probe = readVersion({ exec: failing });

  assert.equal(probe.available, false);
  assert.match(probe.reason, /Cannot find module/);
});

test("the probe answers once per process", () => {
  const first = probeBetterleaks();
  const second = probeBetterleaks();

  assert.equal(first, second, "the same answer object, so the hook does not spawn twice");
});

test("an injected exec bypasses the cache", () => {
  let calls = 0;
  const counted = () => {
    calls += 1;

    return "2.1.0\n";
  };

  probeBetterleaks({ exec: counted });
  probeBetterleaks({ exec: counted });

  assert.equal(calls, 2, "a test that shares a cached answer measures the cache, not the probe");
});
