---
title: "Qwen Code - custom slash commands e MCP"
date: 2026-10-25
tags: [ai-agents, slash-commands, mcp, cli]
status: confirmed
---

# Qwen Code

> [!info] Classificazione
> **Superficie:** CLI. **Stato documentale:** `confirmed`.

## Integrazione di `/rule-init`

`.qwen/commands/rule-init.md` now recommended, TOML deprecated; shell mode `!`; MCP configuration.

## MCP e determinismo

Separate prompt command and direct shell execution.

Proposta portabile: `/rule-init` (se disponibile) richiama il dispatcher `rules init --format json` che valida parametri, connessione MCP ed esito. Dove esiste solo un prompt o una Skill, la scelta dell'esecuzione dipende dal modello: non presentarla come chiamata diretta garantita.

```mermaid
flowchart TD
    A[Utente] --> B[Comando o Skill nel client]
    B --> C[Dispatcher CLI opzionale]
    C --> D[Tool MCP rule_init]
    D --> E[JSON risultato]
```

## Verifica operativa

- [ ] Installare versione esatta e annotare `--version`.
- [ ] Confermare discovery di `/rule-init`.
- [ ] Verificare passaggio argomenti e path workspace.
- [ ] Testare success, error, timeout e autorizzazioni.
- [ ] Controllare se il tool viene realmente invocato senza intervento del modello.

## Documentazione

- [Qwen Code, fonte principale](https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/)
