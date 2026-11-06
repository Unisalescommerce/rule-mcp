/** Each verb names the service of its platform, and an unknown platform has none. */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const fixture = fileURLToPath(new URL("_service-verbs.fixture.mjs", import.meta.url));

/** The four answers under one platform. */
function verbs(platform) {
  const run = spawnSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", fixture, platform], { encoding: "utf8" });

  assert.equal(run.status, 0, run.stderr);

  return JSON.parse(run.stdout);
}

for (const [platform, service] of [
  ["darwin", "launchd"],
  ["linux", "systemd"],
  ["win32", "windows-service"],
]) {
  test(`${platform} answers through ${service}`, () => {
    const answers = verbs(platform);

    for (const answer of Object.values(answers)) {
      assert.equal(answer.service, service);
    }
  });
}

test("an unknown platform has no native service", () => {
  for (const answer of Object.values(verbs("aix"))) {
    assert.deepEqual(answer, { service: "none", action: "no-native-service" });
  }
});
