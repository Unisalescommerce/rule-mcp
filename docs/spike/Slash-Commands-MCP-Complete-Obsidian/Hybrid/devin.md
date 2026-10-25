---
title: "Devin - custom slash commands e MCP"
date: 2026-10-25
tags: [ai-agents, slash-commands, mcp, cloud-ide]
status: needs-test
---

# Devin

> [!info] Classificazione
> **Superficie:** Cloud IDE. **Stato documentale:** `needs-test`.

## Integrazione di `/rule-init`

Investigate Playbooks, integrations and MCP for workflow automation; no direct `/rule-init` extensibility established in this study.

## MCP e determinismo

Use API or external orchestration when available, do not assume custom slash.

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

- [Devin, fonte principale](https://docs.devin.ai/)
