# 078: Documentation site is hand-written static HTML from docs

- **Date**: 2026-09-11
- **Status**: accepted
- **Tags**: docs, site
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

OSS-27: install instructions have no canonical URL because there is no documentation site. interview decided direction: build site from scratch and publish it with GitHub Actions, so deployed URL becomes canonical install URL.

## Decision

documentation site is hand-written: small Node generator in scripts/docs-site/ renders docs/ Markdown to static HTML with marked (already devDependency), served locally by static preview server. No site framework, no new dependencies.

## Consequences

scripts/docs-site/ holds small marked-based generator plus static preview server; docs/ stays source of truth; chapters map to /`<slug>`.html and ADRs to /adr/`<slug>`.html with index; Pages workflow uploads emitted artifact.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Adopt site generator (VitePress/Astro/Next) (rejected: heavy dependencies and build toolchain for what is 15 chapters plus ADR log; contradicts no-build-step grain of repo)
1. Publish docs from branch (rejected: second long-lived branch to keep in sync; artifact deploys it)
