/** Project-scope MCP writer: shared portable entry vs local launcher. */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { installProjectHost, uninstallProjectHost, sharedServerConfig } from "../_install-project.js";

const root = mkdtempSync(join(tmpdir(), "rule-mcp-project-"));

test.after(() => rmSync(root, { recursive: true, force: true }));

test("sharedServerConfig is portable: no machine paths", () => {
  const config = sharedServerConfig();

  assert.deepEqual(config, { command: "rule-mcp", args: ["serve"] });
});

test("a shared install writes the project file and reports it for written[]", () => {
  const result = installProjectHost({
    agent: "cursor",
    projectRoot: root,
    projectConfig: "shared",
    dryRun: false,
  });
  const file = join(root, ".cursor", "mcp.json");

  assert.deepEqual(result.written, [file]);
  assert.ok(existsSync(file));
  const json = JSON.parse(readFileSync(file, "utf8"));

  assert.equal(json.mcpServers["rule-mcp"].command, "rule-mcp");
  assert.deepEqual(json.mcpServers["rule-mcp"].args, ["serve"]);
  assert.equal(json.mcpServers["rule-mcp"].env, undefined, "shared carries no machine env");
});

test("vscode shared uses the servers dialect", () => {
  const result = installProjectHost({
    agent: "vscode",
    projectRoot: root,
    projectConfig: "shared",
    dryRun: false,
  });
  const file = join(root, ".vscode", "mcp.json");

  assert.deepEqual(result.written, [file]);
  assert.equal(JSON.parse(readFileSync(file, "utf8")).servers["rule-mcp"].command, "rule-mcp");
});

test("jetbrains shared lands under .junie in the project", () => {
  const result = installProjectHost({
    agent: "jetbrains",
    projectRoot: root,
    projectConfig: "shared",
    dryRun: false,
  });

  assert.deepEqual(result.written, [join(root, ".junie", "mcp", "mcp.json")]);
});

test("local config refuses a host with no local file", () => {
  assert.throws(
    () =>
      installProjectHost({
        agent: "cursor",
        projectRoot: root,
        projectConfig: "local",
        entrypoint: "/tmp/fake-rule-mcp.js",
        dryRun: false,
      }),
    /no local project config: use --project-config shared/,
  );
});

test("a host with no project file is refused", () => {
  assert.throws(
    () =>
      installProjectHost({
        agent: "neovim",
        projectRoot: root,
        projectConfig: "shared",
        dryRun: false,
      }),
    /no project config/,
  );
});

test("uninstall removes the shared entry using the written path", () => {
  const file = join(root, ".cursor", "mcp.json");

  installProjectHost({ agent: "cursor", projectRoot: root, projectConfig: "shared", dryRun: false });
  uninstallProjectHost({ agent: "cursor", projectRoot: root, projectConfig: "shared", written: [file], dryRun: false });

  assert.equal(existsSync(file), false, "an entry that was the whole file takes the file with it");
});
