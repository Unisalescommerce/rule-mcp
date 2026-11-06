import assert from "node:assert/strict";
import test from "node:test";
import { GUARDRAILS } from "../index.js";

const rule = (id) => GUARDRAILS.find((item) => item.id === id);
const VITE = "vite.config.js";
const RSPACK = "rspack.config.mjs";

test("a public prefix on a secret-looking name is reported", () => {
  const result = rule("bundler-no-public-secret").check("const key = import.meta.env.VITE_STRIPE_SECRET;", { fileName: "billing.js" });

  assert.equal(result.pass, false);
  assert.match(result.detail.join(" "), /VITE_STRIPE_SECRET/);
});

test("a public prefix on a harmless name stays silent", () => {
  assert.equal(rule("bundler-no-public-secret").check("const url = import.meta.env.VITE_API_URL;", { fileName: "api.js" }).pass, true);
});

test("code with no environment access is skipped", () => {
  const result = rule("bundler-no-public-secret").check("const total = items.length;", { fileName: "cart.js" });

  assert.equal(result.pass, true);
  assert.match(result.note ?? "", /skipping/i);
});

test("a dev server on every interface is reported", () => {
  const result = rule("bundler-dev-not-exposed").check("export default { server: { host: true } };", { fileName: VITE });

  assert.equal(result.pass, false);
  assert.match(result.detail.join(" "), /host/);
});

test("an all-hosts allowlist is reported too", () => {
  assert.equal(rule("bundler-dev-not-exposed").check("export default { server: { allowedHosts: ['all'] } };", { fileName: VITE }).pass, false);
});

test("a localhost dev server stays silent", () => {
  assert.equal(rule("bundler-dev-not-exposed").check("export default { server: { host: 'localhost' } };", { fileName: VITE }).pass, true);
});

test("a build with no declared target is reported", () => {
  const result = rule("bundler-target-declared").check("export default { build: { outDir: 'dist' } };", { fileName: VITE });

  assert.equal(result.pass, false);
  assert.match(result.detail.join(" "), /target/i);
});

test("a declared target stays silent", () => {
  assert.equal(rule("bundler-target-declared").check("export default { build: { target: 'es2022', outDir: 'dist' } };", { fileName: VITE }).pass, true);
});

test("a build with no entry or output is reported", () => {
  assert.equal(rule("bundler-io-declared").check("export default { plugins: [] };", { fileName: RSPACK }).pass, false);
});

test("a declared entry stays silent", () => {
  assert.equal(rule("bundler-io-declared").check("export default { entry: './src/main.js', output: { path: 'dist' } };", { fileName: RSPACK }).pass, true);
});

test("source maps on with no recorded decision are reported", () => {
  const result = rule("bundler-sourcemap-policy").check("export default { build: { sourcemap: true } };", { fileName: VITE });

  assert.equal(result.pass, false);
  assert.match(result.detail.join(" "), /source ?map/i);
});

test("a recorded source map decision stays silent", () => {
  const code = "// sourcemap: private error tracker only\nexport default { build: { sourcemap: true } };";

  assert.equal(rule("bundler-sourcemap-policy").check(code, { fileName: VITE }).pass, true);
});

test("a config file the family does not cover is skipped", () => {
  const result = rule("bundler-target-declared").check("export default { build: {} };", { fileName: "jest.config.js" });

  assert.equal(result.pass, true);
  assert.match(result.note ?? "", /skipping/i);
});
