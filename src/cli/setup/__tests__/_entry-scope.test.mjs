/** Setup flags for project-scope installs: --scope, --project, --project-config. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { resolveSetupOptions } from "../_options.js";
import { setupOptions } from "../_entry.js";

/** Flag reader over a fake argv, including repeatable values. */
const io = (argv) => ({
  getArgument: (name) => {
    const index = argv.indexOf(name);

    return index === -1 ? undefined : argv[index + 1];
  },
  getArguments: (name) => {
    const values = [];

    for (let index = 0; index < argv.length; index += 1) {
      if (argv[index] === name && argv[index + 1] !== undefined) {
        values.push(argv[index + 1]);
      }
    }

    return values;
  },
  hasFlag: (name) => argv.includes(name),
});

test("scope defaults to global and projects are empty", () => {
  const parsed = setupOptions("install", io([]));
  const resolved = resolveSetupOptions(parsed);

  assert.equal(parsed.scope, undefined);
  assert.deepEqual(parsed.projects, []);
  assert.equal(resolved.scope, "global");
  assert.deepEqual(resolved.projects, []);
  assert.equal(resolved.projectConfig, "shared");
  assert.equal(resolved.refreshProjects, false);
});

test("--scope project collects repeatable --project paths", () => {
  const parsed = setupOptions("install", io(["--scope", "project", "--project", "/tmp/a", "--project", "/tmp/b", "--project-config", "local"]));
  const resolved = resolveSetupOptions(parsed);

  assert.equal(resolved.scope, "project");
  assert.deepEqual(resolved.projects, ["/tmp/a", "/tmp/b"]);
  assert.equal(resolved.projectConfig, "local");
});

test("--refresh-projects is a boolean flag", () => {
  const resolved = resolveSetupOptions(setupOptions("install", io(["--refresh-projects"])));

  assert.equal(resolved.refreshProjects, true);
});

test("project scope drops global-only extras from the resolved set", () => {
  const resolved = resolveSetupOptions(setupOptions("install", io(["--scope", "project", "--project", "/tmp/a", "--skills", "--service"])));

  assert.equal(resolved.scope, "project");
  assert.ok(!resolved.extras.includes("skills"), "shared project install writes nothing global");
  assert.ok(!resolved.extras.includes("service"), "shared project install writes nothing global");
});
