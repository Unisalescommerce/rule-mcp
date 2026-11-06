/** Guardrail `bundler-sourcemap-policy`: shipping source maps is a recorded decision. */
const CONFIG = /(^|\/)(?:vite|rspack)\.config\.[cm]?[jt]s$/;
const ON = /\bsourcemap\s*:\s*true|\bdevtool\s*:\s*["']source-map["']/;
const DECISION = /\/\/\s*sourcemap:\s*\S|sourcemap:\s*(?:private|internal)/i;

export const bundlerSourcemapPolicy = {
  id: "bundler-sourcemap-policy",
  label: "Source map policy",
  description: "Source maps in a production build expose the source, so turning them on is a decision with a reason.",
  check: (code, context) => {
    if (!CONFIG.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a bundler config, skipping" };
    }

    if (!ON.test(code)) {
      return { pass: true, note: "Source maps are off" };
    }

    const recorded = DECISION.test(code);

    return {
      pass: recorded,
      failCount: recorded ? 0 : 1,
      detail: recorded ? [] : ["source maps are on with no recorded decision"],
      suggestion: "Record why the source maps ship, in a comment such as `// sourcemap: private error tracker only`.",
    };
  },
};
