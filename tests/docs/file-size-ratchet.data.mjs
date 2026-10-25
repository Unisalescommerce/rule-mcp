/**
 * File-size ratchet: every file that exceeded the 150-line cap when the
 * budget test landed, with the line count it had then. A file may only
 * shrink: going over its recorded size fails the build, and dropping to
 * 150 or less means its entry must be deleted. An entry is added only as the
 * adoption baseline for a root the cap has just reached, recorded in the ADR
 * that added it - ADR 112 did this for skills/, ADR 186 for the roots below.
 * Data file: exempt from the size cap itself.
 *
 * The 40 entries are the debt the cap found, not a target: every one may only
 * shrink, and each split that lands deletes its row.
 */

export const FILE_SIZE_RATCHET = new Map([
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/core.test.js", 151],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/directives.test.js", 229],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/expression-parser.test.js", 383],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/filters.test.js", 575],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/inheritance.test.js", 261],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/renderer.test.js", 283],
  ["src/cli/__tests__/_register-handoff-branches.test.mjs", 157],
  ["src/cli/_init.js", 165],
  ["src/cli/_register-setup.js", 166],
  ["src/cli/commands/__tests__/_targets-sync.test.mjs", 166],
  ["src/cli/install/_agent-ops.js", 168],
  ["src/cli/install/_hook-files.js", 223],
  ["src/cli/install/_hook-writers.js", 222],
  ["src/cli/install/_manifest.js", 153],
  ["src/cli/setup/__tests__/_setup-index-branches.test.mjs", 219],
  ["src/cli/setup/__tests__/_task-core-branches.test.mjs", 159],
  ["src/cli/setup/__tests__/_task-extras-branches.test.mjs", 153],
  ["src/cli/setup/_options.js", 163],
  ["src/cli/setup/_task-extras.js", 161],
  ["src/cli/setup/index.js", 152],
  ["src/cli/setup/opentui/__tests__/_items.test.mjs", 209],
  ["src/cli/setup/opentui/__tests__/_wizard.test.mjs", 213],
  ["src/cli/setup/opentui/_items.js", 451],
  ["src/cli/setup/opentui/_screen.js", 461],
  ["src/cli/setup/opentui/_wizard.js", 555],
  ["src/core/__tests__/_prompt-directive.test.mjs", 152],
  ["src/core/decision/__tests__/_lifecycle-branches.test.mjs", 188],
  ["src/core/guardrails/project/_checks.js", 182],
  ["src/core/self-update/_run.js", 202],
  ["src/tools/actions/__tests__/_stats-extra-branches-ledger.test.mjs", 164],
  ["tests/fixtures/guardrail-corpus.mjs", 1933],
  ["tests/fixtures/routing-corpus.mjs", 216],
  ["tests/plans/skills-plan.test.mjs", 346],
]);
