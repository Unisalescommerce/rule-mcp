# 096: The handoff document closes with the resume prompt

- **Date**: 2026-09-17
- **Status**: accepted
- **Tags**: handoff, handon, prompts, docs
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

paste-ready block handoff flow produces lived in chat only. document at `docs/handoff/<NN>-<slug>.md` carried narrative and commit-scope reminder, but nothing in it was written to be handed to next session, so session that ended before its reader copied block left only prose behind. `handon` could derive first move from what it verified, but never exact words handoff author meant to send.

## Decision

Every handoff document ends with `Resume Prompt` section holding fenced `prompt` block: message next session opens with. `footerLines` renders base block - resumption instruction naming `rule_tool_process_handon`, and commit-scope convention - and whoever persists file adds path of document and first step of next session inside fence, leaving nothing after it. `handon` reads block back and reports it verbatim as `## Prompt to run next`, with directives neutralized, so prompt travels with file instead of living only in chat. Fenced blocks stop counting as open items, so steps quoted prompt spells out are not read as previous session's leftovers.

## Consequences

block is same bytes in file and in chat, so two cannot drift. resume pastes prompt previous session wrote, and minimal format, which is one-line paste rather than document, drops section to stay one line. Cost: block is agent-authored text that `handon` quotes back, which is why it is neutralized on way out; and tool ships base block whose two most useful facts are still filled in by hand, so run that skips that step falls back to derived first move.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep paste-ready block in chat and let `handon` compose prompt entirely from its verified first move
1. Add second file next to handoff holding only prompt
1. Have handoff tool take handoff number and next step as inputs so block is never authored by agent
