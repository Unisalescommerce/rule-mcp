# 067: Meta-frameworks get their own namespace and a narrow dispatcher

- **Date**: 2026-09-09
- **Status**: accepted
- **Tags**: skills, taxonomy, routing, tools
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

four meta-framework skills were named rule-frontend-meta-astro, next, nuxt and remix, which put them inside frontend area where they compete with eleven component skills for same routing prompts. meta-framework is not component library: it owns rendering, routing and data loading, and component skill still applies under it. user asked for rule-meta-* namespace and hub dispatcher. name was occupied: rule-area-meta prompt was dispatcher and action toolset area, shown as rule-meta in census.

## Decision

Rename four skills to rule-meta-astro, next, nuxt and remix, rename occupying prompt to rule-area-toolset (which is what it always described), and add skills/rule-meta as hub with code-registered rule_tool_meta beside it. dispatcher is deliberately narrow: it matches named framework first and framework-owned concept second (islands for Astro, server actions for Next, Nitro for Nuxt, loaders for Remix), and refuses rather than guessing. router's own corpus and thresholds are measured over whole skill set, so second general router would mean re-measuring all of it for no gain. Like rule-mcp, hub registers no per-skill tool and is not BM25-indexed: dispatcher's own directory dilutes document frequency of every common term.

## Consequences

Routing meta-framework request now names one skill and component skill to load with it. connect cost went up, not down: four entries were renamed rather than merged, so surface is 106 tools and 97,204 tools-list bytes against 105 and 96,679 before, +525 bytes for dispatcher. plan expected rename to stop four near-identical entries being paid for on connect; that would need four to become modes of one tool, which is separate decision and wider change. What this buys is legible namespace and dispatcher that answers without consulting ninety skills. ADR 001 and 008 keep rule-frontend-meta names as history.

## What would end this

The assumption this leans on, and the observation that would make it wrong.
