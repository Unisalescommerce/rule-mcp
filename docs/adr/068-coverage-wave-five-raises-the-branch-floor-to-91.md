# 068: Coverage wave five raises the branch floor to 91

- **Date**: 2026-09-09
- **Status**: accepted
- **Tags**: testing, coverage, ci
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

execution plan's last open step is branch ratchet: 90 measured, 95 target. named remainder was platform-locked daemon arms, dead domain ternaries and long tail of 2-4 branch chips. compression and startup work of previous session also added modules, and new module lands in denominator uncovered.

## Decision

Cover three biggest clusters that are not platform-locked and raise floor to measured integer. generateMultiFile had 2 of 12 branches visited, rule:// reader 15 of 26, and command-target context none of its injection arms despite existing to be injectable. compression pipeline's own refusals - non-string, JSON body, level off, unknown level - and catalog's local-path gate close rest. daemon platform arms stay uncovered on purpose: reaching linux arm from darwin box needs module mocking, which measures mock rather than code, and ubuntu CI run already walks that half.

## Consequences

91.17 percent branches (6375/6992), floor raised 90 to 91 with 12 branches of margin. Two real defects surfaced and were fixed: rule-meta rename had dropped Astro out of rule-frontend prefix so detectFrameworkSkill returned no domain and router stopped applying its framework bias; and generateMultiFile read file template's string vanilla field as component, emitting custom element wrapping empty template. domain ternary chain became prefix table, which also deletes three arms FRAMEWORK_SKILL_MAP can never reach. Risk: 12 branches of margin is thinner than wave four's, and platform arms swing between darwin dev box and ubuntu CI runner, so red coverage job means re-measuring on CI rather than assuming regression.

## What would end this

The assumption this leans on, and the observation that would make it wrong.
