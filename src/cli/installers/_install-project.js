/**
 * @module cli/installers/install-project
 *
 * Write or remove a project-scope MCP entry for one host. Shared installs use a
 * portable `{ command: "rule-mcp", args: ["serve"] }` with no machine paths.
 * Local installs carry the full launcher (and ADR policy env when set).
 *
 * CLI `--scope` / `projects.json` wiring is out of scope here: callers pass a
 * project root and collect `written` for the manifest.
 */

import { readText, writeText } from "./_paths.js";
import { commandConfig } from "./_env.js";
import { removeHostServer, upsertHostServer } from "./_host-formats.js";
import { PROJECT_HOSTS, projectHostFile, projectHostFormat, projectHostLocalFile } from "./_project-hosts.data.js";

/** Portable shared project entry: no absolute paths, no env. */
export function sharedServerConfig() {
  return { command: "rule-mcp", args: ["serve"] };
}

/**
 * Local project entry: full launcher plus ADR policy when the ambient sets it.
 *
 * @param {string} agent
 * @param {string} entrypoint
 * @param {object} [options]
 */
function localServerConfig(agent, entrypoint, options = {}) {
  const config = commandConfig(entrypoint, { ...options, agentName: agent, global: false });
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
export function installProjectHost({
  agent,
  projectRoot,
  projectConfig = "shared",
  entrypoint,
  dryRun = false,
} = {}) {
  const file = targetFile(agent, projectRoot, projectConfig);
  const format = projectHostFormat(agent);
  const config =
    projectConfig === "local"
      ? localServerConfig(agent, entrypoint ?? process.argv[1] ?? "rule-mcp")
      : sharedServerConfig();
  const content = upsertHostServer(format, readText(file), config);

  if (content === null) {
    throw new Error(`Refused to overwrite unreadable project config at ${file}`);
  }

  writeText({ file, content, dryRun });

  return { written: [file] };
}

/**
 * Remove the MCP server from one host's project config.
 *
 * Prefers `written` paths from the manifest when provided; otherwise resolves
 * from the project table.
 *
 * @param {{ agent: string, projectRoot: string, projectConfig?: "shared"|"local", written?: string[], dryRun?: boolean }} options
 * @returns {{ written: string[] }}
 */
export function uninstallProjectHost({
  agent,
  projectRoot,
  projectConfig = "shared",
  written,
  dryRun = false,
} = {}) {
  const format = projectHostFormat(agent);

  if (!format) {
    throw new Error(`"${agent}" has no project config`);
  }

  const files = written?.length ? written : [targetFile(agent, projectRoot, projectConfig)];
  const touched = [];

  for (const file of files) {
    const content = removeHostServer(format, readText(file));

    if (content === null) {
      throw new Error(`Refused to overwrite unreadable project config at ${file}`);
    }

    writeText({ file, content, dryRun });
    touched.push(file);
  }

  return { written: touched };
}
