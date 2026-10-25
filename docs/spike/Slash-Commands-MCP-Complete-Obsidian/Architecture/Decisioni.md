# Scelte architetturali e priorità

## Fase 1: supporto immediato

**Pi, OpenCode, Claude, Gemini, Qwen, VS Code, Roo, Cline, Cursor, Factory Droid.** Pi è il candidato con handler diretto più chiaro; OpenCode ha interpolazione shell; molti altri usano prompt/Skills.

## Fase 2: multi-superficie

**Zed, JetBrains, Antigravity, Kilo, Kimi, Windsurf, Continue, Goose.** Zed favorisce ACP + MCP; Antigravity richiede migrazione dai vecchi Workflows dopo il 19 ottobre 2026.

## Fase 3: verifica/version pin

**Devin, Kiro CLI, Neovim, Emacs, Grok, Vibe, Amp, Trae, Junie, OpenHands.** Identificare il plugin o prodotto specifico e validarne la API.

## Rischi

- Path assoluti e directory di lavoro: non usare ciecamente `process.cwd()`.
- Permessi: un comando Markdown non implica autorizzazione shell.
- Stati MCP: una nuova connessione stdio può creare una nuova istanza del server.
- JSON logs: distinguere output per utente, risultato macchina e stderr.
- Sicurezza: gli argomenti devono andare a `execFile` senza interpolazione shell.
- Versioni: API experimental, deprecated e beta devono avere version pin.
- Collisioni: `/init` può esistere già come comando builtin.

## Matrice implementazione

| Meccanismo      | LLM nel routing | Chiamata script diretta | Portabile  |
|-----------------|-----------------|-------------------------|------------|
| Skill/prompt.   | Sì              | Non garantita           | Alta       |
| Extension JS/TS | No              | Sì                      | Media      |
| Workflow prompt | Sì              | Non garantita           | Media      |
| Editor API      | No              | Sì                      | Per editor |
| Dispatcher CLI  | No              | Sì                      | Massima    |
