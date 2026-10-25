---
title: "Vibe - custom slash commands e MCP"
date: 2026-10-25
tags: [ai-agents, slash-commands, mcp, cli]
status: ambiguous
---

# Vibe

> [!info] Classificazione
> **Superficie:** CLI. **Stato documentale:** `ambiguous`.

## Integrazione di `/rule-init`

Vibe is an overloaded product name; resolve product/repository before asserting custom-command support.

## MCP e determinismo

No reliable exact product identification.

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

- [Vibe, fonte principale](https://github.com/search?q=vibe+coding+cli&type=repositories)
