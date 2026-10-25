/**
 * @module cli/installers/uninstall-hosts
 *
 * The per-host uninstallers: Devin, JetBrains, the generic table hosts, and the
 * two editors.
 *
 * Every one asks the host record for the path, so an install and its uninstall
 * cannot disagree about where a host keeps its config.
 */

import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

import { readText, removeFile, writeText } from "./_paths.js";
import { removeJsonServer } from "./_writers-json.js";
import { removeHostServer } from "./_host-formats.js";
import { HOST_FILES, hostFile, hostPaths } from "./_hosts.data.js";
import { emacsInitFile, nvimMcpFile } from "./_agents-ide.js";
import { hostRecord } from "./hosts/index.js";
import { renderAgentCommandFiles } from "../../core/agents/commands/index.js";

/**
 * Devin's installer writes one skill directory per command under
 * `~/.config/devin/skills`, so the uninstall has to remove them: the config
 * alone left seventeen files behind that nothing reads again.
 */
const uninstallDevin = ({ dryRun }) => {
  const file = hostRecord("devin").server.file;
  const base = dirname(file);
  const skills = join(base, "skills");
  const results = [writeText({ file, content: removeJsonServer(readText(file)), dryRun })];

  for (const { filename } of renderAgentCommandFiles("devin")) {
    const entry = join(skills, filename.split("/", 1)[0]);

    if (existsSync(entry) && !dryRun) {
      rmSync(entry, { recursive: true, force: true });
    }

    if (existsSync(entry) || dryRun) {
      results.push(entry);
    }
  }

  return results;
};

const uninstallJetbrains = ({ dryRun }) => {
  const file = hostRecord("jetbrains").server.file;

  return [writeText({ file, content: removeJsonServer(readText(file)), dryRun })];
};

/**
 * Remove a generic host's entry from every file it may live in: the one it reads
 * today, in that host's own dialect, then the path an earlier release wrote.
 * A legacy file was always `mcpServers` JSON, so its dialect is not the host's.
 */
const uninstallGeneric =
  (name) =>
  ({ dryRun }) => {
    const current = hostFile(name);
    const results = [];

    for (const file of hostPaths(name)) {
      if (!existsSync(file)) {
        continue;
      }

      const content = removeHostServer(file === current ? HOST_FILES[name].format : "mcpServers", readText(file));

      if (content === null) {
        results.push(file);
        continue;
      }

      if (content.trim() === "") {
        if (!dryRun) {
          removeFile(file);
        }

        results.push(file);
        continue;
      }

      results.push(writeText({ file, content, dryRun }));
    }

    return results;
  };

/** Neovim's file is JSON in the same shape the generic writer used. */
const uninstallNeovim = ({ dryRun }) => [writeText({ file: nvimMcpFile(), content: removeJsonServer(readText(nvimMcpFile())), dryRun })];

/** Emacs holds an elisp block, so its removal is a block strip, not a JSON delete. */
const uninstallEmacs = ({ dryRun }) => {
  const file = emacsInitFile();
  const current = readText(file);
  const without = current.replace(/\n*;; rule-mcp\n\(setq mcp-servers[\s\S]*?\)\)\)\)\n/u, "\n");

  return [writeText({ file, content: without, dryRun })];
};

export { uninstallDevin, uninstallEmacs, uninstallGeneric, uninstallJetbrains, uninstallNeovim };
