/**
 * The plain adapter answers the wizard's port with prompts, so a Node 24 host
 * asks the same questions as the full-screen renderer.
 *
 * The prompt functions are injected: no test needs a terminal, and what the
 * step asks is exactly what these assertions read.
 */
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { CANCEL_SYMBOL } from "@clack/prompts";

import { createPlainScreen } from "../_screen-plain.js";
import { GLYPHS } from "../_theme.js";
import { BACK, CANCEL } from "../opentui/_answers.js";

/** Prompt stand-ins that record the question and answer in order. */
function fakePrompts(answers) {
  const asked = [];
  const record = (kind) => (spec) => {
    asked.push({ kind, spec });

    return Promise.resolve(answers.shift());
  };

  return { asked, select: record("select"), multiselect: record("multiselect"), text: record("text"), confirm: record("confirm") };
}

/** A screen over the fake prompts, with what it printed. */
function build(answers) {
  const prompts = fakePrompts(answers);
  const lines = [];
  const screen = createPlainScreen({ prompts, out: (line) => lines.push(line), steps: ["Preflight", "Profile"] });

  return { prompts, lines, screen };
}

const items = [
  { id: "head", label: "Header", section: true },
  { id: "standard", label: "Standard", note: "5 dimensions" },
  { id: "custom", label: "Custom" },
  { id: "hooks", label: "Hooks", disabled: true },
];

test("a radio step becomes a select with the enabled rows and a back row", async () => {
  const { prompts, screen, lines } = build(["standard"]);

  screen.setStep(1);

  const answer = await screen.ask({ title: "Which profile?", help: ["Pick one."], items, mode: "radio", initial: ["standard"] });

  assert.equal(answer, "standard");
  const [question] = prompts.asked;

  assert.equal(question.kind, "select");
  assert.deepEqual(
    question.spec.options.map((option) => option.value),
    ["standard", "custom", "__back"],
    "the section header and the disabled row are not offered",
  );
  assert.equal(question.spec.initialValue, "standard");
  assert.match(lines.join("\n"), /Profile - Which profile\?/u, "the step label heads the question");
});

test("choosing the back row answers with the wizard's back", async () => {
  const { prompts, screen } = build([undefined]);

  prompts.select = (spec) => {
    prompts.asked.push({ kind: "select", spec });

    return Promise.resolve(spec.options.at(-1).value);
  };

  assert.equal(await screen.ask({ title: "Which profile?", items, mode: "radio" }), BACK);
});

test("a check step becomes a multiselect and keeps the initial answer", async () => {
  const { prompts, screen } = build([["custom"]]);
  const answer = await screen.ask({ title: "Which dimensions?", items, mode: "check", initial: ["standard"] });

  assert.deepEqual(answer, ["custom"]);
  assert.equal(prompts.asked[0].kind, "multiselect");
  assert.deepEqual(prompts.asked[0].spec.initialValues, ["standard"]);

  // The same row steps back when it comes back inside a checked answer.
  const back = build([]);

  back.prompts.multiselect = (spec) => Promise.resolve([spec.options.at(-1).value]);
  assert.equal(await back.screen.ask({ title: "Which dimensions?", items, mode: "check" }), BACK);
});

test("a cancelled prompt is the wizard's cancel", async () => {
  const { screen } = build([CANCEL_SYMBOL]);

  assert.equal(await screen.ask({ title: "Which profile?", items, mode: "radio" }), CANCEL);
});

test("a path prompt refuses a folder that does not exist and accepts one that does", async () => {
  const { prompts, screen } = build([tmpdir()]);

  await screen.askPath({ title: "Project root", help: ["Absolute or relative."] });
  const validate = prompts.asked[0].spec.validate;

  assert.equal(validate(join(tmpdir(), "not-a-folder-rule-mcp")), "That is not a folder.");
  assert.equal(validate(tmpdir()), undefined);
});

test("one action is a confirmation, several are a choice", async () => {
  const single = build([true]);

  assert.equal(await single.screen.confirm({ title: "Review", lines: [{ text: "ok 3" }], actions: [{ key: "return", label: "run it", value: "run" }] }), "run");
  assert.match(single.lines.join("\n"), /ok 3/u, "the lines are printed");

  const refused = build([false]);

  assert.equal(await refused.screen.confirm({ title: "Review", actions: [{ key: "return", label: "run it", value: "run" }] }), CANCEL);

  const many = build(["dry"]);

  assert.equal(
    await many.screen.confirm({
      title: "Review",
      actions: [
        { key: "d", label: "toggle dry run", value: "dry" },
        { key: "return", label: "run it", value: "run" },
      ],
    }),
    "dry",
  );
  assert.equal(many.prompts.asked[0].kind, "select");
});

test("progress prints a row once and never the spinner", () => {
  const { screen, lines } = build([]);
  const rows = [
    { text: `${GLYPHS.spinner[0]} Runtime home`, tone: "info" },
    { text: "[ok] Global shim - ready", tone: "ok" },
  ];

  screen.progress({ title: "Install", rows });
  screen.progress({ title: "Install", rows: [{ text: "[ok] Global shim - ready", tone: "ok" }] });

  const text = lines.join("\n");

  assert.equal(text.match(/Global shim - ready/gu)?.length, 1, "a finished row is printed once");
  assert.equal(text.includes(`Runtime home`), false, "a row in progress is not printed");
});
