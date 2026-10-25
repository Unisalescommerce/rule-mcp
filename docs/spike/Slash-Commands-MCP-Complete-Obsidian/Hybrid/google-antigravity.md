---
title: "Google Antigravity - custom slash commands e MCP"
date: 2026-10-25
tags: [ai-agents, slash-commands, mcp, hybrid]
status: migration
---

# Google Antigravity

> [!info] Classificazione
> **Superficie:** Hybrid. **Stato documentale:** `migration`.

## Integrazione di `/rule-init`

App and CLI expose slash commands. Legacy workflow system stopped working October 19, 2026; migrate to Skills.

## MCP e determinismo

Migration especially important as of October 25, 2026.

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

- [Google Antigravity, fonte principale](https://www.antigravity.google/docs/ide/workflows/)
