/** Guardrail `bundler-io-declared`: the entry and the output are written down. */
const CONFIG = /(^|\/)(?:vite|rspack)\.config\.[cm]?[jt]s$/;

/** The rule `rule-toolchain` owns: a bundler config names its entry and output. */
export const bundlerIoDeclared = {
  id: "bundler-io-declared",
  label: "Entry and output declared",
  description: "A build states where it starts and where it writes, so the result does not depend on a convention nobody wrote.",
  check: (code, context) => {
    if (!CONFIG.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a bundler config, skipping" };
    }

    const declared = /\binput\s*:|\bentry\s*:|\boutDir\s*:|\boutput\s*:/.test(code);

    return {
      pass: declared,
      failCount: declared ? 0 : 1,
      detail: declared ? [] : ["no entry or output declared"],
      suggestion: "Name the entry and the output directory in the bundler config.",
    };
  },
};
