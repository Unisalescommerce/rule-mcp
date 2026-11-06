/** Guardrail `bundler-target-declared`: the browser target is a decision, not a default. */
const CONFIG = /(^|\/)(?:vite|rspack)\.config\.[cm]?[jt]s$/;

/** The rule `rule-toolchain` owns: a bundler config names its browser target. */
export const bundlerTargetDeclared = {
  id: "bundler-target-declared",
  label: "Browser target declared",
  description: "A build names the browsers it must run in, so the default does not decide silently.",
  check: (code, context) => {
    if (!CONFIG.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a bundler config, skipping" };
    }

    const declared = /\btarget\s*:|\bbrowserslist\b|\bbuild\s*:\s*\{[^}]*\btarget\s*:/.test(code);

    return {
      pass: declared,
      failCount: declared ? 0 : 1,
      detail: declared ? [] : ["no browser target declared"],
      suggestion: "Declare the target in the bundler config, or in a browserslist field, so the supported browsers are a written decision.",
    };
  },
};
