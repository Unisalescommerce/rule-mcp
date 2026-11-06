# Tools and operations

How to operate this server: the tool surface in one pointer, then plugins,
release and troubleshooting. Installing it is [01 getting started](./01-getting-started.md).

## Install into chosen projects

`rule-mcp setup --scope project --project <path> [--project-config shared|local]`
writes only into the project trees it is given, and records each one in
`~/.rule-mcp/state/projects.json` (ADR 184). `rule-mcp project add [path]` joins
another project, reusing the agents and the config kind of the most recently
recorded one; `rule-mcp project remove [path]` takes every config back and
forgets the root.

A **shared** entry is `{ "command": "rule-mcp", "args": ["serve"] }` with no
machine path, so a teammate's clone works. A **local** entry carries the full
launcher and the switches the machine implies (the project's tokensave default).
`--project-config local` is only available for a host that documents a private
project file; a host without one refuses with "has no local project config".

A project with a Claude in it also gets the three files a global Claude install
writes, cut down to the project root: the rules block in `CLAUDE.md`, the
`/rule-*` commands in `.claude/commands/`, and the guard hooks in
`.claude/settings.json` (`.claude/settings.local.json` for a local config).

Every project also gets the git side of ADR numbering: `.githooks/post-merge` and
`post-rewrite` run `rule-mcp handoff land --quiet --commit`, the
`rule-mcp-index` merge driver regenerates `ADR.md` and `HANDOFF.md` instead of
merging them as text, and the attributes go in `.gitattributes` (shared) or
`.git/info/attributes` (local). A root that is not a git repository is reported
as skipped: a shared `.mcp.json` is useful outside git too.

## Features

`rule-mcp feature list | enable <id> [--level <name>] | disable <id>` owns every
user-facing switch. The catalog is `src/core/runtime/features/_catalog.data.js`
and each level is an env patch: `adr` (on|off), `telemetry` (full|anonymous|off),
`update` (auto|notify|off), `tokensave` (on|autotrack|off), `minimal-tools`
(off|on). `on+autotrack` is accepted as another name for `autotrack`.

A feature's default is a constant except for `tokensave`: with no choice
recorded, the level follows the project's own `.tokensave/`, and a project-scope
install writes that choice into the project's entry.

## Agent attribution

Attribution is a table with one row per agent, not a switch with a vendor name on
it (`src/cli/installers/_attribution.data.js`). A row carries a mechanism
(`commit-trailer`, `pr-body`, `tool-signature`, `none`), the file and key that
agent reads, the values for keep and hide, and the page the row came from.

Two rows are documented today: Claude Code (`attribution` in
`~/.claude/settings.json`, set to `false` to hide the trailer and the PR line) and
Gemini, whose configuration page names no attribution control at all - the `none`
row. The other twenty-one agents are `unverified`: no values, no writer, and the
install prints `<agent>: attribution not documented here`. A row is added only
with a cited page.

`rule-mcp setup --attribution <keep|hide>` applies to the documented agents,
`--attribution-agent <id>` narrows it, and the wizard asks once. Invariants: a
value the user set stays, `keep` removes only the marker an install wrote, a file
the writer cannot parse is refused.

## Tool and prompt reference

The tool, prompt and resource lists are generated from the running server by
`pnpm census`, so they cannot drift from what it actually registers. They are
never hand-edited; this document points at them instead of restating them.

- Every tool, with its schema and modes: [10-tools.md](./10-tools.md)
- Every prompt and its arguments: [11-prompts.md](./11-prompts.md)
- Every `rule://` resource URI: [16-resources.md](./16-resources.md)
- What each skill covers: [09-skills.md](./09-skills.md)

## Integration levels

An install has two axes. The **profile** says how much of the catalog is reachable
(`minimal`, `standard`, `full`, `custom`); the **level** says how deeply one host is wired to
it. `install --agent <id> --level <Lx>` sets the second, and a host above its ceiling is refused
with the rung and the reason rather than installed halfway.

| Level | Writes                                     | Depends on                                  |
| ----- | ------------------------------------------ | ------------------------------------------- |
| `L0`  | the MCP entry only                         | a config file the host documents            |
| `L1`  | `L0` + the instruction block               | an instructions file the host documents     |
| `L2`  | `L1` + the `/rule-*` command files         | a command directory the host documents      |
| `L3`  | `L2` + the guard hooks                     | a hook file the host documents and we write |
| `L4`  | `L3` + a native handler (extension/plugin) | a handler API the host documents            |

The ladder is cumulative in intent, not in shape: a host installs every rung it supports up to
the level asked for, and a rung it cannot reach is skipped with its reason. Kiro writes a hook
file and has no command files, so a strict ladder would report `L0` and hide a measured surface.

### Ceilings, per host

`doctor` prints `L2 of L3, next L3` for a host installed at a level, and the ceiling alone for
one installed before the manifest recorded it. This table is the same data the installer reads;
`scripts/__tests__/docs/integration-levels.test.mjs` recomputes it from `hostRecord()` and fails on drift.

<!-- levels:start -->

| Host          | Ceiling | Rules | Commands | Hooks | Handler      |
| ------------- | ------- | ----- | -------- | ----- | ------------ |
| `claude`      | L3      | yes   | yes      | yes   | -            |
| `codex`       | L3      | yes   | yes      | yes   | -            |
| `copilot`     | L4      | yes   | yes      | -     | experimental |
| `cursor`      | L3      | yes   | yes      | yes   | -            |
| `gemini`      | L3      | yes   | yes      | yes   | -            |
| `cline`       | L2      | -     | yes      | -     | -            |
| `roo`         | L2      | -     | yes      | -     | -            |
| `opencode`    | L2      | -     | yes      | -     | -            |
| `vscode`      | L2      | -     | yes      | -     | -            |
| `kiro`        | L3      | -     | -        | yes   | -            |
| `droid`       | L0      | -     | -        | -     | -            |
| `jetbrains`   | L0      | -     | -        | -     | -            |
| `neovim`      | L0      | -     | -        | -     | -            |
| `emacs`       | L0      | -     | -        | -     | -            |
| `devin`       | L0      | -     | -        | -     | -            |
| `pi`          | L4      | -     | yes      | -     | documented   |
| `zed`         | L0      | -     | -        | -     | -            |
| `antigravity` | L0      | -     | -        | -     | -            |
| `kilo`        | L0      | -     | -        | -     | -            |
| `kimi`        | L0      | -     | -        | -     | -            |
| `vibe`        | L0      | -     | -        | -     | -            |
| `grok`        | L0      | -     | -        | -     | -            |
| `qwen`        | L0      | -     | -        | -     | -            |

<!-- levels:end -->

Seven products the study measured have no documented MCP config file at all - `aider`, `amp`,
`continue`, `goose`, `junie`, `openhands`, `trae` - so `install --agent aider` writes nothing and
says so. `cursor-cli` is covered by `cursor`: the CLI reads the editor's config file. The catalog
host `jetbrains` writes Junie's user file at `~/.junie/mcp/mcp.json` (not project `.idea/mcp.json`).

## Export distill (flight)

`exportDistill` (the `/rule-export` pipeline entry) merges transcript usage into
the project telemetry store, then writes a `.flight` under the project's exports
directory. **Default is `keep: true`**: the MCP event log stays on disk so a
distill-only run cannot erase the recording. Pass `drain: true` only when the
caller wants the same drain behaviour as a bare `exportFlight()` (file written
first, then the log emptied). Agent-session cleanup is a separate, confirm-gated
step and is not implied by drain.

## Global launcher

`rule-mcp setup` installs a **copy** under `~/.rule-mcp/launcher/<version>/` and writes a PATH
shim that resolves in this order:

1. the version named by `~/.rule-mcp/launcher/current`, when that copy's entry point exists;
2. the checkout recorded as the install source, when its entry point still exists;
3. otherwise exit `127` (cannot execute), naming the copy, the pointer, the checkout, and `rule-mcp setup` as the repair.

`pnpm link --global` is not used: it rewrites the workspace and lockfile of the tree being
installed from. The boundary between a developer's checkout and the tool on `PATH` is the
pending ADR `the-launcher-owns-a-copy-outside-the-checkout`.

`doctor` reports which target is live. `setup --uninstall` removes the launcher directory first,
then the PATH shim, and reports each removal so a shim is never left pointing at a deleted copy.

## Plugins

### Overview

Any directory in `~/.agents/skills/` with a `SKILL.md` file is auto-detected as a skill.

- **Official rule-mcp skills** start with `rule-` (e.g., `rule-frontend-react`, `rule-frontend-vue`)
- **Community/plugin skills** can use any name (e.g., `my-company-rules`)

Plugins are automatically registered as MCP tools (`rule_tool_<plugin-name>`) and support
all standard skill tool modes: `full`, `summary`, `search`, `guardrails`, `check`.

### Creating a basic plugin

```bash
# 1. Create the plugin directory
mkdir -p ~/.agents/skills/my-custom-rules

# 2. Create SKILL.md
cat > ~/.agents/skills/my-custom-rules/SKILL.md << 'EOF'
---
name: my-custom-rules
description: Custom project rules
---

# my-custom-rules

## Rules

- Use 2-space indentation
- Max line length: 100 characters
EOF

# 3. Reload skills
rule-mcp skills reload

# 4. Your plugin is now available as:
rule-mcp tools call rule_tool_styleguide --json '{"mode": "full"}'
```

### Adding custom guardrails with plugin.js

For advanced plugins, create a `plugin.js` file in your plugin directory:

```javascript
// ~/.agents/skills/my-custom-rules/plugin.js
/**
 * @module my-custom-rules/plugin
 * Optional plugin.js for custom guardrails and generators.
 */

/** Custom guardrails to add to the rule_tool_check engine. */
export const guardrails = [
  {
    id: "custom-two-spaces",
    label: "2-space indentation",
    description: "Code must use 2-space indentation.",
    check: (code) => {
      const twoSpaceIndent = code.match(/^(\s{2})[^\s]/gm);

      return {
        pass: !twoSpaceIndent || twoSpaceIndent.length === 0,
        failCount: twoSpaceIndent?.length || 0,
        detail: twoSpaceIndent ? twoSpaceIndent.slice(0, 5) : [],
        suggestion: "Use 2-space indentation instead of 4.",
      };
    },
  },
];

/** Custom generators (future use). */
export const generators = {
  configFile: () => "// Custom config\n",
};
```

### Plugin directory structure

```
~/.agents/skills/
├── my-custom-rules/          ← Plugin name (any valid directory name)
│   ├── SKILL.md              ← Required: skill content (YAML frontmatter + markdown)
│   └── plugin.js             ← Optional: custom guardrails & generators
├── my-company-rules/
│   ├── SKILL.md
│   └── plugin.js
└── rule-frontend-react/                ← Official rule-mcp skills coexist
    └── SKILL.md
```

### How plugins are detected

1. On startup (or `skills reload`), the server scans `~/.agents/skills/` and `skills/` (embedded)
2. Any directory with a `SKILL.md` file is registered as a skill
3. If the directory also has `plugin.js`, it's dynamically imported
4. The plugin's guardrails are merged into the guardrails engine
5. The plugin is registered as an MCP tool: `rule_tool_<plugin-name>`

### Community skills

The `rule://community` resource lists all installed plugins:

```bash
rule-mcp tools call rule-mcp --json '{"prompt": "List available community skills"}'
# Or directly via MCP resource:
# rule://community
```

### Best practices

- **Plugin names**: use `kebab-case` (e.g., `my-company-rules`)
- **SKILL.md**: include YAML frontmatter with `name` and `description`
- **Guardrail IDs**: prefix with your plugin name to avoid conflicts (e.g., `myco-two-spaces`)
- **Test your plugin**: run `rule_tool_check skill=<plugin-name>` to verify guardrails work

## Release

### 1. Repository Setup

```bash
cd /Users/emilianopisu/Projects/ai/rule

# Initialize git
git init
git add -A
git commit -m "feat: initial release v0.1.0"

# Add remote
git remote add origin https://github.com/pixu1980/rule-mcp

# Push
git branch -M main
git push -u origin main
```

---

### 2. Configure GitHub Secrets

Go to **GitHub -> rule-mcp-rule-mcp -> Settings -> Secrets and variables -> Actions** and add:

| Secret      | Value                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN` | npm access token (create at [npmjs.com](https://www.npmjs.com/settings/~/tokens) with type **Automation** and scope **publish**) |

`GITHUB_TOKEN` is automatic - no configuration needed.

---

### 3. Verify CI

After the first push to `main`, CI starts automatically:

- **Lint job**: syntax check + ESLint + Prettier
- **Test job**: 6 combinations (ubuntu x node20/22, macos x node20/22, windows x node20/22)
- **Audit job**: `pnpm audit:gate`, which audits every dependency - production and development - and fails on any advisory by name

Check: **GitHub -> Actions -> ci**

---

### 4. First Release (v0.1.0)

Create a tag to trigger the release pipeline:

```bash
git tag -s v0.1.0
git push origin v0.1.0
```

The tag must be signed (`-s`): the release workflow refuses lightweight
tags. Set up signing once per machine (see CONTRIBUTING.md).

The release pipeline (`.github/workflows/release.yml`) runs automatically:

| Step              | Action                                                  |
| ----------------- | ------------------------------------------------------- |
| ✅ Version gate   | Tag, package.json, server.json and CHANGELOG must agree |
| ✅ Audit gate     | No known advisories, or the build stops                 |
| ✅ Build          | Pack the tarball, checksum it, generate the SBOM        |
| ✅ Verify         | Checksum check plus scratch npm install, bin runs       |
| ✅ GitHub Release | Attach tarball, SHA256SUMS and SBOM to the release      |

---

### 5. Homebrew Tap Configuration

To enable `brew install pixu1980/tap/rule`:

```bash
# Create the tap repo
# Go to https://github.com/new → create: rule-mcp-homebrew-tap

# Clone, copy the generated formula, push
git clone https://github.com/pixu1980/homebrew-tap
cp rule-mcp.rb homebrew-tap/Formula/
cd homebrew-tap
git add Formula/rule.rb
git commit -m "feat: add rule-mcp v0.1.0"
git push
```

---

### 6. User Installation

Users can install using these methods:

| Method               | Command                                               | State   |
| -------------------- | ----------------------------------------------------- | ------- |
| **Clone + launcher** | `git clone` + `./scripts/install.sh`                  | works   |
| **pnpx**             | `pnpx rule-mcp serve`                                 | planned |
| **Homebrew**         | `brew install pixu1980/tap/rule-mcp`                  | planned |
| **Docker**           | `docker pull ghcr.io/pixu1980/rule-mcp`               | planned |
| **Winget**           | `winget install pixu1980.rule-mcp`                    | planned |
| **Scoop**            | `scoop bucket add rule-mcp && scoop install rule-mcp` | planned |
| **GitHub Release**   | Direct `.tgz` download                                | planned |

Only the clone and the installer work today. The npm name `rule-mcp` resolves to
a placeholder that does nothing, so `pnpx rule-mcp` is not a way to run this
server; the Homebrew tap, the container image and the two package manifests
describe a release that has not been cut.

#### Agent command artifacts

`install --agent <name>` installs MCP config plus host-native reusable entry point where verified:

| Agent              | Artifact                              | Invocation                                             |
| ------------------ | ------------------------------------- | ------------------------------------------------------ |
| Pi                 | `~/.pi/agent/prompts/rule.md`         | `/rule`                                                |
| Claude Code        | `~/.claude/commands/rule.md`          | `/rule`                                                |
| Gemini CLI         | `~/.gemini/commands/rule.toml`        | `/rule`                                                |
| Cursor             | `.cursor/commands/rule.md`            | `/rule`                                                |
| GitHub Copilot CLI | `~/.copilot/agents/rule-mcp.agent.md` | `/agent` selection                                     |
| Codex CLI          | `~/.agents/skills/rule/`              | Skill workflow; no stable exact custom command assumed |

Uninstall removes same artifact. Universal command body forces routing, evidence lookup, test-first implementation, blocking `rule_tool_check`, real test reporting, and ADR capture.

---

### 7. Post-Release Verification

```bash
# Test the clone install
git clone https://github.com/pixu1980/rule-mcp.git
cd rule-mcp
./scripts/install.sh
rule-mcp doctor
rule-mcp install --agent all

# Test Docker
docker pull ghcr.io/pixu1980/rule-mcp
docker compose up -d
curl http://localhost:37999/health

# Test tools
rule-mcp tools list
rule-mcp tools call rule_tool_detect --json '{}'
rule-mcp tools call rule-mcp --json '{"prompt": "React button"}'

# Verify a release tarball (every GitHub Release attaches both files)
curl -fsSLO https://github.com/pixu1980/rule-mcp/releases/download/<tag>/rule-mcp-<version>.tgz
curl -fsSLO https://github.com/pixu1980/rule-mcp/releases/download/<tag>/SHA256SUMS
shasum -a 256 -c SHA256SUMS
```

---

### 8. Subsequent Releases

```bash
# Bump version (single writer for package.json, server.json, CHANGELOG.md)
node scripts/build/version/index.mjs --apply 0.1.0
node scripts/build/version/index.mjs --check

git add -A && git commit -m "chore(release): 0.1.0" && git tag -s v0.1.0
git push --follow-tags
```

The release pipeline triggers automatically on tag `v*.*.*`.

---

### Release Pipeline Architecture

```
Tag vX.Y.Z
    │
    ├─► build: version/audit gates → pnpm build → tarball + SHA256SUMS (artifact)
    │
    ├─► verify: checksum check → scratch npm install → bin runs
    │
    └─► release: attach tarball + SHA256SUMS to the GitHub Release
```

---

### Secrets / Tokens Summary

| Service         | Required                 | Where to create                                                                                                      |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **npm**         | `NPM_TOKEN` (Automation) | [npmjs.com tokens](https://www.npmjs.com/settings/~/tokens)                                                          |
| **GitHub**      | `GITHUB_TOKEN` (auto)    | Already present - permissions: `contents: write`, `id-token: write`, `packages: write` (configured in `release.yml`) |
| **Docker GHCR** | None                     | Login via `GITHUB_TOKEN` - already configured via `docker/login-action@v3`                                           |

Everything else is already configured in existing workflows:

- CI: `.github/workflows/ci.yml`
- Release: `.github/workflows/release.yml`
- Docker: `Dockerfile` + `docker-compose.yml`
- Winget: `.github/winget/rule.rule-mcp.yaml`
- Scoop: `.github/scoop/rule.json`
- Server manifest: `server.json`
- Changelog: `CHANGELOG.md`

## Troubleshooting

### Quick diagnostics

```bash
# Run the health check
rule-mcp doctor

# List all available tools
rule-mcp tools list

# Test a specific tool
rule-mcp tools call rule-mcp --json '{"prompt": "test"}'

# Check daemon status
rule-mcp daemon status

# View daemon logs
rule-mcp daemon logs
```

### Agent-specific issues

#### Claude (Claude Code / Claude Desktop)

**Issue**: Tool not found by Claude.

- **Fix**: Ensure `~/.claude.json` has the `rule-mcp` entry.
  ```bash
  rule-mcp install --agent claude
  ```
- **Verify**: The file should contain:
  ```json
  {
    "mcpServers": {
      "rule-mcp": {
        "command": "/path/to/node",
        "args": ["/path/to/bin/rule-mcp.js", "serve"]
      }
    }
  }
  ```

**Issue**: Claude says "Tool not available" after install.

- **Fix**: Restart Claude Code. MCP servers are loaded at startup.
- **Debug**: Check `~/.claude.log` for connection errors.

#### Cursor

**Issue**: MCP server not connecting.

- **Fix**: Check `~/.cursor/mcp.json` exists and is valid JSON.
  ```bash
  rule-mcp install --agent cursor
  ```
- **Known limitation**: Cursor requires the MCP server to be available at IDE startup. If you install while Cursor is running, restart Cursor.

#### VS Code

**Issue**: VS Code doesn't detect the MCP server.

- **Fix**: The config goes into `.vscode/mcp.json` in your project root.
  ```bash
  cd your-project
  rule-mcp install --agent vscode
  ```
- **Verify**: `.vscode/mcp.json` in your project root should contain:
  ```json
  {
    "servers": {
      "rule-mcp": {
        "type": "stdio",
        "command": "/path/to/node",
        "args": ["/path/to/bin/rule-mcp.js", "serve"]
      }
    }
  }
  ```

#### GitHub Copilot

**Issue**: Copilot doesn't support custom MCP servers directly.

- **Fix**: Copilot uses a different integration path. Copy the instructions from:
  ```bash
  rule-mcp install --agent copilot --dry-run
  ```
  The generated instructions file explains how to configure Copilot.

#### Pi (pi.dev)

**Issue**: pi doesn't auto-discover the MCP server.

- **Fix**: Ensure `~/.pi/agent/mcp.json` has the entry:
  ```bash
  rule-mcp install --agent pi
  ```

### Daemon mode

**Issue**: Daemon fails to start (port in use).

- **Fix**: Check if another instance is running:
  ```bash
  rule-mcp daemon status
  lsof -i :37999
  ```
- **Kill the existing process**:
  ```bash
  rule-mcp daemon stop
  # Or manually: kill $(cat ~/.rule-mcp/state/daemon.pid)
  ```

**Issue**: Daemon started but health check fails.

- **Debug**: Check the daemon log:
  ```bash
  cat ~/.rule-mcp/state/daemon.log
  ```

**Issue**: SSE connection drops.

- **Check**: The SSE endpoint should return `text/event-stream` content type:
  ```bash
  curl -N http://localhost:37999/sse
  ```
- **Expected**: You should see a `sessionId` event within 1 second.

### Docker

**Issue**: Docker container exits immediately.

- **Fix**: The container needs to be run with stdio mode for MCP agents. Use compose for SSE:
  ```bash
  docker compose up -d
  ```

**Issue**: Can't connect to Docker container.

- **Verify**: Health check should return 200:
  ```bash
  curl http://localhost:37999/health
  ```

### Skills

**Issue**: Skills not loading after update.

- **Fix**: Re-embed skills:
  ```bash
  rule-mcp skills reload
  ```

**Issue**: `rule_tool` returns no matching skill.

- **Verify**: Skills are loaded:
  ```bash
  rule-mcp tools list | grep rule-mcp
  ```
- **Try**: Use `rule_tool_search` for free-text search across all skills.

### General debugging

| Symptom                       | Likely cause           | Fix                                          |
| ----------------------------- | ---------------------- | -------------------------------------------- |
| `command not found: rule-mcp` | Not installed globally | `git clone` + `./scripts/install.sh`         |
| `Cannot find module`          | Node.js < 20           | Upgrade to Node.js 20+                       |
| `ECONNREFUSED` on port 37999  | Daemon not running     | `rule-mcp daemon start`                      |
| Tools return 0 results        | Skills not loaded      | `rule-mcp skills reload`                     |
| `ZodError` in tool output     | Invalid arguments      | Check tool schema with `rule-mcp tools list` |
