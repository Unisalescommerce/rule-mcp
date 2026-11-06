# 037: Migrate repo tooling to ESLint 10 flat config with eslint-plugin-unicorn

- **Date**: 2026-08-03
- **Status**: accepted
- **Tags**: eslint, toolchain, unicorn, flat-config, migration, security, brace-expansion
- **Author**: rule-mcp-architect

## Context

After adopting eslint-plugin-unicorn in skills (ADR 018), migrate repo's internal tooling: ESLint 10 removed the.eslintrc system, so.eslintrc.json must be replaced with flat config (eslint.config.mjs). repo uses eslint 9 +.eslintrc legacy, node 24, no TypeScript. brace-expansion security override in pnpm-workspace.yaml (GHSA-mh99-v99m-4gvg) was incompatible with minimatch@10 in ESLint 10 (needs brace-expansion ^5.0.8): it needs to be extended to patched lines while excluding vulnerable versions.

## Decision

Migrate repo to ESLint 10.8 flat config (eslint.config.mjs: @eslint/js + eslint-plugin-unicorn recommended + preserved repo preferences). Run autofix pass (~1300 fixes), then disable opinionated rules that fight codebase (name-replacements, import-style, text-encoding-identifier-case, no-array-sort, no-top-level-assignment-in-function, no-process-exit, no-control-regex and queue) and manually fix real issues that emerged (no-undef, no-empty, no-useless-escape, no-useless-assignment). Update brace-expansion override in pnpm-workspace.yaml to '>=1.1.17 <2 || >=2.1.3 <3 || >=3.0.3 <4 || >=5.0.8' with nested override for minimatch@>=10 (5.0.9). Update CI (without --ext), guardrail scaffold, and docs to eslint.config.mjs.

## Consequences

pnpm lint passes with 0 errors and 48 warnings (CI budget 50); code follows modern idioms (node, replaceAll, flatMap, new for builtins, ternaries, assert.ok) and 2 real bugs were fixed (${words} interpolation in completions bash template, empty catches). Opinionated rules remain documented as off and revisitable in subsequent steps. prettier gate was already red on baseline and stays that way: separate format:fix pass is follow-up. article cited no-array-for-each as recommended rule, but it was removed in unicorn 70: for...of idiom remains enforced by js-no-array-for-each guardrail.

## Alternatives Considered

1. Stay on ESLint 9 + .eslintrc (deferred: legacy system removed in ESLint 10, no upgrade path)
1. Migrate only config without autofix (lost value of autofixable rules)
1. Use unopinionated preset (equivalent to disabling same rules upfront, less transparent)
