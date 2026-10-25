# Esempi di configurazione

> [!caution] Sicurezza
> Esempi di scaffolding, non validati su installazioni specifiche. Sostituire il nome MCP e il path del runtime con quelli reali.

## Claude Code Skill

Percorso `.claude/skills/rule-init/SKILL.md`:

```markdown
---
name: rule-init
description: Initialize governance rules on explicit request
---

Run the validated local dispatcher once:
`node ./tools/rules.mjs init --json`
Report the exact status and do not invent success.
```

## Gemini TOML

`.gemini/commands/rule-init.toml`:

```toml
description = "Initialize governance"
prompt = """
Run the local rule initialization dispatcher once and report its exit code.
Do not replace it with an approximate implementation.
"""
```

## OpenCode command

`.opencode/commands/rule-init.md`:

````markdown
---
description: Initialize project rules
---

Output of the authoritative rule initialization:

!`node ./tools/rules.mjs init --json`

Report the result above exactly, including any error.
````

**Nota:** l'interpolazione esegue uno script prima di fornire l'output come contesto, non sostituisce una verifica dei permessi e del workspace.

## Roo Code

`.roo/commands/rule-init.md`:

```markdown
Initialize the engineering rules using the configured `rule_init`
MCP tool. Report the returned structured result. Do not mimic success.
```

## Qwen Code

`.qwen/commands/rule-init.md`:

```markdown
---
description: Initialize governance
---

Run the project's validated governance init action using MCP `rule_init`
or the installed `rules init` CLI and report the actual result.
```

## Pi extension (scheletro API)

`~/.pi/agent/extensions/rules.ts`:

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("rule-init", {
    description: "Initialize engineering governance",
    handler: async (_args, ctx) => {
      // TODO: use the installed Pi extension API to execute
      // the local dispatcher and surface the structured result.
      // Do not call a model to select a tool.
    },
  });
}
```

## VS Code prompt file

`.github/prompts/rule-init.prompt.md`:

```markdown
---
description: Initialize engineering governance for this workspace
---

Invoke the project's validated `rules init --json` CLI exactly once.
Return its output and actual exit status.
```

## CLI dispatcher contract

```bash
rules init --project "$PWD" --format json
rules check --project "$PWD" --format json
```

**Non** eseguire `eval` o `sh -c` con argomenti derivati dal comando; preferire `execFile` e validazione esplicita.
