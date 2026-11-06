/**
 * Labeled pairs for the bundler family rules.
 *
 * `guardrail-corpus.mjs` is at its size ceiling, so the pairs for the five
 * rules `rule-toolchain` owns live here and the accuracy fixture reads both.
 * Each entry is judged on its target rule alone.
 */

const TOOLCHAIN = "rule-toolchain";
const VITE = "vite.config.js";
const RSPACK = "rspack.config.mjs";

/** @type {Array<{rule: string, skill: string, label: "good"|"bad", fileName?: string, why: string, code: string}>} */
export const BUNDLER_CORPUS = [
  {
    rule: "bundler-no-public-secret",
    skill: TOOLCHAIN,
    label: "bad",
    fileName: "billing.js",
    why: "a public prefix on a name that is a secret ships the secret to the browser",
    code: "export const key = import.meta.env.VITE_STRIPE_SECRET_KEY;\n",
  },
  {
    rule: "bundler-no-public-secret",
    skill: TOOLCHAIN,
    label: "good",
    fileName: "api.js",
    why: "a public prefix on a harmless value is what the prefix is for",
    code: "export const base = import.meta.env.VITE_API_URL;\n",
  },
  {
    rule: "bundler-dev-not-exposed",
    skill: TOOLCHAIN,
    label: "bad",
    fileName: VITE,
    why: "host true binds every interface",
    code: "export default { server: { host: true } };\n",
  },
  {
    rule: "bundler-dev-not-exposed",
    skill: TOOLCHAIN,
    label: "good",
    fileName: VITE,
    why: "a named host keeps the server on the machine",
    code: "export default { server: { host: 'localhost' } };\n",
  },
  {
    rule: "bundler-target-declared",
    skill: TOOLCHAIN,
    label: "bad",
    fileName: VITE,
    why: "no target leaves the supported browsers to a default",
    code: "export default { build: { outDir: 'dist' } };\n",
  },
  {
    rule: "bundler-target-declared",
    skill: TOOLCHAIN,
    label: "good",
    fileName: VITE,
    why: "a written target is the decision",
    code: "export default { build: { target: 'es2022', outDir: 'dist' } };\n",
  },
  {
    rule: "bundler-io-declared",
    skill: TOOLCHAIN,
    label: "bad",
    fileName: RSPACK,
    why: "a config with no entry or output depends on a convention nobody wrote",
    code: "export default { plugins: [] };\n",
  },
  {
    rule: "bundler-io-declared",
    skill: TOOLCHAIN,
    label: "good",
    fileName: RSPACK,
    why: "the entry and the output are named",
    code: "export default { entry: './src/main.js', output: { path: 'dist' } };\n",
  },
  {
    rule: "bundler-sourcemap-policy",
    skill: TOOLCHAIN,
    label: "bad",
    fileName: VITE,
    why: "shipping source maps with no reason publishes the source",
    code: "export default { build: { sourcemap: true } };\n",
  },
  {
    rule: "bundler-sourcemap-policy",
    skill: TOOLCHAIN,
    label: "good",
    fileName: VITE,
    why: "the comment records why the maps ship",
    code: "// sourcemap: private error tracker only\nexport default { build: { sourcemap: true } };\n",
  },
];
