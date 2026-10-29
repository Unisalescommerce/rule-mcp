/** @module core/guardrails/file-tree/barrel-exports-match-files */

export const barrelExportsMatchFiles = {
  id: "barrel-exports-match-files",
  label: "Barrel exports match actual component files",
  description: "The barrel file's export statements must reference existing component files with the correct _PascalCase names.",
  check: (code, context) => {
    const fileName = context?.fileName || "";

    if (!/^index\.(js|ts|jsx|tsx)$/.test(fileName)) {
      return { pass: true, note: "Not a barrel file, skipping" };
    }

    const exports = [...code.matchAll(/export\s+\{\s*(\w+)\s*\}\s+from\s+['"]\.\/([^'"]+)['"]/g)];

    if (exports.length === 0) {
      return { pass: true, note: "No named exports with relative paths found, skipping" };
    }

    const violations = [];

    for (const [, exportedName, sourcePath] of exports) {
      // A well-formed barrel re-exports a component: `export { Button } from
      // "./_Button.js"`. A Node barrel re-exports functions, whose names are
      // camelCase by convention - `landPendingAdrs` from `_land.js` is correct
      // there, and the PascalCase half of this rule exists for components. A
      // camelCase name is skipped rather than excused: the underscore rule
      // still applies to it below.
      if (!/^[A-Z]/.test(exportedName)) {
        const sourceBase = sourcePath.replace(/\.[a-z]+$/, "");

        if (!sourceBase.startsWith("_")) {
          violations.push(`Export "${exportedName}" references "${sourcePath}" which does not start with underscore prefix`);
        }

        continue;
      }

      // Check that the source path starts with _ and matches PascalCase
      const sourceBase = sourcePath.replace(/\.[a-z]+$/, "");

      if (!sourceBase.startsWith("_")) {
        violations.push(`Export "${exportedName}" references "${sourcePath}" which does not start with underscore prefix`);
      }

      if (!/^_[A-Z]/.test(sourceBase)) {
        violations.push(`Export "${exportedName}" references "${sourcePath}" which is not PascalCase`);
      }
      // Check that the exported name matches the file name
      const expectedFile = `_${exportedName}`;

      if (sourceBase !== expectedFile) {
        violations.push(`Export "${exportedName}" should reference "./${expectedFile}" but got "${sourcePath}"`);
      }
    }

    if (violations.length === 0) {
      return { pass: true, note: "All barrel exports match conventions" };
    }

    return {
      pass: false,
      failCount: violations.length,
      detail: violations.slice(0, 10),
      suggestion: "Fix each export to use: export { PascalName } from './_PascalName.ext';",
    };
  },
};
