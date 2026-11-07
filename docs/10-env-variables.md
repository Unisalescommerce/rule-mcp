# Environment variables

This chapter lists each `RULE_MCP_*` variable. [Environment readers](./23-env-readers.md) tells where the code reads each one.

## Set a variable

Use the `config env` command to save a variable. The command writes `~/.rule-mcp/config/env.json`. The installer adds the saved values to the MCP configuration of each agent.

```bash
rule-mcp config env --set RULE_MCP_NO_AUTOUPDATE=1
```

```bash
rule-mcp config env --list
```

```bash
rule-mcp config env --unset RULE_MCP_NO_AUTOUPDATE
```

A variable in your shell overrides the saved value.

## Server and transport

| Variable                | Description                                                    | Default       | Values     |
| ----------------------- | -------------------------------------------------------------- | ------------- | ---------- |
| `RULE_MCP_HOST`         | The interface for the HTTP and SSE transports.                 | `127.0.0.1`   | An address |
| `RULE_MCP_PORT`         | The port for the HTTP and SSE transports.                      | `37999`       | A port     |
| `RULE_MCP_SSE_TOKEN`    | The bearer token for SSE. The server makes one if it is unset. | Generated     | Any string |
| `RULE_MCP_DAEMON`       | Runs the process as a daemon. Service units set it.            | Unset         | `1`        |
| `RULE_MCP_DOCKER`       | Marks a process in the container. It changes installer paths.  | Unset         | `1`        |
| `RULE_MCP_GUARD_DAEMON` | The guard sets it on itself. Do not set it.                    | Unset         | `1`        |
| `RULE_MCP_CLIENT`       | Names the client. It overrides `clientInfo.name`.              | The handshake | A name     |

## Paths

| Variable                     | Description                                                       | Default               | Values        |
| ---------------------------- | ----------------------------------------------------------------- | --------------------- | ------------- |
| `RULE_MCP_HOME`              | The root for state, data, projects, and config.                   | `~/.rule-mcp`         | Absolute path |
| `RULE_MCP_STATE_DIR`         | The state directory: cache, index, token, daemon files.           | `~/.rule-mcp/state`   | Absolute path |
| `RULE_MCP_PROJECT_DIR`       | One more directory to search for the project.                     | Unset                 | Absolute path |
| `RULE_MCP_REPO_ROOT`         | The repository for the skills and the version of the server.      | The installed copy    | Absolute path |
| `RULE_MCP_ROLES_DIR`         | Replaces the built-in persona catalog.                            | The built-in catalog  | Absolute path |
| `RULE_MCP_ROLES_OVERLAY_DIR` | The directory for your role overlays.                             | `<home>/config/roles` | Absolute path |
| `RULE_MCP_SKIP_GLOBAL_LINK`  | Skips the global command. Use it where a package manager owns it. | Unset                 | `1`           |

## Tool surface and output

| Variable                       | Description                                                                 | Default     | Values                         |
| ------------------------------ | --------------------------------------------------------------------------- | ----------- | ------------------------------ |
| `RULE_MCP_SURFACE`             | Limits the skills that the session advertises.                              | All         | A surface spec                 |
| `RULE_MCP_COMPRESSION_LEVEL`   | Sets the compression strength. An unknown value gives `full` and a warning. | `full`      | `off`, `lite`, `full`, `ultra` |
| `RULE_MCP_NO_COMPRESSION`      | Stops text compression of tool results. Code and JSON do not change.        | Unset       | `1`                            |
| `RULE_MCP_NO_FINGERPRINT`      | Stops the change to ASCII punctuation and American spelling in results.     | Unset       | `1`                            |
| `RULE_MCP_SUPPRESS_MIN_LINES`  | The line count at which the pipeline removes or cuts a result.              | `40`, `120` | An integer                     |
| `RULE_MCP_NO_REMINDER`         | Stops the workflow reminder in tool results.                                | Unset       | `1`                            |
| `RULE_MCP_REMINDER_EVERY`      | Sends a reminder on each Nth result. `0` sends the contract once.           | `5`         | An integer                     |
| `RULE_MCP_LOOSE_DEPS`          | Removes the exact-version line from the reminder.                           | Unset       | `1`                            |
| `RULE_MCP_NO_PROMPT_DIRECTIVE` | Stops the rules that the hooks add to a session.                            | Unset       | `1`                            |
| `RULE_MCP_NO_FLIGHT`           | Stops only the flight block in those rules.                                 | Unset       | `1`                            |
| `RULE_MCP_NO_RESUME_HANDON`    | Stops the verified handoff at resume.                                       | Unset       | `1`                            |
| `RULE_MCP_NO_MCP_PROMPTS`      | Hides MCP prompts for the named clients. `1` hides them for all clients.    | Unset       | `1` or a comma list            |
| `RULE_MCP_VARS`                | Internal. It names the table that the `config` command prints.              | Internal    | Internal                       |

