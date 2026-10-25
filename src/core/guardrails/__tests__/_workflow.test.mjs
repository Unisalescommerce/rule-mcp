/** The workflow reader: jobs and steps, and the shapes it refuses to guess at. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { jobNamed, parseWorkflow } from "../workflow/index.js";

const TWO_SPACE = [
  "name: publish",
  "on:",
  "  push:",
  "    tags: ['v*']",
  "permissions:",
  "  contents: read",
  "env:",
  "  NODE_ENV: production",
  "jobs:",
  "  verify:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
  "      - run: pnpm test",
  "  publish:",
  "    needs: verify",
  "    permissions:",
  "      id-token: write",
  "    steps:",
  "      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683",
  "      - name: publish",
  "        run: |",
  "          pnpm build",
  "          npm publish",
  "        env:",
  "          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}",
].join("\n");

const FOUR_SPACE = [
  "on: push",
  "jobs:",
  "    release:",
  "        permissions: read-all",
  "        steps:",
  "            -",
  "                uses: actions/checkout@v4",
  "            -   run: cargo publish",
].join("\n");

test("a two-space workflow reads as jobs, permissions and steps", () => {
  const workflow = parseWorkflow(TWO_SPACE);

  assert.deepEqual(
    workflow.jobs.map((job) => job.id),
    ["verify", "publish"],
    "both jobs are found, in file order",
  );
  assert.deepEqual(workflow.permissions, ["contents: read"], "the workflow-level permissions block is read");
  assert.deepEqual(workflow.env, ["NODE_ENV: production"], "the workflow-level env block is read");
  assert.deepEqual(
    workflow.jobs[0].steps.map((step) => step.uses || step.run),
    ["actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683", "pnpm test"],
  );
});

test("a job carries its own permissions beside the workflow's", () => {
  const publish = jobNamed(parseWorkflow(TWO_SPACE), "publish");

  assert.deepEqual(publish.permissions, ["id-token: write"], "the job block wins for its own scope");
  assert.equal(publish.needs, "verify", "needs is read as text");
  assert.deepEqual(jobNamed(parseWorkflow(TWO_SPACE), "verify").permissions, [], "a job without a block has none");
  assert.equal(jobNamed(parseWorkflow(TWO_SPACE), "absent"), null, "an unknown id answers null");
});

test("a block-scalar run is its body, and the step env is beside it", () => {
  const [, publish] = parseWorkflow(TWO_SPACE).jobs;
  const step = publish.steps.at(-1);

  assert.equal(step.name, "publish", "name is read before run");
  assert.equal(step.run, "pnpm build\nnpm publish", "the block scalar is joined, not truncated at the first line");
  assert.deepEqual(step.env, ["NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}"], "the step env block is read");
  assert.deepEqual(step.withKeys, [], "a step with no with block has no keys");
  assert.deepEqual(step.with, [], "and no values either");
});

test("a with block reads as key lines, so a value can be checked", () => {
  const workflow = parseWorkflow(
    ["on: push", "jobs:", "  a:", "    steps:", "      - uses: actions/checkout@" + "0".repeat(40) + " # v4", "        with:", "          persist-credentials: false"].join("\n"),
  );

  assert.deepEqual(workflow.jobs[0].steps[0].with, ["persist-credentials: false"], "the value survives as a line");
  assert.deepEqual(workflow.jobs[0].steps[0].withKeys, ["persist-credentials"], "and its key is named");
});

test("four-space indentation reads the same as two", () => {
  const workflow = parseWorkflow(FOUR_SPACE);

  assert.deepEqual(
    workflow.jobs.map((job) => job.id),
    ["release"],
    "the job id sits at its own level",
  );
  assert.deepEqual(workflow.jobs[0].permissions, ["read-all"], "a scalar permissions line is one entry");
  assert.deepEqual(
    workflow.jobs[0].steps.map((step) => step.uses || step.run),
    ["actions/checkout@v4", "cargo publish"],
    "a bare dash and a padded dash both open a step",
  );
  assert.deepEqual(workflow.on.values, ["push"], "an inline on: is its value");
});

test("a job with no steps reads as an empty list, not as a missing job", () => {
  const workflow = parseWorkflow(["on: push", "jobs:", "  empty:", "    runs-on: ubuntu-latest"].join("\n"));

  assert.deepEqual(workflow.jobs, [{ id: "empty", permissions: [], env: [], needs: "", steps: [] }]);
});

test("a block on: keeps its triggers as text a tag rule can read", () => {
  const workflow = parseWorkflow(TWO_SPACE);

  assert.match(workflow.on.text, /tags: \['v\*'\]/u, "the nested filter survives as text");
  assert.deepEqual(workflow.on.values, ["push:"], "the trigger keys are named");
});

test("a text that is not a workflow answers null", () => {
  assert.equal(parseWorkflow('{ "name": "pkg", "version": "1.0.0" }'), null, "json is not a workflow");
  assert.equal(parseWorkflow("on: push"), null, "no jobs is not a workflow");
  assert.equal(parseWorkflow("jobs:\n  a:\n    steps: []"), null, "no on: is not a workflow");
  assert.equal(parseWorkflow(""), null, "an empty file is not a workflow");
});

test("a shape the reader does not read answers null instead of half a file", () => {
  assert.equal(parseWorkflow(TWO_SPACE.replaceAll("  ", "\t")), null, "tab indentation is refused whole");
  assert.equal(parseWorkflow("on: push\njobs: &jobs\n  a:\n    steps: []"), null, "an anchor on jobs is refused");
  assert.equal(parseWorkflow("on: push\njobs:\n  a:\n    <<: *base\n    steps: []"), null, "a merge key is refused");
});

test("comments and blank lines do not become entries", () => {
  const workflow = parseWorkflow(["# a header", "on: push", "", "jobs:", "  # the only job", "  a:", "    steps:", "      - run: echo hi  # trailing", ""].join("\n"));

  assert.deepEqual(
    workflow.jobs.map((job) => job.id),
    ["a"],
    "comment lines are skipped",
  );
  assert.equal(workflow.jobs[0].steps[0].run, "echo hi", "a trailing comment leaves the value");
});
