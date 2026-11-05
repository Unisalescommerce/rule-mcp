/** Require axe coverage for browser tests, not server-side Node tests. */
export const a11yTestRequired = {
  id: "a11y-test-required",
  label: "Playwright + axe-core a11y tests",
  description: "Browser tests require Playwright, AxeBuilder and a violation assertion.",
  check: (code, context) => {
    const { maskLiterals } = context.helpers;
    const isTestFile = context?.fileName?.includes(".spec.") || context?.fileName?.includes(".test.") || context?.mode === "test";
    const hasAxeImport = /^\s*import\s+[^;\n]+\s+from\s+['"]@axe-core\/playwright['"]/m.test(code);
    const hasPlaywright = /^\s*import\s+[^;\n]+\s+from\s+['"]@playwright\/test['"]/m.test(code);
    const hasAxeBuilder = /AxeBuilder/.test(code);
    const hasViolationCheck = /\.violations\s*\.toEqual/.test(code) || /expect\(.*\.violations\)/.test(code);
    const codeOnly = maskLiterals(code)
      .replaceAll(/\/\*[\s\S]*?\*\//g, "")
      .replaceAll(/(?:^|[^:])\/\/.*$/gm, "");
    const hasPlaywrightConfig = /playwright\.config/.test(codeOnly);
    const looksLikeUi = context?.isComponent === true || /<[A-Za-z][^>]*>/.test(codeOnly) || /\.(jsx|tsx|vue|svelte)$/.test(context?.fileName ?? "");
    const isNodeTest = /^\s*import\s+[^;\n]+\s+from\s+["']node:test["']/m.test(code);

    if (isNodeTest && !looksLikeUi && !hasPlaywright && !hasAxeImport && !hasPlaywrightConfig) {
      return { pass: true, note: "Node test without a UI surface, skipping" };
    }

    if (!isTestFile && !looksLikeUi && !hasPlaywrightConfig) {
      return { pass: true, note: "No UI surface in this file, skipping" };
    }

    const details = [];

    if (!hasPlaywright && !isTestFile) {
      details.push("No @playwright/test import");
    }

    if (!hasAxeImport) {
      details.push("No @axe-core/playwright import");
    }

    if (!hasAxeBuilder) {
      details.push("No AxeBuilder usage");
    }

    if (!hasViolationCheck) {
      details.push("No violation assertion (expect(results.violations).toEqual([]))");
    }

    if (context?.mode === "scaffold" || context?.fileName === "playwright.config.js") {
      const isConfigValid = hasPlaywrightConfig || (hasPlaywright && hasAxeImport);

      return {
        pass: isConfigValid,
        failCount: isConfigValid ? 0 : 1,
        detail: ["Missing playwright.config.js or @axe-core/playwright dependency"],
        suggestion: "Create playwright.config.js and install: pnpm install --save-dev playwright @axe-core/playwright",
      };
    }

    if (isTestFile || hasPlaywright || hasAxeImport) {
      const failCount = details.length;

      return {
        pass: failCount === 0,
        failCount,
        detail: details,
        suggestion: failCount === 0 ? "" : "Import AxeBuilder, run an axe scan and assert that violations are empty.",
      };
    }

    return { pass: true, note: "Not a test file, skipping a11y test check" };
  },
};
