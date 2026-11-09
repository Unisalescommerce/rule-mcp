# Custom skills

You can add your own skills without a change to the server. This example was run on a clean home directory.

## Where a skill goes

| Layer   | Directory                    | Scope        |
| ------- | ---------------------------- | ------------ |
| Project | `.rule-mcp/skills/<name>/`   | One project  |
| User    | `~/.rule-mcp/skills/<name>/` | Your machine |

The user layer wins over the project layer. The project layer wins over the bundled skills. `RULE_MCP_HOME` moves the user directory.

## Add a skill

Make the file `~/.rule-mcp/skills/my-rules/SKILL.md`:

```markdown
---
name: my-rules
description: House rules
exposeTool: true
guardrails: [myco-no-todo]
---

# my-rules

## Rules

- No TODO comments.
```

Make the file `~/.rule-mcp/skills/my-rules/guardrails/index.js`:

```javascript
export const noTodo = {
  id: "myco-no-todo",
  label: "No TODO comments",
  description: "Code must not hold TODO comments.",
  check: (code) => {
    const found = code.includes("TODO");

    return { pass: !found, failCount: found ? 1 : 0, detail: [], suggestion: "Remove the TODO." };
  },
};
```

Then do a check of the skill:

```bash
rule-mcp tools call rule_tool_check --json '{"code":"// TODO","skill":"my-rules"}'
```

The result includes `myco-no-todo` and the baseline rules.

## Rules for a custom skill

- A custom skill makes a tool only if the frontmatter has `exposeTool: true`. Without it, search, check, and the gateway still read the skill.
- The `guardrails` list in the frontmatter must match the exports of `guardrails/index.js`. The server reports a difference by name.
- A skill with a name from the catalog replaces that skill.
- The server runs the code in `guardrails/`. Add only code that you trust.
- If a rule folder throws an error, the server reports it and continues.
- The `rule://community` resource lists the custom skills.

The file `plugin.js` has no effect. The server also does not read `~/.agents/skills/` as a skill layer.

## Scope and severity

Two more frontmatter keys control where a skill applies and how hard its rules stop a check:

```markdown
---
name: house-migrations
paths: ["supabase/migrations/**"]
severity: warn
guardrails: [myco-no-drop]
---
```

| Key        | Values                    | Effect                                                   |
| ---------- | ------------------------- | -------------------------------------------------------- |
| `paths`    | A list of globs           | A check by path also sends a matching file to this skill |
| `severity` | `block` (default), `warn` | The default severity of the rules of this skill          |

The globs are relative to the project root. A `*` or a `**` does not match a name that starts with a dot, so `**/*.yml` does not match `.github/workflows/ci.yml`. Write the dot name in the glob, for example `.github/**`. The extension of a file still selects one skill. A skill with `paths` is added to that skill. A check that names a skill runs the skill on any file.

A rule object can also have `severity: "warn"` or `severity: "block"`. The value on the rule wins over the value of the skill. A failed `warn` rule goes in the `advisory` list of the result. It does not fail the check. A value that is not `block` or `warn` is reported, and the rule blocks.

## Choose the rules of a project

A project can turn rules off in the file `.rule-mcp/config.json` at its root:

```json
{
  "guardrails": {
    "baseline": "minimal",
    "disable": ["jsdoc-required", "ai-no-emdash"]
  }
}
```

| Key        | Values                      | Effect                                                         |
| ---------- | --------------------------- | -------------------------------------------------------------- |
| `baseline` | `full` (default), `minimal` | `minimal` stops the baseline rules on a check of another skill |
| `disable`  | A list of rule ids          | The server does not run these rules on any check               |

With `minimal`, a check runs the rules of the skill that it names and the rules that this skill inherits. A check of a baseline skill still runs the rules of that skill.

If the file is not there, all rules run. If a value in the file is not valid, the server ignores that value. A file that does not parse turns nothing off. An unknown rule id in `disable` has no effect.