## Cache and guarded checks

| Variable                      | Description                                        | Default | Values       |
| ----------------------------- | -------------------------------------------------- | ------- | ------------ |
| `RULE_MCP_NO_CACHE`           | Stops the result cache at each tier.               | Unset   | `1`          |
| `RULE_MCP_CACHE_EXACT_ONLY`   | Uses only the exact key. `cache stats` reports it. | Unset   | `1`          |
| `RULE_MCP_GUARDED_CHECKS`     | Runs checks in a worker that the server can stop.  | Unset   | `1`          |
| `RULE_MCP_CHECK_TIMEOUT_MS`   | The time limit for one guarded check.              | `5000`  | Milliseconds |
| `RULE_MCP_TEST_SLOW_CHECK_MS` | For tests only. Do not set it in an install.       | Unset   | Milliseconds |

## Decision layer

| Variable                            | Description                                                              | Default                 | Values                  |
| ----------------------------------- | ------------------------------------------------------------------------ | ----------------------- | ----------------------- |
| `RULE_MCP_DECISION_MODEL`           | The model that can rerank the BM25 list. Unset keeps BM25.               | Unset                   | An id, alias, or `auto` |
| `RULE_MCP_DECISION_URL`             | The loopback URL of the local llama.cpp router. Other hosts are refused. | `http://localhost:9931` | A loopback URL          |
| `RULE_MCP_DECISION_TIMEOUT`         | The time limit for one decision request.                                 | `5000`                  | Milliseconds            |
| `RULE_MCP_DECISION_CACHE_SHADOW`    | Records what the gate would replay, and does not replay it.              | Unset                   | `1`                     |
| `RULE_MCP_DECISION_CACHE_REPLAY`    | Replays the cached result. It wins over shadow.                          | Unset                   | `1`                     |
| `RULE_MCP_DECISION_CACHE_THRESHOLD` | The probability floor for a replay.                                      | `0.70`                  | A number up to 1        |

## ADR and handoff

| Variable                    | Description                                                               | Default                                         | Values                               |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| `RULE_MCP_ADR_POLICY`       | Sets when an ADR is written. `.context/adr.json` wins over this variable. | `handoff`                                       | `full`, `handoff`, `on-demand`, JSON |
| `RULE_MCP_NO_ADR`           | Removes the ADR and handoff tools and commands.                           | Unset                                           | `1`                                  |
| `RULE_MCP_AUTO_ADR`         | Writes an ADR after a routing, scaffold, detect, or fix call.             | Unset                                           | `1`                                  |
| `RULE_MCP_DISABLE_AUTO_ADR` | Stops automatic ADRs. `tools call` sets it for its run.                   | Unset                                           | `1`                                  |
| `RULE_MCP_BASE_BRANCH`      | The base branch for comparisons. Use it in a CI job.                      | `origin/HEAD`, then `develop`, `main`, `master` | A branch                             |
| `RULE_MCP_NO_SYNC_GUARD`    | Stops the branch-sync check. The check itself does not rebase.            | Unset                                           | `1`                                  |

## Self-update

