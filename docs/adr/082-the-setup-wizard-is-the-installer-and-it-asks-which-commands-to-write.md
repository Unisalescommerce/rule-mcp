# 082: The setup wizard is the installer, and it asks which commands to write

- **Date**: 2026-09-13
- **Status**: accepted
- **Tags**: installer, cli, wizard, commands, ux
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

installer was two implementations of same thing. `scripts/install.sh` and `scripts/install.ps1` resolved binary, wrote shim, detected agents, appended instruction block, asked about skills in single y/N line and ran health check - about 2000 lines of shell and PowerShell; `src/cli/` did same work in node, and two drifted. shell asked its questions as stream of prompts with no way back, and it decided blast radius for user: instruction files and slash commands were written by default, and what they wrote was everything.

That last part stopped being tenable when every skill got its own command (ADR: one area command per skill). full write is 152 command files in every agent directory. selection that narrows it - presets, or families plus areas plus skills - already existed as data in `src/cli/install/_selection.js`, with `--preset/--families/--areas/--skills` on `agent-commands` and `@clack/prompts` picker nothing called. So question was asked by flags, answered by picker no code path reached, and ignored by every install.

## Decision

wizard is installer. `src/cli/setup/` holds whole flow - preflight, agents, mode, optional steps, commands, review, apply - and shell and PowerShell scripts become bootstraps: check node, resolve binary, forward every argument to `rule-mcp setup`. terminal gets full-screen Ink wizard; pipe, CI job, `--json`, `--no-wizard` or node older than renderer gets plain runner with same plan, printed rather than drawn.

commands step is fifth screen. It offers three presets with count each one writes, and Custom, which drills into families, then areas, then skills of those areas. It is skipped entirely when optional steps say no command files are being written. What it answers becomes `--preset` or `--families/--areas/--skills` on `agent-commands --sync` run plan spawns, which is same argv flagged install produces: `selectionOf` reads flags into selection, `selectionArgs` writes selection back into flags, and `src/cli/install/_selection.js` stays only place that decides what selection means.

four flags that narrow surface are spelled `--commands-preset`, `--commands-families`, `--commands-areas`, `--commands-skills`. `--skills` was already optional step that copies skill catalog to `~/.agents/skills`, and one flag with two meanings is flag nobody can document.

No selection is not empty selection. run that answers nothing writes every command, which is what install did before surface grew one per skill.

## The rules the shell owned

instruction files got two blocks, and only one of them was in node. The
short routing line lived in `cli/installers/_writers-text.js`; enforced
workflow - evidence before implementation, failing tests before code,
guardrails before done - was heredoc in `install.sh`, and it was copy
that named tools correctly. node block advertised `rule_tool_component`,
`rule_tool_check`, `rule_tool_search`, `rule_tool_scaffold` and `rule_tool_process_adr`, none of which
this server registers: every tool is `rule_tool*`.

Both blocks now live in `cli/installers/_instruction.data.js`, with shell's
names, and both are written and swept by same pair of functions. A
repository check that used to read tool names out of `install.sh` reads
them out of that module instead - bootstrap has no rules to carry.

## The runtime home is part of the install, not of one client's config

first task of every plan creates `~/.rule-mcp/{state,data,projects,config}` and defaults `config/env.json`, server's own home for controls user sets - prompt-recording one above all. alternative was writing privacy decision into whichever client happened to be configured first and leaving other hosts without it.

## Consequences

One implementation, in node, tested on every platform without terminal: `_options`, `_plan-*`, `_preflight`, `_scan` and `_run-plan` are pure or read-only, and only `_app-*`, `_step-*` and `_widget-*` know Ink exists. Those are imported lazily, so `--help` and piped install never load renderer they will not draw with.

costs are real and accepted. Ink 7 declares node >= 22 while package floor is 20, so node 20 install gets plain runner and is told why. renderer is two more runtime dependencies - `ink` and `react` - in package that had four. And review screen that lists plan before touching file is only honest if every screen above it is honored, which is why selection is threaded to argv rather than stopping at step: question whose answer plan drops is worse than question never asked.

`@clack/prompts` remains, for skills picker and `config`; selection picker built on it is removed rather than kept beside wizard that asks same thing.

`install` without wizard stays narrow command it always was - the
mcp.json entry and router command file - so flag naming step of the
plan is named back at user rather than dropped, with `setup` as the
command that honors it. plain runner prints each task's detail and
its summary: the wizard shows it on the review screen before anything runs,
and piped install that printed only summary could not be audited for
what it was about to write.

tests followed code. bash and PowerShell contracts - shim probing,
picker keystrokes, phase ordering - were assertions about implementation
that no longer exists; they are now assertions about node that replaced it,
plus one parity test that holds four bootstraps to checking node, resolving
binary and forwarding to `setup`.

## Alternatives Considered

1. Keeping shell installer and adding selection to it, rejected: it is implementation that drifted, and shell picker cannot go back step
1. rail entry per custom stage (families, areas, skills), rejected: three of four are conditional, and rail that grays out most of itself reads as broken install
1. Asking for commands before optional steps, rejected: answer is meaningless when no command files are written
1. Reusing `--skills` for skill names of selection, rejected: it already means bundled-skills step
1. Defaulting to Full so nothing is lost, rejected: 152 files per agent directory is outcome nobody chose and everybody got
