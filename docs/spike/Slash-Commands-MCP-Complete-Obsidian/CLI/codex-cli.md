---
title: Codex CLI - custom commands and MCP
category: CLI
date: 2026-10-25
tags: [codex, cli, mcp, slash-commands]
---
# Codex CLI

> [!info] Studio completo
> Questa scheda rimanda allo studio integrale con tutti gli snippet, diagrammi Mermaid e fonti: [[CLI/codex-copilot-deep-dive|Custom Slash Commands in Codex CLI e GitHub Copilot CLI]].

## Sintesi

Codex privilegia **Agent Skills** (`SKILL.md`, `$rule-init`) rispetto al vecchio sistema di custom slash prompt. Per esecuzione rigorosamente deterministica, usare un dispatcher CLI esterno che chiama MCP o uno script locale. La skill è un livello di istruzioni mediato dal modello, non un comando registrato direttamente nel parser di slash.

- Guida: https://developers.openai.com/codex/skills
- Comandi CLI: https://developers.openai.com/codex/cli/slash-commands
- Vedi [[Architecture/Contratto-unificato]] e [[Snippets/Esempi-pronti]].
