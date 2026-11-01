/**
@module prompts/client-suppression
 *
 * Which client this server is serving, and whether that client's prompts list
 * should stay empty.
 *
 * A shared `.mcp.json` is one file several clients read, so a switch there cannot
 * say "hide for Claude" without the server knowing whether Claude is the one
 * asking. `RULE_MCP_CLIENT` names the client explicitly; the MCP handshake
 * (`initialize`, which carries `clientInfo.name`) answers it otherwise.
 *
 * `RULE_MCP_NO_MCP_PROMPTS` holds the policy: `1` suppresses for every client, a
 * comma list suppresses only for the names it holds. The older
 * `RULE_MCP_NO_PROMPTS=1` stays the blunt global switch, so an entry written
 * before this existed keeps working.
 */

/** The values that mean "for every client". */
const ALL = new Set(["1", "true", "yes", "all", "*"]);

/**
 * Read the suppression policy.
 *
 * @param {string|undefined} value
 * @returns {{ all: boolean, names: string[] }}
 */
export function parseSuppression(value) {
  const text = typeof value === "string" ? value.trim() : "";

  if (text === "") {
    return { all: false, names: [] };
  }

  if (ALL.has(text.toLowerCase())) {
    return { all: true, names: [] };
  }

  const names = text

    .split(",")

    .map((name) => name.trim().toLowerCase())

    .filter((name) => name !== "");

  // `0` and `false` read as "off", and so does a list that held nothing but
  // separators: a policy with no names suppresses no client.
  const off = names.every((name) => name === "0" || name === "false");

  return off ? { all: false, names: [] } : { all: false, names };
}

/**
 * Who is connected: the environment first, the handshake second.
 *
 * The environment wins because a shared entry can name the client it was written
 * for, while the handshake only knows what the client chose to call itself.
 *
 * @param {{ env?: object, clientVersion?: { name?: string, version?: string } }} [input]
 * @returns {{ name: string|undefined, source: "env"|"handshake"|"unknown" }}
 */
export function clientIdentity({ env = process.env, clientVersion } = {}) {
  const explicit = env?.RULE_MCP_CLIENT?.trim();

  if (explicit) {
    return { name: explicit, source: "env" };
  }

  const name = clientVersion?.name?.trim();

  return name ? { name, source: "handshake" } : { name: undefined, source: "unknown" };
}

/**
 * Whether this client's prompts list should be empty.
 *
 * @param {{ env?: object, clientName?: string }} [input]
 * @returns {boolean}
 */
export function suppressesPrompts({ env = process.env, clientName } = {}) {
  if (env?.RULE_MCP_NO_PROMPTS === "1") {
    return true;
  }

  const policy = parseSuppression(env?.RULE_MCP_NO_MCP_PROMPTS);

  if (policy.all) {
    return true;
  }

  if (!clientName) {
    return false;
  }

  const name = String(clientName).toLowerCase();

  // The handshake sends `name/version` as one string in practice; a list entry
  // matches that whole string or the name before the slash - and stops at a word
  // boundary, so `claude-code` does not swallow a client called `claude-codex`.
  return policy.names.some((entry) => name === entry || name.split("/")[0] === entry || name.startsWith(`${entry}-`) || name.startsWith(`${entry}/`));
}
