# 165: Retire the CodeQL workflow until code scanning is available

- **Date**: 2026-10-24
- **Status**: accepted
- **Tags**: ci, security, governance
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`Analyze` check failed on every pull request with "Code scanning is not enabled for this repository". repository is private, `security_and_analysis` is null, and default-setup API answers 403; enabling advanced security answers 422, "Advanced security has not been purchased." Without GitHub Advanced Security private repository cannot store code-scanning results, so CodeQL job has nowhere to upload SARIF it produces.

## Decision

Delete `.github/workflows/codeql.yml`. security surface keeps dependency audit gate, Dependabot, zizmor and license-header check; code scanning returns only when repository can store its results.

## Consequences

No CodeQL alerts are produced. `Analyze` check disappears from pull requests instead of failing forever, and CI no longer pays job that always ends in configuration error. workflow is in git history and is restored verbatim when capability exists.

## What would end this

Purchasing GitHub Advanced Security, or making repository public, would let code scanning accept uploads; workflow and its pinned action SHAs are restored then.

## Alternatives Considered

1. Buy GitHub Advanced Security (cost decision outside release)
1. Make repository public (changes distribution and support model)
1. Run CodeQL with `upload: false` (analysis would run and its findings be discarded, which is same security value as deleting job)
