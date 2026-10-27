/** @module cli/install/hook-writers - one hook document per documented host */

import { HOOK_MARKER } from "../../core/agents/_hook-commands.js";

/** @param {{ command: string, args?: string[] }|string} launcher @returns {{ command: string, args?: string[] }} */
const normalized = (launcher) => (typeof launcher === "string" ? { command: launcher } : launcher);

/**
 * The shell line a native host runs: the guard subcommand plus the marker that
 * merge and uninstall look for.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @param {string} subcommand
 * @returns {string}
 */
export function guardCommand(launcher, subcommand) {
  const { command, args = [] } = normalized(launcher);
  // `--send` talks to the warm guard daemon (ADR 188). Install starts the daemon
  // when hooks are written; a missing daemon fails the hook loudly instead of
  // silently paying a full CLI spawn again.
  const line = [command, ...args, "guard", "--send", subcommand]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(" ");

  return `${line}  # ${HOOK_MARKER}`;
}

/**
 * Titles Codex `/hooks` shows for each handler.
 *
 * Codex paints `statusMessage` as the row title and falls back to
 * "Unnamed hook" when it is missing (codex#51433).
 */
const CODEX_STATUS = {
  bash: "rule-mcp: guard bash",
  structure: "rule-mcp: guard structure",
  write: "rule-mcp: guard write",
  "session-start": "rule-mcp: session start",
  "prompt-submit": "rule-mcp: prompt submit",
};

/**
 * Codex and Gemini group hooks the same way: a matcher, then the handlers that
 * run when it matches.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @param {string} subcommand
 * @param {string} [matcher]
 * @param {{ statusMessage?: string }} [options]
 * @returns {{ matcher?: string, hooks: Array<{ type: string, command: string, statusMessage?: string }> }}
 */
const grouped = (launcher, subcommand, matcher, options = {}) => ({
  ...(matcher ? { matcher } : {}),
  hooks: [
    {
      type: "command",
      command: guardCommand(launcher, subcommand),
      ...(options.statusMessage ? { statusMessage: options.statusMessage } : {}),
    },
  ],
});

/**
 * Cursor reads `hooks.json` at the project (`.cursor/hooks.json`) or user
 * (`~/.cursor/hooks.json`) level. Events are camelCase and each hook is a flat
 * `{ command, matcher }`; the matcher filters by tool type (`Shell`, `Write`).
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @returns {object}
 */
export function cursorHooks(launcher) {
  const hook = (subcommand, matcher) => ({ ...(matcher ? { matcher } : {}), command: guardCommand(launcher, subcommand) });

  return {
    version: 1,
    hooks: {
      preToolUse: [hook("bash", "Shell"), hook("structure", "Write")],
      postToolUse: [hook("write", "Write")],
      sessionStart: [hook("session-start")],
      beforeSubmitPrompt: [hook("prompt-submit")],
    },
  };
}

/**
 * Kiro stores standalone hooks in `.kiro/hooks/<id>.json` (workspace) or
 * `~/.kiro/hooks/*.json` (CLI V3, every workspace). Triggers are PascalCase and
 * a command action runs in the project root.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @returns {object}
 */
export function kiroHooks(launcher) {
  const hook = (name, trigger, subcommand, matcher) => ({
    name,
    trigger,
    ...(matcher ? { matcher } : {}),
    action: { type: "command", command: guardCommand(launcher, subcommand) },
    timeout: 60,
    enabled: true,
  });

  return {
    version: "v1",
    hooks: [
      hook("rule-mcp-bash-guard", "PreToolUse", "bash", "shell"),
      hook("rule-mcp-structure-guard", "PreToolUse", "structure", "write"),
      hook("rule-mcp-write-report", "PostToolUse", "write", "write"),
      hook("rule-mcp-session-start", "SessionStart", "session-start"),
      hook("rule-mcp-prompt-submit", "UserPromptSubmit", "prompt-submit"),
    ],
  };
}

/**
 * The Gemini CLI `hooks` object for settings.json. `BeforeTool` and `AfterTool`
 * take matcher groups, each with command handlers.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @returns {object}
 */
