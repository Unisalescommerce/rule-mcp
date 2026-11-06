# Privacy

This chapter tells what the server records, where the data is, and how to erase it.

## Summary

The server keeps all records on your machine. It has no remote telemetry channel. The transport module exists, but the constant `REMOTE_ENABLED = false` in `packages/mcp/core/telemetry/_transport.js` turns it off. To turn it on, a person must change the code. No environment variable can do this.

The server sends data nowhere. If you export a file, you control where it goes.

## What the server records

Telemetry is on by default and stays local. All paths are under `~/.rule-mcp/`. `RULE_MCP_HOME` moves the root. `<slug>` is the directory of the current project.

| Data                                    | Location                                | Retention                    | Off switch                |
| --------------------------------------- | --------------------------------------- | ---------------------------- | ------------------------- |
| Tool name, time, latency, sizes, errors | `projects/<slug>/telemetry.jsonl`       | 7 days, then daily counts    | `RULE_MCP_NO_TELEMETRY=1` |
| Prompt text                             | The same file, field `prompt`           | 7 days                       | `RULE_MCP_NO_PROMPTS=1`   |
| File paths that tools receive           | The same file, field `path`             | 7 days                       | `RULE_MCP_NO_TELEMETRY=1` |
| Daily counts                            | `projects/<slug>/telemetry-rollup.json` | Until you delete them        | `RULE_MCP_NO_TELEMETRY=1` |
| Project ID                              | `projects/<slug>/project-id`            | Until you delete it          | `RULE_MCP_NO_TELEMETRY=1` |
| Usage that an agent declares            | `projects/<slug>/usage.json`            | Until you delete it          | Do not write it           |
| Exported recordings                     | `projects/<slug>/exports/*.flight`      | Newest 10, or 90 days        | Do not export             |
| Export decisions                        | `projects/<slug>/decision-cache.json`   | Until you delete them        | `RULE_MCP_NO_CACHE=1`     |
| Bearer token for SSE and HTTP           | `state/sse-token`, mode `0600`          | Until you delete it          | None                      |
| Failed-auth lines                       | The stderr of the server process        | Your process manager decides | None                      |

The raw log also has a size limit of 8 MiB.

The server writes no recording into a repository. So a clone has no recording to ignore and no recording to commit by accident.

Read the local data with `rule-mcp stats` or `rule_tool_stats`.

## Delete agent sessions

`/rule-export` makes a `.flight` file. It keeps the log by default and does not delete agent sessions. `/rule-export cleanup` is a separate step that needs your confirmation.

- It does a hard-delete of each session outside the keep-set. The keep-set is the newest N sessions and the current session. N is `5`, and `RULE_MCP_EXPORT_KEEP_SESSIONS` changes it.
- It refuses if the current session is not known or if you did not confirm.
- It skips each unsupported agent and does not touch its files.

**Warning:** There is no undo. A confirmed cleanup permanently deletes the transcripts of the host agent.

## Share a recording

A `.flight` file holds the timeline, the KPI block, the usage, the project, and the prompts. Use the redacted form to share it. `redactFlight` in `packages/mcp/core/telemetry/flight/_redact.js` makes this form:

- It removes `prompts[].text`. The lengths stay.
- It reduces `project.dir` to its base name.
- It replaces each `path` field with a short SHA-256 hash.
- It names the file `*.redacted.flight`.

The KPI block does not change, so you can compare a redacted flight with a full one.

## Erase your data

- For one project, delete `~/.rule-mcp/projects/<slug>/`.
- For state on the machine, delete `~/.rule-mcp/state`.
- For all data, run `rule-mcp setup --uninstall --purge`. Add `--keep-config` to keep the configuration.

[Install and uninstall](./04-install.md) tells what each uninstall command removes. In the wizard, the purge is a separate screen. It shows the file count before it deletes.

## GDPR notes

A prompt can name people. A file path can hold a user name. This project treats both as personal data, although the server does not send them.

- **Lawful basis.** There is no remote controller. The data stays on the machine of the user.
- **Minimization.** Raw events expire after 7 days. The log and the exports have limits. The redacted form lets you share without identifying data.
- **Access and portability.** The data is JSON on your disk.

## EU AI Act notes

This server is a developer tool. It routes prompts to documentation, runs deterministic checks, and records the cost. It does no profiling and no automated decisions about people. It does no biometric or emotion inference.

## Turn it off

```sh
RULE_MCP_NO_TELEMETRY=1   # record nothing
RULE_MCP_NO_PROMPTS=1     # record metrics, not prompt text
```

The server reads both at call time. Set them in the MCP configuration, and they apply to the next session.
