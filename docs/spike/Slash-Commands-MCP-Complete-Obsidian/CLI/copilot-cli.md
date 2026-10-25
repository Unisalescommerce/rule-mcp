---
title: GitHub Copilot CLI - custom commands and MCP
category: CLI
date: 2026-10-25
tags: [copilot, cli, mcp, slash-commands]
---
# GitHub Copilot CLI

> [!info] Studio completo
> Vedi [[CLI/codex-copilot-deep-dive|Custom Slash Commands in Codex CLI e GitHub Copilot CLI]] per handler JavaScript completo, esempio MCP, diagrammi Mermaid e tutte le fonti.

## Sintesi

Copilot CLI dispone di **Extensions JavaScript sperimentali** con `joinSession({ commands: [...] })`, che permettono di registrare `/rule-init` come comando diretto e invocare uno script locale senza delegare al modello la scelta. Altre opzioni sono Skills e plugin.

- Estensioni: https://docs.github.com/en/copilot/tutorials/create-an-extension
- Riferimento plugin: https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference
- Vedi [[Architecture/Contratto-unificato]] e [[Snippets/Esempi-pronti]].
