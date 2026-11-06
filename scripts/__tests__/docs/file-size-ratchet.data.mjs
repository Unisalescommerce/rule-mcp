/**
 * File-size ratchet: every file that exceeded the 150-line cap when the
 * budget test landed, with the line count it had then. A file may only
 * shrink: going over its recorded size fails the build, and dropping to
 * 150 or less means its entry must be deleted. An entry is added only as the
 * adoption baseline for a root the cap has just reached, recorded in the ADR
 * that added it - ADR 112 did this for skills/, ADR 186 for the roots below.
 * Data file: exempt from the size cap itself.
 *
 * The 36 entries are the debt the cap found, not a target: every one may only
 * shrink, and each split that lands deletes its row.
 */

export const FILE_SIZE_RATCHET = new Map([
  ["scripts/bench/hook-spawn-spike.mjs", 210],
  ["packages/mcp/cli/_register-info.js", 156],
  ["packages/mcp/cli/install/_projects.js", 169],
  ["packages/mcp/cli/installers/_agents-ide.js", 152],
  ["packages/mcp/cli/installers/_uninstall-hosts.js", 151],
  ["packages/mcp/core/adr-policy/_resolve.js", 229],
  ["packages/mcp/core/git-hooks/_land-hooks.js", 182],
  ["packages/mcp/core/guardrails/__tests__/_false-positives.test.mjs", 158],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/core.test.js", 151],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/directives.test.js", 229],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/expression-parser.test.js", 383],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/filters.test.js", 575],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/inheritance.test.js", 261],
  ["skills/rule-frontend-template-engine/assets/template-engine/tests/renderer.test.js", 283],
  ["packages/mcp/cli/__tests__/_register-handoff-branches.test.mjs", 157],
  ["packages/mcp/cli/commands/__tests__/_targets-sync.test.mjs", 166],
  ["packages/mcp/cli/install/_hook-files.js", 223],
  ["packages/mcp/cli/install/_hook-writers.js", 206],
  ["packages/mcp/cli/setup/__tests__/_setup-index-branches.test.mjs", 219],
  ["packages/mcp/cli/setup/__tests__/_task-core-branches.test.mjs", 159],
  ["packages/mcp/cli/setup/__tests__/_task-extras-branches.test.mjs", 153],
  ["packages/mcp/cli/setup/_task-extras.js", 161],
  ["packages/mcp/cli/setup/opentui/__tests__/_items.test.mjs", 209],
  ["packages/mcp/cli/setup/opentui/_items.js", 451],
  ["packages/mcp/cli/setup/opentui/_screen.js", 461],
  ["packages/mcp/cli/setup/opentui/_wizard.js", 509],
  ["packages/mcp/core/__tests__/_prompt-directive.test.mjs", 154],
  ["packages/mcp/core/plans/_write.js", 195],
  ["packages/mcp/core/decision/__tests__/_lifecycle-branches.test.mjs", 188],
  ["packages/mcp/core/guardrails/project/_checks.js", 182],
  ["packages/mcp/core/self-update/_run.js", 202],
  ["packages/mcp/tools/actions/__tests__/_stats-extra-branches-ledger.test.mjs", 164],
  ["scripts/__tests__/fixtures/guardrail-corpus.mjs", 1933],
  ["scripts/__tests__/fixtures/routing-corpus.mjs", 216],
  ["scripts/__tests__/plans/skills-plan.test.mjs", 317],
]);
