---
title: "JetBrains AI Assistant - custom slash commands e MCP"
date: 2026-10-25
tags: [ai-agents, slash-commands, mcp, ide]
status: confirmed
---

# JetBrains AI Assistant

> [!info] Classificazione
> **Superficie:** IDE. **Stato documentale:** `confirmed`.

## Integrazione di `/rule-init`

Prompt Library and MCP client; custom prompt actions, AI chat slash catalog expandable via MCP.

## MCP e determinismo

Exact invocation form differs from VS Code prompt files.

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

- [JetBrains AI Assistant, fonte principale](https://www.jetbrains.com/help/ai-assistant/chat-mode.html)
