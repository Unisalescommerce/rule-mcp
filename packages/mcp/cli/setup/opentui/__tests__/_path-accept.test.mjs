/**
@module test/setup/path-accept

What Enter means in the path field: a folder is accepted, anything else is
refused with the reason and with the rows that come close. The field must not let
a plan write into a directory that does not exist.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { acceptPath, defaultIsDirectory } from "../_path-accept.js";

const root = mkdtempSync(join(tmpdir(), "rule-path-accept-"));

mkdirSync(join(root, "alpha"));
writeFileSync(join(root, "afile.txt"), "x");

test.after(() => rmSync(root, { recursive: true, force: true }));

test("a folder is accepted, resolved against the working directory", () => {
  assert.deepEqual(acceptPath({ text: "./alpha", cwd: root, isDirectory: defaultIsDirectory }), { accepted: true, value: join(root, "alpha") });
});

test("a file is refused and told what it is not", () => {
  const result = acceptPath({ text: "./afile.txt", cwd: root, isDirectory: defaultIsDirectory });

  assert.equal(result.accepted, false);
  assert.equal(result.message, `Not a folder: ${join(root, "afile.txt")}`);
});

test("a refusal quotes the rows that come close and opens the menu", () => {
  const result = acceptPath({ text: "./al", cwd: root, isDirectory: defaultIsDirectory });

  assert.equal(result.accepted, false);
  assert.equal(result.open, true, "the menu opens so the next Tab has something to apply");
  assert.equal(result.message.includes("./alpha/"), true);
});

test("an empty field is refused without a suggestion", () => {
  const result = acceptPath({ text: "   ", cwd: root, isDirectory: defaultIsDirectory });

  assert.equal(result.accepted, false);
  assert.equal(result.open, false);
});

test("a caller may supply the rows it already computed", () => {
  const result = acceptPath({ text: "./nope", cwd: root, isDirectory: () => false, suggestions: [{ name: "alpha", value: "./alpha/" }] });

  assert.equal(result.open, true);
  assert.equal(result.message.includes("./alpha/"), true);
});

test("defaultIsDirectory answers for a folder and for a file", () => {
  assert.equal(defaultIsDirectory(join(root, "alpha")), true);
  assert.equal(defaultIsDirectory(join(root, "afile.txt")), false);
  assert.equal(defaultIsDirectory(join(root, "missing")), false);
});
