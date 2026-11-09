# Pending: A project chooses its guardrails in .rule-mcp/config.json

- **Date**: 2026-11-09
- **Status**: accepted
- **Tags**: guardrails, configuration, project-scope
- **Author**: ftUNS <francesco.triozzi@unisales.eu>

## Context

Every check runs the 67 rules of the ten baseline skills on top of the skill it names. Those rules carry house style choices: zero CSS classes, JSDoc on every function, exact versions, no em dashes, PascalCase barrels. A project on Tailwind and a design system fails almost every file on them. The only way out today is to fork the catalog, or to override each baseline skill in the project layer.

## Decision

A project writes .rule-mcp/config.json at its root with a guardrails section. baseline is full (the default) or minimal: minimal stops the baseline skills riding on a check of another skill, and a check still runs the skill it names and what that skill inherits. disable is a list of rule ids that no check runs. installSkillGuardrails reads the file from the project root beside the skill layers and hands it to the registry, and getGuardrails applies it, so the tool, the worker thread and the CLI see the same answer. No file is the default, and the default is the behavior before this record. A value the reader does not know is reported and read as the default, so a typo never turns rules off.

## Consequences

Existing users see no change. A project can drop single rules or the whole baseline without a fork. One file per project answers which rules run. A disabled rule is invisible to every caller in that project, the agent included, so the file is a reviewed project decision and not a per-session switch. The guard hooks check with whatever rules their own process loaded, which this record does not change.

## What would end this

Projects need a different rule set per directory, or the baseline is split so that the style rules are opt-in by default.

## Alternatives Considered

1. A disable list in the project SKILL.md: it ties a project-wide choice to one skill, and the layers replace a skill wholesale, so two skills could disagree.
1. An environment variable: it changes per shell and per CI job, while the rule set is a property of the repository.
1. An empty copy of each baseline skill in the project layer: it works today, and it hides ten skills from search and routing.
