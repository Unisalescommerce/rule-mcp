/** The shape gate: Markdown checkboxes and a link to a reference file are mandatory. */
import { strict as assert } from "node:assert";
import { rmSync } from "node:fs";
import { test } from "node:test";

import { writeDevelopmentPlan } from "../_write.js";
import { seed } from "./_write.fixture.mjs";

/** A body that satisfies everything except the fields a case drops. */
const base = [
  "# Plan: no links",
  "",
  "Status: `planned`",
  "",
  "## Dependency graph",
  "",
  "```",
  "WS1",
  "```",
  "",
  "Depends on: -",
  "",
  "Feeds: -",
  "",
  "Shared files: -",
  "",
  "### WS1 - One",
  "",
];

test("a plan without a Markdown link or a checkbox task is refused, and the reason is named", () => {
  const dir = seed();

  const noLink = writeDevelopmentPlan({ projectDir: dir, slug: "no-link", title: "no link", body: [...base, "- [ ] **WS1-T1**: a task"].join("\n") });

  assert.equal(noLink.ok, false, "a plan with no reference link is refused");
  assert.match(noLink.error, /reference file/, "the refusal names the missing link");

  const noBox = writeDevelopmentPlan({
    projectDir: dir,
    slug: "no-box",
    title: "no box",
    body: [...base, "- [plan-of-plans](plan-of-plans.md)", "", "**WS1-T1**: a task"].join("\n"),
  });

  assert.equal(noBox.ok, false, "a plan whose work is not a checkbox is refused");
  assert.match(noBox.error, /checkbox/, "the refusal names the checkbox");

  rmSync(dir, { recursive: true, force: true });
});
