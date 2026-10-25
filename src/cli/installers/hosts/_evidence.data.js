/**
 * @module cli/installers/hosts/evidence
 *
 * One row per product the 2026-10-25 study measured, before any installer exists
 * for it.
 *
 * The status vocabulary is the study's, and it is deliberately narrow:
 *
 * - `confirmed` - the host documents the mechanism, and this row cites the page.
 *   It means *documented*, never *tested end to end on the installed version*;
 * - `partial` - part of the mechanism is documented, part is inferred;
 * - `needs-test` - the mechanism is named somewhere but nothing pins it down;
 * - `ambiguous` - the name does not identify one product;
 * - `migration` - the host is mid-move and the documented path is the new one;
 * - `plugin-dependent` - the editor has no native surface; the plugin decides;
 * - `research` - not examined. A row that says nothing is honest; a row that
 *   guesses is how a compatibility table starts lying.
 *
 * `installer` says whether `_catalog.js` has a name for this product today. Eight
 * rows are `false`, and their value is that the gap is visible instead of implied
 * by its absence. `conflict` records a claim this tree already makes somewhere
 * else, so Phase 0's second item has one place to resolve it.
 *
 * A row is not a host record: Phase 1 turns these into
 * `src/cli/installers/hosts/<id>.js`, where the files, the levels and the
 * install/uninstall pair live. What stays here is why each row is believed.
 */

/** The status vocabulary, narrowest first. */
export const EVIDENCE_STATUSES = ["confirmed", "partial", "needs-test", "ambiguous", "migration", "plugin-dependent", "research"];

/** A product name that used to mean another product. */
export const HOST_ALIASES = { windsurf: "devin" };

/**
 * @typedef {object} HostEvidence
 * @property {string} id installer id, or the proposed one
 * @property {string} label what a reader recognizes
 * @property {"cli"|"ide"|"hybrid"|"cloud"} kind the surface, not the vendor
 * @property {string} status one of {@link EVIDENCE_STATUSES}
 * @property {string} note the mechanism, in one line
 * @property {string[]} sources the pages the status rests on
 * @property {boolean} installer whether `_catalog.js` names it today
 * @property {string} [conflict] a claim this tree makes elsewhere
 * @property {string} [resolution] what was decided about it, and when
 */

