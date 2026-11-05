/**
WS1-T2.1: the patch comes from git, with the flags that keep a repository's
own configuration out of it.

`--no-ext-diff` and `--no-textconv` are the pair that stop git from running a
helper the repository selects, so a patch is data and never a program the
repository chose to run. The fixed prefixes and `--no-color` keep the paths
readable under the settings a repository may set.
*/
import { strict as assert } from "node:assert";
import test from "node:test";

import { scanRange, scanStaged, stagedPatch } from "@mcp/core/secrets/index.js";

const DOCUMENT = { schema_version: "1", findings: [{ rule_id: "github-pat", location: { path: "config.js", start_line: 2 } }] };

test("the staged patch keeps git from running helpers the repo configures", () => {
  const calls = [];
  const exec = (command, args, options) => {
    calls.push({ command, args, options });

    return "diff --git a/x b/x\n";
  };
  const result = stagedPatch({ exec });

  assert.equal(result.patch, "diff --git a/x b/x\n");
  assert.equal(calls[0].command, "git");

  for (const flag of ["--cached", "--no-ext-diff", "--no-textconv", "--no-color"]) {
    assert.ok(calls[0].args.includes(flag), `${flag} is what keeps a repository's diff config out of the patch`);
  }
});

test("a git that fails is a reason, not a clean patch", () => {
  const exec = () => {
    const error = new Error("Command failed: git diff --cached");

    error.stderr = "fatal: not a git repository\n";
    throw error;
  };
  const result = stagedPatch({ exec });

  assert.equal(result.patch, "");
  assert.match(result.reason, /not a git repository/);
});

test("the composed scan runs git and then the binary", () => {
  const seen = [];
  const exec = (command) => {
    seen.push(command);

    return command === "git" ? "diff --git a/x b/x\n" : JSON.stringify(DOCUMENT);
  };
  const result = scanStaged({ exec });

  assert.deepEqual(seen, ["git", "betterleaks"]);
  assert.equal(result.scanned, true);
  assert.equal(result.findings.length, 1);
});

test("a range scan diffs the range with the same flags", () => {
  const calls = [];
  const exec = (command, args) => {
    calls.push(args);

    return command === "git" ? "diff --git a/x b/x\n" : JSON.stringify(DOCUMENT);
  };
  const result = scanRange("origin/main..HEAD", { exec });

  assert.ok(calls[0].includes("origin/main..HEAD"));
  assert.ok(calls[0].includes("--no-ext-diff"));
  assert.equal(result.findings.length, 1);
});

test("a git directory is passed through to the diff", () => {
  const calls = [];
  const exec = (command, args, options) => {
    calls.push({ command, options });

    return "diff --git a/x b/x\n";
  };

  stagedPatch({ exec, cwd: "/tmp/other" });
  assert.equal(calls[0].options.cwd, "/tmp/other");
});