export function geminiHooks(launcher) {
  return {
    BeforeTool: [grouped(launcher, "bash", ".*"), grouped(launcher, "structure", ".*")],
    AfterTool: [grouped(launcher, "write", ".*")],
  };
}

/**
 * One Codex matcher group with a titled command handler.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @param {string} subcommand
 * @param {string} [matcher]
 * @returns {{ matcher?: string, hooks: Array<{ type: string, command: string, statusMessage: string }> }}
 */
/**
 * Codex command line: tag the process so ask->block encoding works even when
 * stdin is empty or unparseable (no `turn_id` to detect the host).
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @param {string} subcommand
 * @returns {string}
 */
const codexGuardCommand = (launcher, subcommand) => `env RULE_MCP_HOOK_HOST=codex ${guardCommand(launcher, subcommand)}`;

const codexGrouped = (launcher, subcommand, matcher) => ({
  ...(matcher ? { matcher } : {}),
  hooks: [
    {
      type: "command",
      command: codexGuardCommand(launcher, subcommand),
      statusMessage: CODEX_STATUS[subcommand] ?? `rule-mcp: ${subcommand}`,
    },
  ],
});

/**
 * The Codex `hooks.json` document. Codex nests events under `hooks`, and a
 * non-managed hook only runs after the user trusts it with `/hooks`. Each
 * handler carries `statusMessage` so the browser shows a name instead of
 * "Unnamed hook".
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @returns {object}
 */
export function codexHooks(launcher) {
  return {
    hooks: {
      PreToolUse: [codexGrouped(launcher, "bash", "Bash"), codexGrouped(launcher, "structure", "apply_patch|Edit|Write")],
      PostToolUse: [codexGrouped(launcher, "write", "apply_patch|Edit|Write")],
      SessionStart: [codexGrouped(launcher, "session-start")],
      UserPromptSubmit: [codexGrouped(launcher, "prompt-submit")],
    },
  };
}

/**
 * An OpenCode plugin that runs the guard before and after a tool call.
 *
 * OpenCode plugins are in-process modules, not hook files, so the guard runs as
 * a child process and its output is captured rather than mapped to a plugin
 * decision: the return contract is host-specific and is not wired yet.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @returns {string}
 */
export function opencodePlugin(launcher) {
  const { command, args = [] } = normalized(launcher);

  return [
    'import { spawnSync } from "node:child_process";',
    "",
    `const GUARD = ${JSON.stringify([command, ...args, "guard"])};`,
    'const WRITE = new Set(["write", "edit", "multiedit", "apply_patch"]);',
    "",
    "const run = (kind, payload) =>",
    "  spawnSync(GUARD[0], [...GUARD.slice(1), \"--send\", kind], { input: JSON.stringify(payload ?? {}) });",
    "",
    "export const RuleMcpHooks = async () => ({",
    '  "tool.execute.before": async (input) => run(WRITE.has(String(input?.tool ?? "").toLowerCase()) ? "structure" : "bash", input),',
    '  "tool.execute.after": async (input) => run("write", input),',
    "});",
    "",
  ].join("\n");
}

/**
 * A Pi extension that registers the two tool events.
 *
 * Like the OpenCode plugin, it invokes the guard as a child process; mapping the
 * guard's answer to a Pi decision is left to the host contract.
 *
 * @param {{ command: string, args?: string[] }|string} launcher
 * @returns {string}
 */
export function piExtension(launcher) {
  const { command, args = [] } = normalized(launcher);

  return [
    "export default function ruleMcpHooks(pi) {",
    `  pi.on("tool_call", async (event) => { await pi.exec(${JSON.stringify(command)}, ${JSON.stringify([...args, "guard", "--send", "bash"])}); });`,
    `  pi.on("tool_result", async (event) => { await pi.exec(${JSON.stringify(command)}, ${JSON.stringify([...args, "guard", "--send", "write"])}); });`,
    "}",
    "",
  ].join("\n");
}
