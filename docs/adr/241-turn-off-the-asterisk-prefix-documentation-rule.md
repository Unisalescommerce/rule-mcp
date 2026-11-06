# 241: Turn off the asterisk-prefix documentation rule

- **Date**: 2026-11-06
- **Status**: accepted
- **Tags**: lint, governance, comments
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`pnpm exec eslint bin/ packages/ scripts/__tests__/ --max-warnings 50` reports 2297 problems, and 2015 of them are `unicorn/no-asterisk-prefix-in-documentation-comments`. The rule rejects the `/** ... */` block style every file in this repository uses, including files no change touched, so it measures the convention rather than a defect.

## Decision

Set `unicorn/no-asterisk-prefix-in-documentation-comments` to `off` in `eslint.config.mjs`, with a one-line reason beside it. The other 282 findings stay as they are and are fixed on their own schedule.

## Consequences

Positive: the lint gate measures defects again instead of the comment style. Positive: no rewrite of about two thousand comment blocks. Negative: the gate is still red on 282 findings until they are worked through, and one rule of the shared configuration now differs from its default.

## What would end this

The plugin changes the rule to accept the block style, or the repository adopts a different comment convention.

## Alternatives Considered

1. Rewrite every JSDoc block in the repository
1. Leave the rule on and accept a permanently red gate
