# 244: The documentation holds no HTML and the census writes whole files

- **Date**: 2026-11-06
- **Status**: accepted
- **Supersedes**: [063]
- **Tags**: docs, census, site
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The handbook mixed HTML with Markdown: three sections in the README, census fences, a generated comment, and bare placeholders that the site dropped. Chapter 04 had 646 lines. The owner asked for documents with no HTML, in simple English, and for accepted ADRs and handoffs to be compressed once.

## Decision

README.md and docs hold no raw HTML, and a parser test enforces it. The census writes whole files only, so no fence exists: generated blocks moved to their own chapters 22 and 23, and into the surface map and the instructions page. The site adds the home and diagram structure from the shape of the Markdown in packages/docs/_decorate.mjs. Chapter 04 split into six chapters. Accepted ADRs and handoffs went once through compressText at level full, as an owner-approved exception to the rule that an accepted record does not change.

## Consequences

A placeholder in prose needs a code span. The home page and the diagram depend on two heading names; a renamed heading loses the styling and keeps the content. The compression saved 3.4 percent, so the records keep their meaning and their citations.

## What would end this

The site needs a structure that the shape of plain Markdown cannot express.

## Alternatives Considered

1. Keep census fences with Markdown link-reference comments (rejected: prettier can rewrite them and the fence stops matching)
1. Rewrite the records by hand (rejected by the owner: about 14000 lines)
