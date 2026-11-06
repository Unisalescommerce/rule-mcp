# Migrating to RuleMCP

The server formerly published as `rule-mcp` is now **RuleMCP**. The
GitHub repository is `pixu1980/rule-mcp`, the package and binary are `rule-mcp`,
and the product name is RuleMCP. The rename is recorded in
[ADR 160](../adr/160-rename-the-server-to-rulemcp.md), and the repository name is
corrected by the pending decision recorded on 2026-11-06.

## What changed

- The GitHub repository did not move: it is `pixu1980/rule-mcp`. An earlier
  version of this guide claimed a move and a redirect, and neither was true:
  the old address answers 404.
- The npm package and the binary are `rule-mcp`. The old `rule-mcp`
  package was never published to npm.
- MCP client configs use `"command": "rule-mcp"` instead of the old command.
- The `server.json` registry identifier is `io.github.pixu1980/rule-mcp`.

The npm name `rule-mcp` is unclaimed today. The project reserves it with a
placeholder package that does nothing, so installing `rule-mcp` gives you that
placeholder and not the server. The `rule-mcp-server` npm name is unrelated.

## What did not change

- The `RULE_MCP_*` environment variables keep their names. Existing
  configuration continues to work; no variable rename is required.
- The `rule-*` skills, prompts and tools keep their names.
- The `rule-mcp-architect` sibling repository keeps its name.
- Historical ADRs, handoffs, reviews, audits and the changelog keep the old
  name as part of the record.

## Upgrade steps

1. Remove the old global shim if it is still installed:

   ```bash
   npm uninstall -g rule-mcp
   ```

2. Install from the checkout. The npm package name is reserved as `rule-mcp`,
   but it is not published yet, so the supported route is the clone plus the
   installer:

   ```bash
   pnpm install -g .
   # or
   bash scripts/install.sh
   ```

3. Update every MCP client configuration from the old command to the new one:

   ```json
   {
     "mcpServers": {
       "rule-mcp": {
         "command": "rule-mcp",
         "args": ["serve"]
       }
     }
   }
   ```

4. Restart the MCP client and confirm the server starts:

   ```bash
   rule-mcp doctor
   ```

5. Update scripts, CI jobs and documentation that invoke the old command. The
   new command is `rule-mcp`; the old `rule-mcp` shim is not created.

## Compatibility

The environment prefix stays `RULE_MCP_*` so existing deployments do not
need a second migration. A future change may add `RULE_MCP_*` aliases; it would
be a separate decision with its own ADR. Until then, keep the existing
environment variables.