| Variable                                | Description                                                      | Default               | Values              |
| --------------------------------------- | ---------------------------------------------------------------- | --------------------- | ------------------- |
| `RULE_MCP_NO_AUTOUPDATE`                | Stops the update check on tool calls.                            | Unset                 | `1`                 |
| `RULE_MCP_AUTO_UPDATE`                  | `notify` names the command to run. `upgrade` applies the update. | `notify`              | `notify`, `upgrade` |
| `RULE_MCP_AUTO_UPDATE_INTERVAL_SECONDS` | The minimum time between checks. `0` checks on each tool call.   | `60`                  | Seconds             |
| `RULE_MCP_NO_AUTORESTART`               | After an update, prints an instruction and does not exit.        | Unset                 | `1`                 |
| `RULE_MCP_DAEMON_AUTORESTART`           | Lets a daemon exit after an update, so its service restarts it.  | Unset                 | `1`                 |
| `RULE_MCP_UPDATE_REMOTE`                | The git remotes that an install can use. Forks need it.          | The `server.json` URL | A comma list        |
| `RULE_MCP_UPDATE_REQUIRE_SIGNATURE`     | Requires a signature. Release tags have none, so updates stop.   | Unset                 | `1`                 |

## Telemetry and TokenSave

| Variable                        | Description                                                                                 | Default | Values             |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ------- | ------------------ |
| `RULE_MCP_NO_TELEMETRY`         | Records nothing and writes no telemetry files.                                              | Unset   | `1`                |
| `RULE_MCP_NO_PROMPTS`           | Keeps prompt text out of the record. It also empties `prompts/list`.                        | Unset   | `1`                |
| `RULE_MCP_NO_PROMPT_TEXT`       | Records only the prompt length. `telemetry --level anonymous` writes it.                    | Unset   | `1`                |
| `RULE_MCP_TELEMETRY_ANONYMOUS`  | The older name for the anonymous level. Each telemetry level clears it.                     | Unset   | `1`                |
| `RULE_MCP_EXPORT_KEEP_SESSIONS` | The newest sessions that `/rule-export cleanup` keeps. It always keeps the current session. | `5`     | A positive integer |
| `RULE_MCP_NO_TOKENSAVE`         | `1` stops TokenSave. `0` turns it on in each project. Unset follows `.tokensave/`.          | Unset   | `1`, `0`           |
| `RULE_MCP_TOKENSAVE_AUTOTRACK`  | Runs `tokensave branch add <branch>` on a fallback index.                                   | Unset   | `1`                |
| `RULE_MCP_HOOK_HOST`            | Names the host of a hook when the payload cannot.                                           | Unset   | A host id          |
| `RULE_MCP_SKILL_UNIVERSE`       | `base` limits routing to the set that the routing corpus measures.                          | Unset   | `base`             |

## Feature levels

`rule-mcp feature enable <id> --level <name>` writes these keys into `~/.rule-mcp/config/env.json`.

| Feature     | Levels                     | Keys                                                    |
| ----------- | -------------------------- | ------------------------------------------------------- |
| `adr`       | `on`, `off`                | `RULE_MCP_NO_ADR`                                       |
| `telemetry` | `full`, `anonymous`, `off` | `RULE_MCP_NO_TELEMETRY`, `RULE_MCP_NO_PROMPT_TEXT`      |
| `update`    | `auto`, `notify`, `off`    | `RULE_MCP_NO_AUTOUPDATE`, `RULE_MCP_AUTO_UPDATE`        |
| `tokensave` | `on`, `autotrack`, `off`   | `RULE_MCP_NO_TOKENSAVE`, `RULE_MCP_TOKENSAVE_AUTOTRACK` |

## Node.js variables

The stdio server starts once for each client. `bin/rule-mcp.js` turns on the compile cache, and the installer writes a cache directory into the agent configuration.

| Variable                     | Description                                   | Default                           |
| ---------------------------- | --------------------------------------------- | --------------------------------- |
| `NODE_COMPILE_CACHE`         | The directory for the compiled code cache.    | `~/.cache/rule-mcp/compile-cache` |
| `NODE_DISABLE_COMPILE_CACHE` | `1` stops the cache. The test runner sets it. | Unset                             |
