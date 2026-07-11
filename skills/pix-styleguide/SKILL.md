---
name: rule-styleguide
description: >
  Central index of all |rule coding style guides. Delegates to specialized
  sub-skills: HTML semantics, CSS architecture, JavaScript conventions,
  JSON structure, Markdown documentation, a11y, naming, and patterns.
tags:
  - "styleguide"
  - "index"
  - "html"
  - "css"
  - "javascript"
  - "a11y"
  - "naming"
  - "conventions"
frameworks: [all]
---

# rule-styleguide — Style Guides Index

This is the umbrella index for all coding style guides.
Each guide lives in its own dedicated skill below.

## Available Guides

| Skill | Covers | Use When |
|-------|--------|----------|
| [rule-styleguide-html](../rule-styleguide-html/SKILL.md) | Semantic HTML, document structure, template syntax | Writing HTML templates or components |
| [rule-styleguide-css](../rule-styleguide-css/SKILL.md) | Data-part selectors, custom properties, cascade layers | Styling any component |
| [rule-styleguide-javascript](../rule-styleguide-javascript/SKILL.md) | Naming, functions, classes, async, imports | Writing JS/TS modules |
| [rule-styleguide-json](../rule-styleguide-json/SKILL.md) | Structure, property naming, date formats | Defining API contracts or configs |
| [rule-styleguide-markdown](../rule-styleguide-markdown/SKILL.md) | Headings, lists, code blocks, formatting | Writing documentation |
| [rule-styleguide-a11y](../rule-styleguide-a11y/SKILL.md) | WCAG 2.2 AA, ARIA, Playwright + axe-core | Every PR — mandatory |
| [rule-styleguide-naming](../rule-styleguide-naming/SKILL.md) | PascalCase, barrel pattern, underscore prefix | Creating new files or folders |
| [rule-styleguide-patterns](../rule-styleguide-patterns/SKILL.md) | Quick reference cheat sheet | Daily reference during development |
| [rule-styleguide-validation](../rule-styleguide-validation/SKILL.md) | International business validation | Form/API validation rules |

## Guardrails

Run `pix_check skill=rule-styleguide code="..."` to validate code.

Key shared guardrails enforced across all styleguides:
- **no-css-classes**: Zero `.class` selectors — use element + `[data-part]` only
- **no-inline-styles**: Zero `style="..."` attributes
- **semantic-html**: Zero `<div>` where semantic element exists
- **external-css**: CSS via `adoptedStyleSheets` or framework-native import
- **barrel-file-tree**: Every folder has `index.js` barrel
- **file-naming**: `_PascalCase.ext` for components
- **data-part-naming**: Child elements use `data-part="role"`
- **jsdoc-required**: JSDoc on every exported symbol
- **a11y-test-required**: Playwright + axe-core a11y tests

## See also

- [rule-styleguide-validation](../rule-styleguide-validation/SKILL.md) — Business validation
- [rule-toolchain-project](../rule-toolchain-project/SKILL.md) — Project config files
- [rule](../rule/SKILL.md) — Central skill index
