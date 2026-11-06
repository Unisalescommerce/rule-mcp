/**
 * @module cli/installers/install-project
 *
 * Write or remove a project-scope MCP entry for one host. Shared installs use a
 * portable `{ command: "rule-mcp", args: ["serve"] }` with no machine paths.
 * Local installs carry the full launcher (and ADR policy env when set).
 *
 * Callers (setup `--scope project`, refresh, uninstall) pass a project root and
 * collect `written` for the manifest and `projects.json` (ADR 184).
 */

import { readText, writeText } from "./_paths.js";
import { installClaudeProjectExtras } from "./_claude-project.js";

export { installClaudeProjectExtras } from "./_claude-project.js";
import { commandConfig } from "./_env-command.js";
import { tokensaveProjectEnv } from "./_env-tokensave.js";
import { upsertHostServer } from "./_host-formats.js";
import { PROJECT_HOSTS, projectHostFile, projectHostFormat, projectHostLocalFile } from "./_project-hosts.data.js";

/** Portable shared project entry: no absolute paths, no machine environment. */
export function sharedServerConfig() {
  return { command: "rule-mcp", args: ["serve"] };
}

/**
 * Local project entry: full launcher plus the env the project itself implies.
 *
 * A project entry is the only config that belongs to one project, so it is where
 * a project-dependent default belongs: tokensave is pinned off when the project
 * has no graph, and left unpinned when it has one.
 *
 * @param {string} agent
 * @param {string} entrypoint
 * @param {object} [options]
 */
function localServerConfig(agent, entrypoint, options = {}) {
  const { projectRoot, ...rest } = options;
  const config = commandConfig(entrypoint, {
    ...rest,
    agentName: agent,
    global: false,
    env: { ...tokensaveProjectEnv(projectRoot ?? process.cwd()), ...rest.env },
  });
  const policy = process.env.RULE_MCP_ADR_POLICY;

  if (policy) {
    config.env = { ...config.env, RULE_MCP_ADR_POLICY: policy };
  }

  return config;
}

/**
 * Resolve the file a project install should touch.
 *
 * @param {string} agent
 * @param {string} projectRoot
 * @param {"shared"|"local"} projectConfig
 * @returns {string}
 */
function targetFile(agent, projectRoot, projectConfig) {
  if (!PROJECT_HOSTS[agent]) {
    throw new Error(`"${agent}" has no project config`);
  }

  if (projectConfig === "local") {
    const local = projectHostLocalFile(agent, projectRoot);

    if (!local) {
      throw new Error(`"${agent}" has no local project config: use --project-config shared`);
    }

    return local;
  }

  return projectHostFile(agent, projectRoot);
}

/**
 * Install the MCP server into one host's project config.
 *
 * @param {{ agent: string, projectRoot: string, projectConfig?: "shared"|"local", entrypoint?: string, dryRun?: boolean }} options
 * @returns {{ written: string[] }}
 */
export function installProjectHost({ agent, projectRoot, projectConfig = "shared", entrypoint, dryRun = false } = {}) {
  const file = targetFile(agent, projectRoot, projectConfig);
  const format = projectHostFormat(agent);
  const config = projectConfig === "local" ? localServerConfig(agent, entrypoint ?? process.argv[1] ?? "rule-mcp", { projectRoot }) : sharedServerConfig();
  const content = upsertHostServer(format, readText(file), config);

  if (content === null) {
    throw new Error(`Refused to overwrite unreadable project config at ${file}`);
  }

  writeText({ file, content, dryRun });

  // Claude reads its rules, commands and hooks from the project too, and a
  // project install that wrote only the MCP entry left a server nobody could
  // ask a question of.
  const extras = agent === "claude" ? installClaudeProjectExtras({ projectRoot, projectConfig, entrypoint, dryRun }) : [];

  return { written: [file, ...extras] };
}

export { uninstallProjectHost } from "./_uninstall-project.js";
