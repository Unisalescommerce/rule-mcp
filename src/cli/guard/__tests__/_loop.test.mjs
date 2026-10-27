/** Persistent guard loop: many NDJSON requests, one warm process. */
import { strict as assert } from "node:assert";
import { Readable } from "node:stream";
import { test } from "node:test";

import { runGuardLoop } from "../_loop.js";

test("loop answers two prompt-submit lines without re-reading a closed stdin", async () => {
  const lines = [
    JSON.stringify({ action: "prompt-submit", prompt: "one", cwd: "/tmp" }),
    JSON.stringify({ action: "prompt-submit", prompt: "two", cwd: "/tmp" }),
  ];
  const stdin = Readable.from(`${lines.join("\n")}\n`);
  const out = [];

  await runGuardLoop({
    stdin,
    write: (text) => out.push(text),
  });

  const bodies = out.join("").trim().split("\n");

  assert.equal(bodies.length, 2, "two requests produce two framed answers");

  for (const body of bodies) {
    const parsed = JSON.parse(body);

    assert.equal(parsed.hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  }
});

test("loop reports unparseable lines without exiting", async () => {
  const stdin = Readable.from("not-json\n");
  const out = [];

  await runGuardLoop({ stdin, write: (text) => out.push(text) });

  assert.match(out.join(""), /unparseable/);
});
