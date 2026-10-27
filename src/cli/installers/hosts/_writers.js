/**
 * @module cli/installers/hosts/writers
 *
 * The install and uninstall functions for every catalog host. Bodies stay in
 * `_agents-*.js` and `_uninstall-*.js`; this module is the table the host
 * record looks up, so `_registry.js` / `_uninstall.js` stop carrying a second
 * map of the same 23 names.
 */

import { installClaude, installCodex, installCursor, installCopilot, installGemini, installPi } from "../_agents-cli.js";
import { installOpencode, uninstallOpencode } from "../_agents-opencode.js";
import {
  installVscode,
  installJetbrains,
  installNeovim,
  installEmacs,
  installDevin,
  createGenericInstaller,
} from "../_agents-ide.js";
import { uninstallClaude, uninstallCodex, uninstallCursor, uninstallCopilot, uninstallGemini, uninstallPi } from "../_uninstall-clis.js";
import {
  uninstallDevin,
  uninstallEmacs,
  uninstallGeneric,
  uninstallJetbrains,
  uninstallNeovim,
  uninstallVscode,
} from "../_uninstall-hosts.js";
import { GENERIC_HOSTS } from "../_hosts.data.js";

const DEDICATED = {
  claude: { install: installClaude, uninstall: uninstallClaude },
  codex: { install: installCodex, uninstall: uninstallCodex },
  cursor: { install: installCursor, uninstall: uninstallCursor },
  copilot: { install: installCopilot, uninstall: uninstallCopilot },
  gemini: { install: installGemini, uninstall: uninstallGemini },
  pi: { install: installPi, uninstall: uninstallPi },
  opencode: { install: installOpencode, uninstall: uninstallOpencode },
  vscode: { install: installVscode, uninstall: uninstallVscode },
  jetbrains: { install: installJetbrains, uninstall: uninstallJetbrains },
  neovim: { install: installNeovim, uninstall: uninstallNeovim },
  emacs: { install: installEmacs, uninstall: uninstallEmacs },
  devin: { install: installDevin, uninstall: uninstallDevin },
};

const GENERIC = Object.fromEntries(
  GENERIC_HOSTS.map((id) => [id, { install: createGenericInstaller(id), uninstall: uninstallGeneric(id) }]),
);

/** @type {Record<string, { install: Function, uninstall: Function }> } */
const WRITERS = { ...DEDICATED, ...GENERIC };

/**
 * The install/uninstall pair for one host, or null when the catalog has none.
 *
 * @param {string} id
 * @returns {{ install: Function, uninstall: Function }|null}
 */
export function writerPair(id) {
  return WRITERS[id] ?? null;
}

export { WRITERS };
