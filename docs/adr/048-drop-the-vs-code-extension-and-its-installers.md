# 048: Drop the VS Code extension and its installers

- **Date**: 2026-09-05
- **Status**: accepted
- **Tags**: vscode, extension, installer, lean-web
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

rule-mcp-vanilla-reactive VS Code extension (syntax highlighting, autocomplete for HTML templates) and its build/install machinery were last remnant of no-framework editor-integration path. upstream repo already removed extensions/ on owner decision (upstream handoff 07, ADR 080): "installers now write agent configuration and nothing else". extension served only syntax highlighting; styleguides and framework skills cover same ground, and lean-web direction (0 runtime deps, all-vanilla) does not need editor plugins to teach it. Keeping extensions/ forced every installer (CLI, install.sh, install.ps1, uninstall.sh, uninstall.ps1) to build or bundle a.vsix and probe six editor CLIs, with no test coverage. This decision matches upstream evolution and removes last dependency on @vscode/vsce.

## Decision

Delete extensions/ (vscode-rule-mcp source + rule-mcp-vanilla-reactive.vsix). Remove five extension functions from src/cli/agent-installers.js (vscodeExtensionDirectories, removeVscodeExtensionDirectories, tryInstallExtension, installVscodeExtension, uninstallVscodeExtension) and their call sites in installVscode/uninstallVscode. Remove Phase 4 (install) and Phase 3b (uninstall) from scripts/install.sh, uninstall.sh, install.ps1, uninstall.ps1. Drop extensions from test/repository-contract.test.mjs sourceDirectories and from rule-mcp-porting-baseline preservedRoots. ADR 017 is superseded.

## Consequences

Positive: installers shrink (no vsce build, no six-editor probing), no committed binary .vsix, surface and supply chain simpler, aligns with upstream ADR 080 and the lean-web direction. Negative: VS Code users lose the bundled syntax highlighting/autocomplete for HTML-in-JS and the vanilla-reactive template language; must be rebuilt externally if ever needed again.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep extension but build it lazily on demand
1. Externalize extension into its own repo
1. Keep VSIX committed but stop building it
