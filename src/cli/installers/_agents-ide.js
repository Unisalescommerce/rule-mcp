/**
 * Installers for IDE/desktop agents: VS Code, JetBrains, Neovim, Emacs, Devin,
 * the generic fallback installer, and platform path helpers.
 * @module cli/installers/agents-ide
 */

import { join } from "node:path";
import { HOME, IS_WINDOWS, readText, writeText, serverName } from "./_paths.js";
import { commandConfig } from "./_env.js";
import { upsertJsonServer, upsertVscode } from "./_writers-json.js";
import { HOST_FILES, hostFile } from "./_hosts.data.js";
import { upsertHostServer } from "./_host-formats.js";
import { renderAgentCommandFiles } from "../../core/agents/commands/index.js";

const vscodeGlobalDir = () => {
  if (process.platform === "darwin") {
    return join(HOME, "Library", "Application Support", "Code", "User");
  }

  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "Code", "User");
  }

  return join(HOME, ".config", "Code", "User");
};

const devinConfigPath = () => {
  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "devin", "mcp_config.json");
  }

  return join(HOME, ".config", "devin", "mcp_config.json");
};

const installVscode = ({ entrypoint, dryRun, global, mode }) => {
  // The universal installer is user-level. Workspace config is opt-in outside it.
  const globalFile = join(vscodeGlobalDir(), "mcp.json");
  const results = [
    writeText({
      file: globalFile,
      content: upsertVscode(readText(globalFile), commandConfig(entrypoint, { global, mode, agentName: "vscode" })),
      dryRun,
    }),
  ];

  return results;
};

/** Where Junie (and JetBrains AI via Junie) reads the user-level MCP file. */
const junieConfigPath = () => join(HOME, ".junie", "mcp", "mcp.json");

const installJetbrains = ({ entrypoint, dryRun, global }) => {
  const file = junieConfigPath();

  return [
    writeText({
      file,
      content: upsertJsonServer(readText(file), commandConfig(entrypoint, { global, agentName: "jetbrains" })),
      dryRun,
    }),
  ];
};

/** Where Neovim reads a user-level MCP file. */
const nvimMcpFile = () => join(IS_WINDOWS ? join(HOME, "AppData", "Local", "nvim") : join(HOME, ".config", "nvim"), "mcp.json");

/** Where Emacs keeps the init file an MCP client reads. */
const emacsInitFile = () => join(IS_WINDOWS ? join(HOME, "AppData", "Roaming", ".emacs.d") : join(HOME, ".emacs.d"), "init.el");

const installNeovim = ({ entrypoint, dryRun, global }) => {
  const file = nvimMcpFile();

  return [
    writeText({
      file,
      content: upsertJsonServer(readText(file), commandConfig(entrypoint, { global, agentName: "neovim" })),
      dryRun,
    }),
  ];
};

const installEmacs = ({ entrypoint, dryRun, global }) => {
  // Emacs uses init.el or early-init.el
  const initFile = emacsInitFile();
  const config = commandConfig(entrypoint, { global, agentName: "emacs" });
  const isPi = false; // Emacs is never pi.dev
  const emacsMarker = ";; rule-mcp";
  const emacsConfig = `${emacsMarker}\n(setq mcp-servers '((\n  "${serverName}" . (\n    (command . "${config.command}")\n    (args . ${JSON.stringify(config.args)})${isPi ? '\n    (directTools . t)\n    (lifecycle . "keep-alive")' : ""}))))\n`;

  return [
    writeText({
      file: initFile,
      content: readText(initFile).includes(emacsMarker) ? readText(initFile) : `${readText(initFile).trimEnd()}\n\n${emacsConfig}`,
      dryRun,
    }),
  ];
};

/**
 * The installer for a host that keeps its servers in a documented file with a
 * documented dialect. The path and the format come from `_hosts.data.js`, so
 * this function knows neither: it reads the file, hands it to the writer and
 * writes what comes back.
 *
 * No instructions file: earlier releases wrote `~/.config/<name>/instructions.md`
 * for every generic host, a path no host documents. A rules block that lands in
 * a file nothing reads is worse than no rules block, because the install report
 * says it worked.
 */
const createGenericInstaller =
  (name) =>
  ({ entrypoint, dryRun, global }) => {
    const file = hostFile(name);
    const content = upsertHostServer(HOST_FILES[name].format, readText(file), commandConfig(entrypoint, { global, agentName: name }));

    return [writeText({ file, content, dryRun })];
  };

const installDevin = ({ entrypoint, dryRun, global }) => {
  const results = [
    writeText({
      file: devinConfigPath(),
      content: upsertJsonServer(readText(devinConfigPath()), commandConfig(entrypoint, { global, agentName: "devin" })),
      dryRun,
    }),
  ];
  // Devin invokes commands as /<name> from ~/.config/devin/skills: one directory
  // per skill, each holding a SKILL.md. The file declares the bare name, the
  // same shape Codex and Copilot CLI read - the slash is the invocation, never
  // the declaration.
  const base = join(HOME, ".config", "devin", "skills");

  for (const { filename, content } of renderAgentCommandFiles("skill")) {
    results.push(writeText({ file: join(base, filename), content, dryRun }));
  }

  return results;
};

export {
  vscodeGlobalDir,
  devinConfigPath,
  junieConfigPath,
  nvimMcpFile,
  emacsInitFile,
  installVscode,
  installJetbrains,
  installNeovim,
  installEmacs,
  createGenericInstaller,
  installDevin,
};