/** @type {HostEvidence[]} */
export const HOST_EVIDENCE = [
  // ── CLI ──
  {
    id: "claude",
    label: "Claude Code",
    kind: "cli",
    status: "confirmed",
    note: "Skills in `.claude/skills/<name>/SKILL.md` and legacy `.claude/commands/*.md`; MCP configured separately, so a skill instructs the agent rather than calling a tool",
    sources: ["https://support.claude.com/en/articles/14554922-claude-code-user-faq"],
    installer: true,
  },
  {
    id: "codex",
    label: "OpenAI Codex CLI",
    kind: "cli",
    status: "confirmed",
    note: "Agent Skills (`$rule-init`) replaced the custom slash prompts upstream; a deterministic run needs the external dispatcher or a bundled script",
    sources: ["https://developers.openai.com/codex/skills", "https://developers.openai.com/codex/cli/slash-commands"],
    installer: true,
    conflict: "ADR 179 writes `~/.codex/prompts/*.md` as a command target; the study records that upstream moved to Skills",
    resolution:
      "Resolved 2026-10-25: the primary target becomes `~/.agents/skills/<name>/SKILL.md`, the user scope the Skills documentation lists, and `~/.codex/prompts/*.md` stays as a documented fallback that still loads as `/prompts:<name>`. ADR 179 amended; the target change is Phase 2 work.",
  },
  {
    id: "copilot",
    label: "GitHub Copilot CLI",
    kind: "cli",
    status: "partial",
    note: "Experimental JavaScript Extensions register real slash commands through `joinSession({ commands })`; Agent Skills are the stable path and plugins also ship commands",
    sources: ["https://docs.github.com/en/copilot/tutorials/create-an-extension", "https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference"],
    installer: true,
  },
  {
    id: "droid",
    label: "Factory Droid",
    kind: "cli",
    status: "confirmed",
    note: "`/commands` manages custom commands, with `/skills`, `/hooks` and `droid mcp` beside it; `droid exec` covers the headless case",
    sources: ["https://docs.factory.com/droid-cli/cli-reference"],
    installer: true,
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    kind: "cli",
    status: "confirmed",
    note: "TOML in `.gemini/commands/<name>.toml` with `/commands reload`; the prompt can direct an MCP call but does not run it",
    sources: ["https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/custom-commands.md"],
    installer: true,
  },
  {
    id: "grok",
    label: "Grok Build",
    kind: "cli",
    status: "ambiguous",
    note: "Grok names a model, a service and a coding client at once; identify the exact client before an adapter is written",
    sources: ["https://x.ai/"],
    installer: true,
  },
  {
    id: "kimi",
    label: "Kimi Code CLI",
    kind: "cli",
    status: "partial",
    note: "Skills are invoked as slash commands and MCP is supported; the skill namespace and its discovery rule need the current reference",
    sources: ["https://www.kimi.com/code/docs/en/kimi-code-cli/reference/slash-commands.html"],
    installer: true,
  },
  {
    id: "kiro",
    label: "Kiro CLI",
    kind: "cli",
    status: "needs-test",
    note: "Commands and MCP need version-specific validation; until then the dispatcher or a skill is the safer surface",
    sources: ["https://kiro.dev/docs/"],
    installer: true,
  },
  {
    id: "opencode",
    label: "OpenCode",
    kind: "cli",
    status: "confirmed",
    note: "`.opencode/commands/*.md` or a command in `opencode.jsonc`; `!` interpolation runs a local command before the prompt reaches the model",
    sources: ["https://opencode.ai/docs/it/commands/"],
    installer: true,
  },
  {
    id: "pi",
    label: "Pi Coding Agent",
    kind: "cli",
    status: "confirmed",
    note: "A TypeScript extension calls `pi.registerCommand` with a handler: the study's clearest deterministic path, and the only one that needs no model decision",
    sources: ["https://pi.dev/docs/latest/extensions"],
    installer: true,
  },
  {
    id: "qwen",
    label: "Qwen Code",
    kind: "cli",
    status: "confirmed",
    note: "`.qwen/commands/*.md` is the recommended form with TOML deprecated; shell mode `!` runs a command directly",
    sources: ["https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/"],
    installer: true,
  },
  {
    id: "vibe",
    label: "Mistral Vibe",
    kind: "cli",
    status: "ambiguous",
    note: "Vibe is an overloaded product name; resolve product and repository before asserting custom-command support",
    sources: ["https://github.com/search?q=vibe+coding+cli&type=repositories"],
    installer: true,
  },

  // ── IDE ──
  {
    id: "emacs",
    label: "Emacs",
    kind: "ide",
    status: "plugin-dependent",
    note: "Depends on the client (gptel, aidermacs, an ACP adapter); an interactive Emacs Lisp command can run the dispatcher",
    sources: ["https://github.com/karthink/gptel"],
    installer: true,
  },
  {
    id: "jetbrains",
    label: "JetBrains AI Assistant",
    kind: "ide",
    status: "confirmed",
    note: "Prompt Library plus an MCP client; the chat slash catalog is not extendable by files, and the MCP entry lives in Junie's config",
    sources: ["https://www.jetbrains.com/help/ai-assistant/chat-mode.html", "https://www.jetbrains.com/junie/"],
    installer: true,
  },
  {
    id: "neovim",
    label: "Neovim",
    kind: "ide",
    status: "plugin-dependent",
    note: "Depends on the plugin (CodeCompanion, avante, an ACP adapter); a Lua user command can run the dispatcher",
    sources: ["https://github.com/olimorris/codecompanion.nvim"],
    installer: true,
  },
  {
    id: "roo",
    label: "Roo Code",
    kind: "ide",
    status: "confirmed",
    note: "`.roo/commands/<name>.md` or `~/.roo/commands/`; the slash invokes a reusable prompt with the MCP tools available to it",
    sources: ["https://roocodeinc.github.io/Roo-Code/features/slash-commands/"],
    installer: true,
    conflict: "`_hook-hosts.js` records the Roo Code extension as shut down in May 2026, which contradicts a `confirmed` row",
    resolution:
      "Resolved 2026-10-25: the documentation is live and describes `.roo/commands/` and `~/.roo/commands/` with `description`, `argument-hint` and `mode` frontmatter, so the row stays `confirmed` and the shutdown claim was corrected in `_hook-hosts.js` to what this tree actually measured - no tool hook documented.",
  },
  {
    id: "vscode",
    label: "VS Code (Copilot Chat)",
    kind: "ide",
    status: "confirmed",
    note: "`.github/prompts/<name>.prompt.md` runs as a slash in a Local harness session; Skills, MCP and lifecycle hooks are supported",
    sources: ["https://code.visualstudio.com/docs/agent-customization/prompt-files"],
    installer: true,
  },
  {
    id: "zed",
    label: "Zed",
    kind: "ide",
    status: "confirmed",
    note: "The agent supports MCP tools and prompts, Skills and ACP external agents; the slash-command extension API is deprecated, so do not build on it",
    sources: ["https://zed.dev/docs/ai/mcp"],
    installer: true,
  },
  {
    id: "cursor",
    label: "Cursor",
    kind: "ide",
    status: "confirmed",
    note: "`.cursor/commands/*.md` defines slash prompts; the CLI is a separate product with its own commands",
    sources: ["https://docs.cursor.com/en/agent/chat/commands"],
    installer: true,
  },
  {
    id: "continue",
    label: "Continue",
    kind: "hybrid",
    status: "research",
    note: "VS Code and JetBrains extension plus headless tooling; the prompt, rules and MCP integration is unexamined",
    sources: ["https://docs.continue.dev/"],
    installer: false,
  },
  {
    id: "junie",
    label: "Junie",
    kind: "ide",
    status: "research",
    note: "JetBrains agent with IDE-native workflows and an MCP surface; it owns `~/.junie/mcp/mcp.json`, the file the JetBrains installer writes",
    sources: ["https://www.jetbrains.com/junie/"],
    installer: false,
  },
  {
    id: "trae",
    label: "Trae",
    kind: "ide",
    status: "research",
    note: "Workflow extensibility and MCP are unexamined; no documented command surface was found",
    sources: ["https://www.trae.ai/"],
    installer: false,
  },

  // ── Hybrid and cloud ──
  {
    id: "cline",
    label: "Cline",
    kind: "hybrid",
    status: "confirmed",
    note: "VS Code, JetBrains, desktop and CLI; `.clinerules/workflows/*.md` plus Skills as `/skill-name`, with MCP supported",
    sources: ["https://github.com/cline/cline/blob/main/docs/core-workflows/using-commands.mdx"],
    installer: true,
  },
  {
    id: "antigravity",
    label: "Google Antigravity",
    kind: "hybrid",
    status: "migration",
    note: "App and CLI expose slash commands; the legacy workflow system stopped working on 2026-10-19 and the documented path is Skills",
    sources: ["https://www.antigravity.google/docs/ide/workflows/"],
    installer: true,
  },
  {
    id: "kilo",
    label: "Kilo Code",
    kind: "hybrid",
    status: "partial",
    note: "VS Code, JetBrains and CLI; modes, rules and MCP are documented, the slash-command storage API is not",
    sources: ["https://kilo.ai/docs"],
    installer: true,
  },
  {
    id: "devin",
    label: "Devin",
    kind: "cloud",
    status: "needs-test",
    note: "Playbooks, integrations and MCP; no custom-slash extensibility was established, and `windsurf` is the deprecated name for this row",
    sources: ["https://docs.devin.ai/", "https://docs.windsurf.com/windsurf/cascade/workflows"],
    installer: true,
  },
  {
    id: "openhands",
    label: "OpenHands",
    kind: "cloud",
    status: "research",
    note: "Agent SDK, cloud and local platform: the integration target is API orchestration, not a slash UI",
    sources: ["https://docs.all-hands.dev/"],
    installer: false,
  },

  // ── CLI, measured, without an installer row ──
  {
    id: "aider",
    label: "Aider",
    kind: "cli",
    status: "research",
    note: "Commands, scripted automation and integrations exist; extension feasibility is unexamined",
    sources: ["https://aider.chat/docs/"],
    installer: false,
  },
  {
    id: "amp",
    label: "Amp",
    kind: "cli",
    status: "research",
    note: "CLI agent; workflows, skills and the command surface are unexamined",
    sources: ["https://ampcode.com/"],
    installer: false,
  },
  {
    id: "cursor-cli",
    label: "Cursor CLI",
    kind: "cli",
    status: "confirmed",
    note: "The terminal `agent` has native slash commands and reads different files from the Cursor IDE, so it is its own row",
    sources: ["https://prod.cursor.com/docs/cli/reference/slash-commands"],
    installer: false,
  },
  {
    id: "goose",
    label: "Goose",
    kind: "cli",
    status: "research",
    note: "Open-source agent with extensions and MCP; custom recipes and CLI orchestration are unexamined",
    sources: ["https://block.github.io/goose/"],
    installer: false,
  },
];

/** One row by id, following {@link HOST_ALIASES}, or null. */
export function evidenceOf(id) {
  const resolved = HOST_ALIASES[id] ?? id;

  return HOST_EVIDENCE.find((row) => row.id === resolved) ?? null;
}

/** The rows with no installer behind them, so the gap is a list and not an absence. */
export function hostsWithoutInstaller() {
  return HOST_EVIDENCE.filter((row) => !row.installer);
}

/** The rows that carried a contradiction and now say how it was closed. */
export function resolvedConflicts() {
  return HOST_EVIDENCE.filter((row) => row.conflict && row.resolution);
}

/** The rows that claim a documented mechanism without a page behind it. */
export function unbackedClaims() {
  return HOST_EVIDENCE.filter((row) => row.status === "confirmed" && row.sources.every((url) => !url.startsWith("https://")));
}
