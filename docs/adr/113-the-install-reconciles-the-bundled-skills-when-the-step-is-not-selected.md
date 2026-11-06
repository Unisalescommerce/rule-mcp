# 113: The install reconciles the bundled skills when the step is not selected

- **Date**: 2026-09-23
- **Status**: accepted
- **Tags**: installer, skills, commands
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

install offers one opt-in step, Bundled rule-mcp-* skills, that copies catalog to ~/.agents/skills and ~/.claude/skills for hosts that read skills from disk (pi, Claude). DEFAULT_EXTRAS excludes it, so default install writes no skills. What it also did was remove nothing: machine that had skills from earlier run kept them, and hosts kept discovering /skill:rule-mcp-* user did not ask for. Separately, uninstall skillsRemovalTask called `rule-mcp skills uninstall --dry-run`, action CLI never implemented, so removal path failed silently in every flow. catalog was installed by one step and owned by no step.

## Decision

1. skills uninstall is real CLI action, with --scope and --dry-run, that removes only names installer owns: catalog skills plus generated persona skills. It targets ~/.agents/skills, ~/.claude/skills and legacy ~/.claude, and never name user wrote by hand. 2. install plan always carries exactly one skills row: skillsTask when step is selected, skillsRemovalTask when it is not, so declining step means absent rather than leave whatever earlier install copied. 3. plan keeps building without touching filesystem: reconcile is task like any other and states what it would remove in review screen.

## Consequences

skills choice becomes two-way, which is what checkbox already promised. fresh machine reports nothing to remove; machine with copied skills loses them when step is declined. uninstall path now works instead of warning. Cost: user who installed skills deliberately and later re-runs install without selecting step loses them, so review screen names row rather than removing silently. catalog names are ownership list, so user directory is never swept.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Leave install read-only and rely on explicit skills uninstall (rejected: reported symptom is exactly that install choice was not honored).
1. Pre-select step when copied skills are detected (rejected: it asks user to keep something they may have declined, and still leaves files when they do not confirm).
1. Wipe whole skills directory on uninstall (rejected: it would delete skills user wrote, which installer does not own).
