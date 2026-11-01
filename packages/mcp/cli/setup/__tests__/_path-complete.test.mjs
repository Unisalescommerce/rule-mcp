/**
@module test/setup/path-complete

Path suggestions for the install prompt. Two rules are safety, not taste: a
credentials directory is never listed, and a suggestion only appears once the
text names a path - so the prompt cannot walk a user through `.ssh`.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expandPath, isSensitiveDir, suggestPaths } from "../_path-complete.js";

const root = mkdtempSync(join(tmpdir(), "rule-path-complete-"));

for (const name of ["alpha", "beta", ".hidden", "Bravo Folder"]) {
  mkdirSync(join(root, name));
}

writeFileSync(join(root, "afile.txt"), "x");
mkdirSync(join(root, "Icon\r"), { recursive: true });

test.after(() => rmSync(root, { recursive: true, force: true }));

const names = (text) => (suggestPaths(text, root)?.items ?? []).map((item) => item.name);

test("no slash means no suggestions", () => {
  assert.equal(suggestPaths("alpha", root), null);
});

test("a trailing slash lists every folder, dot folders included, and no file", () => {
  const listed = names("./");

  assert.deepEqual(listed, [".hidden", "alpha", "beta", "Bravo Folder"], "folders only, sorted, dots included");
  assert.equal(listed.includes("afile.txt"), false, "a file is not a folder");
  assert.equal(listed.includes("Icon\r"), false, "a name with a control character is skipped");
});

test("a partial name filters by prefix, case-insensitively, and a dot folder waits for a dot", () => {
  assert.deepEqual(names("./b"), ["beta", "Bravo Folder"], "the prefix is case-insensitive; the names keep their case");
  assert.deepEqual(names("./B"), ["beta", "Bravo Folder"], "and the case of the typed prefix changes nothing");
  assert.deepEqual(names("./."), [".hidden"], "a dot folder appears once a dot is typed");
});

test("a value ends in a slash so the next suggestion descends", () => {
  const [first] = suggestPaths("./al", root).items;

  assert.equal(first.value, "./alpha/");
});

test("a credentials directory is never listed", () => {
  assert.equal(isSensitiveDir("~/.ssh"), true);
  assert.equal(isSensitiveDir("~/.ssh/id_rsa"), true);
  assert.equal(isSensitiveDir("/etc/ssh"), true);
  assert.equal(isSensitiveDir(join(root, "alpha")), false);

  assert.deepEqual(suggestPaths("~/.ssh/", root).items, [], "and it contributes no suggestions");
});

test("a path that does not exist suggests nothing", () => {
  assert.deepEqual(suggestPaths("./nope/", root).items, []);
});

test("a tilde expands to the home directory", () => {
  assert.equal(expandPath("~"), process.env.HOME ?? expandPath("~"));
  assert.equal(expandPath("~", root).startsWith("/"), true);
  assert.equal(expandPath("alpha", root), join(root, "alpha"), "a relative path resolves against the working directory");
});
