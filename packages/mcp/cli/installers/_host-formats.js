/**
 * @module cli/installers/host-formats
 *
 * One writer per dialect, behind two functions: `upsertHostServer` and
 * `removeHostServer`.
 *
 * The signatures are the point. A caller hands over the dialect, the text it
 * read and the server config, and gets back the text to write - no path, no
 * format knowledge, no branch on the host name. That is what lets the install,
 * the uninstall and the detection share one table (`_hosts.data.js`) instead of
 * three opinions about where a host keeps its servers.
 *
 * A writer returns `null` when the text it was given cannot be parsed. The
 * caller treats that as a refusal rather than overwriting a file it does not
 * understand.
 */

import { serverName } from "./_paths.js";
import { parseJson, removeJsonServer, removeVscodeServer, toJson, upsertJsonServer, upsertVscode } from "./_writers-json.js";
import { removeTomlBlock, upsertTomlBlock } from "./_writers-text.js";
import { removeOpencode, upsertOpencode } from "./_writers-opencode.js";

/** Zed's `context_servers`: `command` is a string and sits beside `args`. */
function upsertContextServer(current, config) {
  const json = current.trim() ? parseJson(current) : {};

  if (json === null) {
    return null;
  }

  json.context_servers = json.context_servers ?? {};

  json.context_servers[serverName] = config.url
    ? { url: config.url, ...(config.headers && { headers: config.headers }) }
    : { command: config.command, args: config.args ?? [], ...(config.env && { env: config.env }) };

  return toJson(json);
}

function removeContextServer(current) {
  const json = parseJson(current);

  if (json === null) {
    return null;
  }

  if (json.context_servers?.[serverName]) {
    delete json.context_servers[serverName];

    if (Object.keys(json.context_servers).length === 0) {
      delete json.context_servers;
    }
  }

  return Object.keys(json).length > 0 ? toJson(json) : "";
}

/** A TOML value: a quoted string, a list of quoted strings, or a raw one. */
const tomlValue = (value) => (Array.isArray(value) ? `[${value.map((item) => JSON.stringify(item)).join(", ")}]` : JSON.stringify(String(value)));

/** The keys of a TOML server block, in a stable order. */
function tomlKeys(config) {
  const keys = [`command = ${tomlValue(config.command)}`, `args = ${tomlValue(config.args ?? [])}`];

  if (config.url) {
    return [`url = ${tomlValue(config.url)}`];
  }

  return keys;
}

/** `[[mcp_servers]]` with a `name` key: the array-of-tables dialect. */
function upsertTomlArray(current, config) {
  const block = [`name = ${tomlValue(serverName)}`, ...tomlKeys(config)].join("\n");
  const without = removeTomlArray(current);

  return `${without.trimEnd()}${without.trim() === "" ? "" : "\n\n"}[[mcp_servers]]\n${block}\n`;
}

function removeTomlArray(current) {
  const blocks = current.split(/(?=\[\[mcp_servers\]\])/u);

  return blocks
    .filter((block) => !(block.startsWith("[[mcp_servers]]") && new RegExp(`^name = ${JSON.stringify(serverName)}`, "mu").test(block)))
    .join("")
    .replaceAll(/\n{3,}/gu, "\n\n");
}

/**
 * Write one server into a host's config.
 *
 * @param {string} format one of the `format` values in `_hosts.data.js`
 * @param {string} current the text read from the file
 * @param {{ command?: string, args?: string[], env?: object, url?: string, headers?: object }} config
 * @returns {string|null} the text to write, or null when the text cannot be read
 */
export function upsertHostServer(format, current, config) {
  switch (format) {
    case "context_servers": {
      return upsertContextServer(current, config);
    }
    case "toml_array": {
      return upsertTomlArray(current, config);
    }
    case "toml_table": {
      return upsertTomlBlock(current, `mcp_servers.${serverName}`, tomlKeys(config).join("\n"));
    }
    case "opencode": {
      // opencode's schema is `additionalProperties: false`, so the entry is
      // rebuilt by its own writer rather than merged like an `mcpServers` one.
      return upsertOpencode(current, config);
    }
    case "servers": {
      return upsertVscode(current, config);
    }
    default: {
      return upsertJsonServer(current, config);
    }
  }
}

/**
 * Remove the server from a host's config, leaving everything else in place.
 *
 * @param {string} format one of the `format` values in `_hosts.data.js`
 * @param {string} current
 * @returns {string|null} the text to write, or null when the text cannot be read
 */
export function removeHostServer(format, current) {
  switch (format) {
    case "context_servers": {
      return removeContextServer(current);
    }
    case "toml_array": {
      return removeTomlArray(current);
    }
    case "toml_table": {
      return removeTomlBlock(current, `mcp_servers.${serverName}`);
    }
    case "opencode": {
      return removeOpencode(current);
    }
    case "servers": {
      return removeVscodeServer(current);
    }
    default: {
      return removeJsonServer(current);
    }
  }
}
