/**
 * The renderer's experimental FFI notice stays off stderr; every other warning
 * still reaches it.
 *
 * The notice comes from OpenTUI's native core, and it lands after the
 * alternate screen closes, where a user reads it as a failed install.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { isRendererFfiNotice, quietRendererWarnings } from "../_warnings.js";

/** A process stand-in that records what a warning handler does. */
function fakeProcess() {
  const handlers = [];
  const written = [];

  return {
    pid: 1,
    handlers,
    written,
    stderr: { write: (text) => written.push(text) },
    listeners: () => [],
    removeAllListeners: () => handlers.splice(0),
    on: (_event, handler) => handlers.push(handler),
  };
}

test("the FFI notice is recognized, and other warnings are not", () => {
  assert.equal(isRendererFfiNotice({ name: "ExperimentalWarning", message: "FFI is an experimental feature and might change at any time" }), true);
  assert.equal(isRendererFfiNotice({ name: "ExperimentalWarning", message: "node:ffi is experimental" }), true);
  assert.equal(isRendererFfiNotice({ name: "DeprecationWarning", message: "the FFI module is gone" }), false);
  assert.equal(isRendererFfiNotice({ name: "ExperimentalWarning", message: "Type Stripping is experimental" }), false);
  assert.equal(isRendererFfiNotice(), false);
});

test("the filter drops the FFI notice and prints the rest", () => {
  const proc = fakeProcess();

  quietRendererWarnings(proc);
  proc.handlers[0]({ name: "ExperimentalWarning", message: "FFI is an experimental feature" });
  assert.deepEqual(proc.written, [], "the renderer's notice writes nothing");

  proc.handlers[0]({ name: "DeprecationWarning", message: "a deprecation" });
  assert.match(proc.written.join(""), /DeprecationWarning: a deprecation/u, "every other warning still lands");
});

test("a listener already installed still receives the warnings it would have", () => {
  const proc = fakeProcess();
  const seen = [];

  proc.listeners = () => [(warning) => seen.push(warning.message)];
  quietRendererWarnings(proc);
  proc.handlers[0]({ name: "ExperimentalWarning", message: "FFI is experimental" });
  proc.handlers[0]({ name: "DeprecationWarning", message: "kept" });

  assert.deepEqual(seen, ["kept"], "the FFI notice is dropped, the rest is forwarded");
  assert.deepEqual(proc.written, [], "the forwarding listener owns the output");
});

test("a child process prints no FFI notice once the filter is installed", () => {
  const module = fileURLToPath(new URL("../_warnings.js", import.meta.url));
  const script = [
    `const { quietRendererWarnings } = await import(${JSON.stringify(module)});`,
    "quietRendererWarnings();",
    'process.emitWarning("FFI is an experimental feature and might change at any time", "ExperimentalWarning");',
    'process.emitWarning("a real deprecation", "DeprecationWarning");',
  ].join("\n");
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });

  assert.equal(run.status, 0, run.stderr);
  assert.doesNotMatch(run.stderr, /FFI is an experimental feature/u, "the notice is gone");
  assert.match(run.stderr, /a real deprecation/u, "the other warning survives");
});
