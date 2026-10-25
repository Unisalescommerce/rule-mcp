/** @module cli/installers/uninstall - the editor uninstallers and the registry */

import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { HOME, IS_MACOS, IS_WINDOWS, readText, removeFile, writeText } from "./_paths.js";
import { removeJsonServer, removeVscodeServer } from "./_writers-json.js";
import { HOST_FILES, hostFile, hostPaths } from "./_hosts.data.js";
import { removeHostServer } from "./_host-formats.js";
import { hostRecord } from "./hosts/index.js";
import { renderAgentCommandFiles } from "../../core/agents/commands/index.js";
import { emacsInitFile, nvimMcpFile } from "./_agents-ide.js";
import { uninstallClaude, uninstallCodex, uninstallCursor, uninstallCopilot, uninstallGemini, uninstallPi } from "./_uninstall-clis.js";
import { uninstallOpencode } from "./_agents-opencode.js";
export * from "./_uninstall-clis.js";
export { uninstallOpencode } from "./_agents-opencode.js";

const uninstallVscode = ({ dryRun }) => {
  const removeFromExistingFile = (file) => {
    if (!existsSync(file)) {
      return null;
    }

    const content = removeVscodeServer(readText(file));

    if (content === "") {
      if (!dryRun) {
        removeFile(file);
      }

      return file;
    }

    return writeText({ file, content, dryRun });
  };

  const results = [];

  // Project-level
  const projectFile = join(process.cwd(), ".vscode", "mcp.json");
  results.push(removeFromExistingFile(projectFile));

  // Global (main VS Code)
  const globalFile = hostRecord("vscode").server.file;
  results.push(removeFromExistingFile(globalFile));

  // VS Code Insiders global
  const insidersDir = IS_MACOS
    ? join(HOME, "Library", "Application Support", "Code - Insiders", "User")
    : IS_WINDOWS
      ? join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "Code - Insiders", "User")
      : join(HOME, ".config", "Code - Insiders", "User");
  results.push(removeFromExistingFile(join(insidersDir, "mcp.json")));

  // Code-OSS global
  if (!IS_WINDOWS) {
    const ossDir = IS_MACOS ? join(HOME, "Library", "Application Support", "Code - OSS", "User") : join(HOME, ".config", "Code - OSS", "User");
    results.push(removeFromExistingFile(join(ossDir, "mcp.json")));
  }

  return results.filter(Boolean);
};

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

const uninstallers = {
  claude: uninstallClaude,
  codex: uninstallCodex,
  cursor: uninstallCursor,
  copilot: uninstallCopilot,
  gemini: uninstallGemini,
  pi: uninstallPi,
  opencode: uninstallOpencode,
  vscode: uninstallVscode,
  jetbrains: uninstallJetbrains,
  cline: uninstallGeneric("cline"),
  roo: uninstallGeneric("roo"),
  zed: uninstallGeneric("zed"),
  antigravity: uninstallGeneric("antigravity"),
  devin: uninstallDevin,
  kilo: uninstallGeneric("kilo"),
  kimi: uninstallGeneric("kimi"),
  vibe: uninstallGeneric("vibe"),
  grok: uninstallGeneric("grok"),
  droid: uninstallGeneric("droid"),
  kiro: uninstallGeneric("kiro"),
  qwen: uninstallGeneric("qwen"),
  neovim: uninstallNeovim,
  emacs: uninstallEmacs,
};

export { uninstallVscode, uninstallDevin, uninstallJetbrains, uninstallNeovim, uninstallEmacs, uninstallGeneric, uninstallers };
