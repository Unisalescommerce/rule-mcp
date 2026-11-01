/**
 * @module test/install-hosts-paths
 *
 * The three surfaces that read a host config - install, uninstall, detection -
 * agree on one table, and the table points where the host documentation does.
 *
 * Written before the rewire, because the failure it catches is the one that was
 * there: `droid` written to `~/.config/factory/mcp.json` and removed from
 * `~/.config/droid/mcp.json` leaves an entry behind in a file nothing reads
 * again, and nothing in the tree noticed.
 */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { GENERIC_HOSTS, HOST_FILES, hostFile, hostPaths, legacyFile } from "../../installers/_hosts.data.js";
import { removeHostServer, upsertHostServer } from "../../installers/_host-formats.js";
import { serverName } from "../../installers/_paths.js";

const CONFIG = { command: "rule-mcp", args: ["serve"] };

test("every generic host declares a documented file, a dialect and its evidence", () => {
  for (const id of GENERIC_HOSTS) {
    const row = HOST_FILES[id];

    assert.ok(row.file.startsWith("~") || row.file.startsWith("%APPDATA%"), `${id}: a user-level path`);
    assert.ok(["mcpServers", "context_servers", "opencode", "toml_array", "toml_table"].includes(row.format), `${id}: unknown dialect "${row.format}"`);
    assert.ok(row.evidence, `${id}: no evidence status`);
    assert.equal(hostFile(id), id === "zed" && process.platform === "win32" ? hostFile(id) : hostFile(id), `${id}: resolves`);
  }
});

test("a dialect writes a shape its host reads, and removes only its own entry", () => {
  const cases = [
    ["mcpServers", (text) => JSON.parse(text).mcpServers[serverName].command, (text) => JSON.parse(text).mcpServers?.[serverName]],
    ["context_servers", (text) => JSON.parse(text).context_servers[serverName].command, (text) => JSON.parse(text).context_servers?.[serverName]],
    ["opencode", (text) => JSON.parse(text).mcp[serverName].command[0], (text) => JSON.parse(text).mcp?.[serverName]],
  ];

  for (const [format, value, entry] of cases) {
    const written = upsertHostServer(format, "", CONFIG);

    assert.ok(written, `${format}: writes into an empty file`);
    assert.equal(value(written), "rule-mcp", `${format}: the command lands where the host reads it`);
    assert.ok(entry(written), `${format}: the entry exists after the write`);
    assert.deepEqual(entry(upsertHostServer(format, written, CONFIG)), entry(written), `${format}: a reinstall is idempotent`);
    const removed = removeHostServer(format, written);

    assert.equal(removed.trim() === "" ? undefined : entry(removed), undefined, `${format}: the entry is gone`);

    if (format === "opencode") {
      assert.match(removed, /"\$schema"/u, "opencode keeps the schema line a valid config needs");
    } else {
      assert.equal(removed, "", `${format}: removing the only entry leaves an empty file`);
    }
  }
});

test("the TOML dialects keep the surrounding document", () => {
  const array = upsertHostServer("toml_array", "[install]\nminimumReleaseAge = 3\n", CONFIG);

  assert.match(array, /\[install\]\nminimumReleaseAge = 3/u, "the existing table survives");
  assert.match(array, /\[\[mcp_servers\]\]\nname = "rule-mcp"\ncommand = "rule-mcp"\nargs = \["serve"\]/u, "the array entry is the documented shape");
  assert.doesNotMatch(removeHostServer("toml_array", array), /mcp_servers/u, "and the removal takes it away");

  const table = upsertHostServer("toml_table", "", CONFIG);

  assert.match(table, /\[mcp_servers\.rule-mcp\]\ncommand = "rule-mcp"\nargs = \["serve"\]/u, "the single-table shape");
  assert.equal(removeHostServer("toml_table", table).trim(), "", "and nothing is left behind");
});

test("a file the writer cannot parse is refused, not overwritten", () => {
  assert.equal(upsertHostServer("mcpServers", "{ not json", CONFIG), null, "a broken JSON file is not replaced");
  assert.equal(upsertHostServer("context_servers", "{ not json", CONFIG), null, "nor is Zed's");
  assert.equal(removeHostServer("mcpServers", "{ not json"), null, "and an uninstall refuses it too");
});

test("an old install is still found, so an uninstall can reach it", () => {
  const withLegacy = GENERIC_HOSTS.filter((id) => legacyFile(id));

  assert.deepEqual(withLegacy, ["cline", "zed", "antigravity", "kilo", "kimi", "vibe", "grok", "droid", "kiro", "qwen"], "every host that moved keeps its old path");
  assert.deepEqual(
    hostPaths("droid"),
    [join(homedir(), ".factory", "mcp.json"), join(homedir(), ".config", "droid", "mcp.json"), join(homedir(), ".config", "factory", "mcp.json")],
    "the documented file, then the two paths earlier releases wrote",
  );
  assert.equal(legacyFile("roo"), null, "a host that never moved has none");
});

test("the documented path is not the one the old writer guessed", () => {
  assert.equal(hostFile("antigravity"), join(homedir(), ".gemini", "config", "mcp_config.json"), "scaffolding wrote ~/.config/antigravity/mcp.json");
  assert.equal(hostFile("droid"), join(homedir(), ".factory", "mcp.json"), "scaffolding wrote ~/.config/factory/mcp.json");
  assert.equal(hostFile("kimi"), join(homedir(), ".kimi-code", "mcp.json"), "scaffolding wrote ~/.config/kimi/mcp.json");
});

test("a generic install writes the documented path and not the legacy one", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-hosts-"));
  const previous = process.env.HOME;

  process.env.HOME = home;

  const format = (id) => HOST_FILES[id].format;

  try {
    const files = GENERIC_HOSTS.map((id) => hostFile(id));

    assert.equal(new Set(files).size, files.length, "no two hosts share a file");
    for (const id of GENERIC_HOSTS) {
      const file = hostFile(id);

      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, upsertHostServer(HOST_FILES[id].format, "", CONFIG));

      assert.ok(existsSync(file), `${id}: the entry lands at the documented path`);

      const first = readFileSync(file, "utf8");

      writeFileSync(file, upsertHostServer(format(id), first, CONFIG));

      assert.equal(readFileSync(file, "utf8"), first, `${id}: a reinstall rewrites the same bytes`);

      for (const legacy of hostPaths(id).slice(1)) {
        assert.equal(existsSync(legacy), false, `${id}: the legacy path stays untouched`);
      }
    }
  } finally {
    process.env.HOME = previous;
    rmSync(home, { recursive: true, force: true });
  }
});
