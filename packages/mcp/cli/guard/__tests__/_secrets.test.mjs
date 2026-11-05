/**
WS1-T3: a commit is asked about credentials, not only about guardrails.

The guardrail collector reads the extensions it knows how to check, so a
`.env`, a workflow file and a Dockerfile never reach it. The secret collector
reads the patch instead, and that is what closes the hole: it sees every
staged file whatever its name.

Three answers, and the difference between the last two is the policy:
findings ask, an installed binary that failed asks, and a binary that is not
installed stays silent - a hook that asks on every commit in every repository
teaches people to turn the hook off.
*/
import { strict as assert } from "node:assert";
import test from "node:test";

import { decide } from "../_decide.js";
import { secretFailures } from "../_secrets.js";

/** The reason a decision carries, or "" when it allows. */
const reason = (answer) => answer.hookSpecificOutput?.permissionDecisionReason ?? "";

/** A collector that reports nothing. */
const quiet = () => ({ installed: true, scanned: true, findings: [], reason: "" });

test("a clean commit is allowed", () => {
  const answer = decide("git commit -m 'feat(x): y'", "bash", () => [], quiet);

  assert.equal(answer.hookSpecificOutput?.permissionDecision, undefined, "nothing to ask about is not a question");
});

test("a finding asks, and names the rule and the place", () => {
  const collect = () => ({ installed: true, scanned: true, reason: "", findings: [{ ruleId: "github-pat", description: "GitHub Personal Access Token", path: ".env", line: 3 }] });
  const answer = reason(decide("git commit -m 'feat(x): y'", "bash", () => [], collect));

  assert.match(answer, /credentials/);
  assert.match(answer, /\.env:3 github-pat/);
  assert.match(answer, /GitHub Personal Access Token/);
});

test("guardrail failures and credentials arrive in one question", () => {
  const collect = () => ({ installed: true, scanned: true, reason: "", findings: [{ ruleId: "aws-access-key", description: "", path: "infra/main.tf", line: 9 }] });
  const answer = reason(decide("git commit -m 'feat(x): y'", "bash", () => [{ file: "a.ts", failures: ["no-var"] }], collect));

  assert.match(answer, /guardrails fail on the staged files/);
  assert.match(answer, /infra\/main\.tf:9 aws-access-key/);
});

test("an installed binary that failed asks with its reason", () => {
  const collect = () => ({ installed: true, scanned: false, findings: [], reason: "betterleaks exited 2" });
  const answer = reason(decide("git commit -m 'feat(x): y'", "bash", () => [], collect));

  assert.match(answer, /could not scan the staged patch/);
  assert.match(answer, /betterleaks exited 2/);
});

test("a binary that is not installed stays silent", () => {
  const collect = () => ({ installed: false, scanned: false, findings: [], reason: "betterleaks is not on PATH" });
  const answer = reason(decide("git commit -m 'feat(x): y'", "bash", () => [], collect));

  assert.equal(answer, "", "asking on every commit in every repository is how a hook gets turned off");
});

test("a command that is not a commit never scans", () => {
  let scans = 0;
  const collect = () => {
    scans += 1;

    return { installed: true, scanned: true, findings: [], reason: "" };
  };

  decide("pnpm test", "bash", () => [], collect);
  assert.equal(scans, 0);
});

test("the collector reports the probe answer when the binary cannot be used", () => {
  const absent = secretFailures({
    probe: () => ({ available: false, supported: false, reason: "betterleaks is not on PATH" }),
    scan: () => assert.fail("no scan without a binary"),
  });

  assert.deepEqual(absent, { installed: false, scanned: false, findings: [], reason: "betterleaks is not on PATH" });
});

test("the collector scans the repository named by the host", () => {
  let directory;

  secretFailures({
    cwd: "/example/repository",
    probe: () => ({ available: true, supported: true, reason: "" }),
    scan: ({ cwd }) => {
      directory = cwd;

      return { scanned: true, findings: [], reason: "" };
    },
  });
  assert.equal(directory, "/example/repository");
});

test("the collector passes a supported binary's answer through", () => {
  const found = secretFailures({
    probe: () => ({ available: true, supported: true, reason: "" }),
    scan: () => ({ scanned: true, findings: [{ ruleId: "x" }], reason: "" }),
  });

  assert.deepEqual(found, { installed: true, scanned: true, findings: [{ ruleId: "x" }], reason: "" });
});
