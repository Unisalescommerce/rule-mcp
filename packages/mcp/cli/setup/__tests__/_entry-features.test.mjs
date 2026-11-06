/** Setup entry parses --feature and --adr-policy. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { resolveSetupOptions } from "../_options.js";
import { setupOptions } from "../_entry.js";

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

test("--feature is repeatable and --adr-policy is a string", () => {
  const resolved = resolveSetupOptions(setupOptions("install", io(["--feature", "telemetry=anonymous", "--feature", "adr=off", "--adr-policy", "full"])));

  assert.deepEqual(resolved.features, ["telemetry=anonymous", "adr=off"]);
  assert.equal(resolved.adrPolicy, "full");
});
