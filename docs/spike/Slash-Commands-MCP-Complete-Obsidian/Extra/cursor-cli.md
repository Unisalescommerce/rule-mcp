---
title: "Cursor CLI - custom slash commands e MCP"
date: 2026-10-25
tags: [ai-agents, slash-commands, mcp, cli]
status: confirmed
---

# Cursor CLI

> [!info] Classificazione
> **Superficie:** CLI. **Stato documentale:** `confirmed`.

## Integrazione di `/rule-init`

Terminal CLI `agent`, native slash commands; separate from Cursor IDE command files.

## MCP e determinismo

Dedicated adapter audit.

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

- [Cursor CLI, fonte principale](https://prod.cursor.com/docs/cli/reference/slash-commands)
