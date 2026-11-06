# Troubleshooting

Start with these commands:

```bash
rule-mcp doctor
```

```bash
rule-mcp tools list
```

```bash
rule-mcp daemon status
```

```bash
rule-mcp daemon logs
```

## Common problems

| Symptom                               | Cause                           | Fix                                        |
| ------------------------------------- | ------------------------------- | ------------------------------------------ |
| `command not found: rule-mcp`         | The shim is not on `PATH`       | Run `./scripts/install.sh` from the clone  |
| `rule-mcp needs Node 26.4.0 or newer` | The Node.js version is old      | Install Node.js 26.4 or newer              |
| `SyntaxError` on `registerHooks`      | Node.js is older than 22        | Install Node.js 26.4 or newer              |
| `rule-mcp launcher: cannot start.`    | The copy and the clone are gone | Run `rule-mcp setup` from a clone          |
| `ECONNREFUSED` on port `37999`        | The daemon is not running       | Run `rule-mcp daemon start`                |
| A tool returns no results             | The skills are not loaded       | Run `rule-mcp skills reload`               |
| `ZodError` in the tool output         | The arguments are not valid     | Read the schema in [Tools](./14-tools.md)  |
| `Unknown skill` for a custom skill    | The directory is wrong          | See [Custom skills](./07-custom-skills.md) |

## An agent does not find the tools

An agent reads MCP entries when it starts. Restart the agent after an install.

Then make sure that the configuration file has the `rule-mcp` entry. Run `rule-mcp install --agent <name>` to write the entry again.

| Agent       | Configuration file                                          |
| ----------- | ----------------------------------------------------------- |
| Claude Code | `~/.claude.json`                                            |
| Cursor      | `~/.cursor/mcp.json`                                        |
| VS Code     | `~/Library/Application Support/Code/User/mcp.json` on macOS |
| Copilot CLI | `~/.copilot/mcp-config.json`                                |
| Gemini CLI  | `~/.gemini/settings.json`                                   |
| Codex CLI   | `~/.codex/config.toml`                                      |
| Pi          | `~/.pi/agent/mcp.json`                                      |

[Install targets](./22-install-targets.md) lists all hosts. Add `--dry-run --json` to see the files that an install writes on your machine.

## Daemon

If the daemon does not start, another process can have the port. Run these commands:

```bash
rule-mcp daemon status
```

```bash
lsof -i :37999
```

```bash
rule-mcp daemon stop
```

The daemon writes its log to `~/.rule-mcp/state/daemon.log` and its process ID to `~/.rule-mcp/state/daemon.pid`.

The HTTP and SSE transport needs a bearer token. The file is `~/.rule-mcp/state/sse-token`.

## Docker

A container with stdio exits when its input closes. Use Compose, which starts the SSE transport:

```bash
docker compose up -d
```

Then make sure that the health endpoint answers:

```bash
curl http://localhost:37999/health
```

## Skills

`rule_tool` can return no skill for a request. Use `rule_tool_search` for a free-text search of all skills.
