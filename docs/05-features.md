# Features and attribution

This chapter tells how to change the user-facing switches.

## Features

Use these commands:

```bash
rule-mcp feature list
```

```bash
rule-mcp feature enable <id> --level <name>
```

```bash
rule-mcp feature disable <id>
```

| Feature     | Levels                     |
| ----------- | -------------------------- |
| `adr`       | `on`, `off`                |
| `telemetry` | `full`, `anonymous`, `off` |
| `update`    | `auto`, `notify`, `off`    |
| `tokensave` | `on`, `autotrack`, `off`   |

The catalog is `packages/mcp/core/runtime/features/_catalog.data.js`. Each level sets environment variables. `on+autotrack` is another name for `autotrack`.

Each feature has a fixed default, except `tokensave`. If you record no choice, `tokensave` follows the `.tokensave/` directory of the project. A project install writes the choice into the entry of the project.

## ADR policy

`RULE_MCP_ADR_POLICY` sets when the server writes an ADR.

| Level       | When                                                     |
| ----------- | -------------------------------------------------------- |
| `full`      | When you make the decision                               |
| `handoff`   | At the handoff, from the record of the session (default) |
| `on-demand` | Only when you call `rule_tool_process_adr`               |

`RULE_MCP_NO_ADR` removes all ADR tools.

## Agent attribution

Attribution is a table with one row for each agent. The file is `packages/mcp/cli/installers/_attribution.data.js`.

Two rows have documented values:

- **Claude Code.** The key is `attribution` in `~/.claude/settings.json`. Set it to `false` to hide the commit trailer and the pull request line.
- **Gemini.** Its configuration page has no attribution control, so the row has the mechanism `none`.

The other agents are `unverified`. They have no values and no writer. The install prints `<agent>: attribution not documented here`.

Use `rule-mcp setup --attribution keep` or `--attribution hide`. Use `--attribution-agent <id>` to select one agent. The wizard asks once.

The writer obeys three rules:

- A value that you set stays.
- `keep` removes only the marker that an install wrote.
- The writer refuses a file that it cannot parse.
