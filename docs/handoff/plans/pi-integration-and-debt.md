# pi-integration-and-debt

- **Plan**: `docs/plans/_pi-integration-and-debt.md` (retired)
- **ADR**: 251 (`242-close-out-plan-pi-integration-and-debt.md`)

## Delivered

- WS1-T1: Add the query words the descriptions lack.
- WS1-T1.1: Name session, resume, close, and plan in the handoff and handon descriptions.
- WS1-T1.2: Name verify, lint, guardrail, and decision in the check and gateway descriptions.
- WS1-T2: Accept one item where a schema asks for an array.
- WS1-T2.1: Coerce gateway files when the caller sends one object.
- WS1-T2.2: Coerce ADR alternatives and tags when the caller sends one string.
- WS1-T3: Load one installed skill in pi. Done 2026-11-06: ~/.agents/skills/ holds 24 skills (rule-adr … rule-usage) and the same 24 arrive in this session's available_skills prompt block, so pi discovers and loads the installed catalog. The installer writes only name and description, which is the spec subset pi reads.
- WS1-T3.1: Record whether a custom frontmatter key raises a skill warning. Done 2026-11-06: it does not. loadSkillFromFile in pi 1.5.0 validates name and description only; a warning is raised for a read or parse failure, a bad description, a bad name, and a name collision. The skill object keeps name, description, filePath, baseDir, sourceInfo and disable-model-invocation, so tags, frameworks, inherits and guardrails are dropped silently. Probe: pi -p … --skill ./custom/SKILL.md with those four keys exited 0 with an empty stderr, and a two-skill name collision behaved the same, because -p renders no startup diagnostics. The source is the evidence; -p is not.
- WS2-T1: Carry out those three steps and mark them closed in that plan. Done 2026-11-06: the router plan carries the family contract, rule-toolchain owns five bundler rules with tests and corpus pairs, and vite, rspack and parcel declare inherits: [rule-toolchain].
- WS2-T2: Confirm the cascade no longer lists that plan as ready. Confirmed 2026-11-06: the bundler family plan has no open step and is done, so the cascade skips it.
- WS3-T1: Resolve a pending ADR span to its real path before the handon check. parseHandoff now reads docs/adr/_pending/<slug>.md, and verifyAdr resolves the slug against that directory before falling back to a number.
- WS3-T2: Keep each closed step whole when the closeout writes the Outcome. closedSteps joins a step's continuation lines; the ADR Outcome no longer cuts a wrapped step at its first line.
- WS3-T3: Keep plan prose that is not a checkbox in that Outcome. planProse carries the plan's paragraphs into a ### Plan prose section under the Outcome, and skips fenced blocks, headings and the status line.
- WS3-T4: Close F4, F5, F8, F9, and the stage list in the reference plan. Each is closed on a measurement recorded in that plan, not on assumption.
- WS3-T5: Clear the documentation comment lint failure, or record why it stays. Recorded: the rule fires on the block style the whole repository uses (2013 of 2297 lint problems), so clearing it is a repository-wide decision that needs its own ADR. The measurement is in the reference plan.

## Where it lives now

The ADR holds the decision and its consequences. This file records that the
plan closed and what it delivered; nothing in it is open.
