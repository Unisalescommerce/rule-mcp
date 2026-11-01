/** Take a project-scope install back out of one host's config. */

import { existsSync, rmSync } from "node:fs";

import { readText, writeText } from "./_paths.js";
import { removeHostServer } from "./_host-formats.js";
import { projectHostFormat, projectHostFile, projectHostLocalFile } from "./_project-hosts.data.js";
import { uninstallClaudeProjectExtras } from "./_claude-project.js";

export { uninstallClaudeProjectExtras } from "./_claude-project.js";

/** Where a project install wrote, resolving from the table when nothing was recorded. */
function targetFile(agent, projectRoot, projectConfig) {
  const local = projectConfig === "local" ? projectHostLocalFile(agent, projectRoot) : null;
  const file = local ?? projectHostFile(agent, projectRoot);

  if (!file) {
    throw new Error(`"${agent}" has no project config`);
  }

  return file;
}

/**
 * Remove the MCP server from one host's project config, preferring the `written`
 * paths the manifest recorded.
 *
 * @param {{ agent: string, projectRoot: string, projectConfig?: "shared"|"local", written?: string[], dryRun?: boolean }} options
 * @returns {{ written: string[] }}
 */
export function uninstallProjectHost({ agent, projectRoot, projectConfig = "shared", written, dryRun = false } = {}) {
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

    // An entry was the whole file: what is left is an empty document, and a
    // project tree should not keep one. Any other server or key keeps the file
    // alive, so only a file the install itself emptied is removed.
    if (content.trim() === "") {
      if (!dryRun && existsSync(file)) {
        rmSync(file, { force: true });
      }

      touched.push(file);
      continue;
    }

    writeText({ file, content, dryRun });
    touched.push(file);
  }

  const extras = agent === "claude" ? uninstallClaudeProjectExtras({ projectRoot, projectConfig, dryRun }) : [];

  return { written: [...touched, ...extras] };
}
