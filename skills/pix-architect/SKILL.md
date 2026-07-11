---
name: rule-architect
description: >
  Enterprise architecture wizard for the full rule skill and MCP tool ecosystem.
  Use when starting a project, restructuring architecture, generating .context,
  mapping decisions to skills/tools, or onboarding any LLM to a repository.
tags:
  - architecture
  - scaffolding
  - sdd
  - context
  - interview
  - adr
  - tool-routing
frameworks: [all]
---

# rule-architect — Architecture command center

`rule-architect` turns product intent into an implementation-ready architecture package. It must account for every available rule skill and deterministic MCP tool, then emit `.context/` docs that any LLM can follow without hidden assumptions.

## Operating principles

1. **Single source of routing truth** — Start from [`rule`](../rule/SKILL.md), then map every architecture choice to exact skills and tools.
2. **Spec-driven by default** — Generate product, domain, architecture, quality, deployment, security, ADR, and rule-routing specs.
3. **SOLID boundaries** — Separate platform, frontend, backend, data, DevOps, process, styleguide, and toolchain concerns.
4. **Deterministic tooling first** — Prefer MCP tools before free-form generation: detect, search, scaffold/template, validate, ADR, fix, handoff.
5. **LLM portability** — Output exact skill names, exact tool names, explicit quality gates, and no model-specific assumptions.

## Tool workflow

| Phase | Tool | Purpose |
|-------|------|---------|
| Discover | `pix_detect` | Detect framework, TypeScript, build tool, and suggested canonical skills/tools. |
| Route | `rule` | Route ambiguous work to the smallest relevant skill set. |
| Research | `pix_search` | Find the relevant sections across all skills. |
| Generate | `pix_component / pix_scaffold` | Create deterministic components, tests, config, or scaffold files. |
| Validate | `pix_check` | Run guardrails and iterate with previousPassed. |
| Fix | `pix_fix` | Repair file-tree naming/barrel conventions. |
| Decide | `pix_process_adr` | Record architecture decisions in docs/adr. |
| Transfer | `pix_process_handoff` | Generate a compact continuation summary. |

## Enforcement architecture

Every generated architecture must define both gates:

- **Pre-processing gate**: validate and normalize tool input; reject blank prompts, unsafe object keys, control characters, oversized payloads, excessive nesting, and undeclared routing assumptions.
- **Post-processing gate**: validate MCP result shape, verify routed skill/tool identifiers against registries, append model-visible compliance contract, and attach `_meta.pixEnforcement` audit data.
- **Code gate**: `pix_check` failures are blocking. Require complete implementation, explicit error handling, manifest-verified dependencies when context exists, and zero ignored diagnostics.
- **Evidence gate**: never claim tests, typechecks, files, APIs, or dependencies without tool or repository evidence.
- **Decision gate**: structural enforcement changes require `pix_process_adr` before completion.

## Agent command distribution

Use reusable command where host supports it:

| Host | Installed integration |
|------|-----------------------|
| Pi | `~/.pi/agent/prompts/rule-mcp.md` → `/rule-mcp` |
| Claude Code | `~/.claude/commands/rule-mcp.md` → `/rule-mcp` (legacy-compatible command path) |
| Gemini CLI | `~/.gemini/commands/rule-mcp.toml` → `/rule-mcp` |
| Cursor | `.cursor/commands/rule-mcp.md` → project command |
| GitHub Copilot CLI | `~/.copilot/agents/rule-mcp.agent.md` → select through `/agent` |
| Codex CLI | Use installed `rule` skill; custom prompt command support is version-dependent and not forced. |

## Architecture decision flow

```text
Intent
  ├─ Project/platform       → rule-platform-*
  ├─ UI/meta-framework      → rule-ui + rule-ui-design-system + rule-frontend-* + rule-styleguide
  ├─ Backend/API/security   → rule-backend-* + rule-backend-security
  ├─ Persistence            → rule-data-*
  ├─ DevOps/release/tests   → rule-devops-*
  ├─ Process/docs/handoff   → rule-process-*
  ├─ Tooling/config         → rule-toolchain-*
  └─ Cross-domain routing   → rule + this skill
```

## Complete skill coverage

Use this table to ensure the architecture package references all relevant skills.
### AI

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-platform-agent](../rule-platform-agent/SKILL.md) | Specialized rule skill. |

### Backend

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-backend](../rule-backend/SKILL.md) | Specialized rule skill. |
| [rule-backend-api-design](../rule-backend-api-design/SKILL.md) | Specialized rule skill. |
| [rule-backend-express](../rule-backend-express/SKILL.md) | Specialized rule skill. |
| [rule-backend-fastify](../rule-backend-fastify/SKILL.md) | Specialized rule skill. |
| [rule-backend-hono](../rule-backend-hono/SKILL.md) | Specialized rule skill. |
| [rule-backend-nestjs](../rule-backend-nestjs/SKILL.md) | Specialized rule skill. |
| [rule-backend-node](../rule-backend-node/SKILL.md) | Specialized rule skill. |
| [rule-backend-security](../rule-backend-security/SKILL.md) | Specialized rule skill. |

### Data

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-data](../rule-data/SKILL.md) | Specialized rule skill. |
| [rule-data-mongodb](../rule-data-mongodb/SKILL.md) | Specialized rule skill. |
| [rule-data-mysql](../rule-data-mysql/SKILL.md) | Specialized rule skill. |
| [rule-data-postgresql](../rule-data-postgresql/SKILL.md) | Specialized rule skill. |
| [rule-data-sql](../rule-data-sql/SKILL.md) | Specialized rule skill. |

### DevOps

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-devops](../rule-devops/SKILL.md) | Specialized rule skill. |
| [rule-devops-docker](../rule-devops-docker/SKILL.md) | Specialized rule skill. |
| [rule-devops-gitlab-ci](../rule-devops-gitlab-ci/SKILL.md) | Specialized rule skill. |
| [rule-devops-testing](../rule-devops-testing/SKILL.md) | Specialized rule skill. |
| [rule-devops-version](../rule-devops-version/SKILL.md) | Specialized rule skill. |

### Dispatcher

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule](../rule/SKILL.md) | Specialized rule skill. |

### Frontend

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-frontend](../rule-frontend/SKILL.md) | Specialized rule skill. |
| [rule-frontend-angular](../rule-frontend-angular/SKILL.md) | Specialized rule skill. |
| [rule-frontend-astro](../rule-frontend-astro/SKILL.md) | Specialized rule skill. |
| [rule-frontend-meta-next](../rule-frontend-meta-next/SKILL.md) | Specialized rule skill. |
| [rule-frontend-meta-nuxt](../rule-frontend-meta-nuxt/SKILL.md) | Specialized rule skill. |
| [rule-frontend-meta-remix](../rule-frontend-meta-remix/SKILL.md) | Specialized rule skill. |
| [rule-frontend-react](../rule-frontend-react/SKILL.md) | Specialized rule skill. |
| [rule-frontend-solidjs](../rule-frontend-solidjs/SKILL.md) | Specialized rule skill. |
| [rule-frontend-svelte](../rule-frontend-svelte/SKILL.md) | Specialized rule skill. |
| [rule-frontend-vanilla-reactive](../rule-frontend-vanilla-reactive/SKILL.md) | Specialized rule skill. |
| [rule-frontend-vue](../rule-frontend-vue/SKILL.md) | Specialized rule skill. |

### Platform

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-platform](../rule-platform/SKILL.md) | Specialized rule skill. |
| [rule-platform-desktop](../rule-platform-desktop/SKILL.md) | Specialized rule skill. |
| [rule-platform-expo](../rule-platform-expo/SKILL.md) | Specialized rule skill. |
| [rule-platform-library](../rule-platform-library/SKILL.md) | Specialized rule skill. |
| [rule-platform-web](../rule-platform-web/SKILL.md) | Specialized rule skill. |

### Process

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-process](../rule-process/SKILL.md) | Specialized rule skill. |
| [rule-process-adr](../rule-process-adr/SKILL.md) | Specialized rule skill. |
| [rule-process-bmad](../rule-process-bmad/SKILL.md) | Specialized rule skill. |
| [rule-process-documentation](../rule-process-documentation/SKILL.md) | Specialized rule skill. |
| [rule-process-feature-workflow](../rule-process-feature-workflow/SKILL.md) | Specialized rule skill. |
| [rule-process-handoff](../rule-process-handoff/SKILL.md) | Specialized rule skill. |

### Styleguide

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-styleguide](../rule-styleguide/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-a11y](../rule-styleguide-a11y/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-css](../rule-styleguide-css/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-html](../rule-styleguide-html/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-javascript](../rule-styleguide-javascript/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-json](../rule-styleguide-json/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-markdown](../rule-styleguide-markdown/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-naming](../rule-styleguide-naming/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-patterns](../rule-styleguide-patterns/SKILL.md) | Specialized rule skill. |
| [rule-styleguide-validation](../rule-styleguide-validation/SKILL.md) | Specialized rule skill. |

### Toolchain

| Skill | Use in architecture when |
|-------|--------------------------|
| [rule-toolchain](../rule-toolchain/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-biome](../rule-toolchain-biome/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-eslint](../rule-toolchain-eslint/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-husky](../rule-toolchain-husky/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-parcel](../rule-toolchain-parcel/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-pnpm](../rule-toolchain-pnpm/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-project](../rule-toolchain-project/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-turborepo](../rule-toolchain-turborepo/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-typescript](../rule-toolchain-typescript/SKILL.md) | Specialized rule skill. |
| [rule-toolchain-vite](../rule-toolchain-vite/SKILL.md) | Specialized rule skill. |
### UI

Design and route visible interface work while preserving rule implementation constraints.

| Skill | Tool | Frameworks | Use when |
|-------|------|------------|----------|
| [rule-ui](../rule-ui/SKILL.md) | `pix_ui` | all | Umbrella skill for all user-interface work in the rule ecosystem. Use when a task affects visual UI, component composition... |
| [rule-ui-design-system](../rule-ui-design-system/SKILL.md) | `pix_ui_design_system` | all | Distinctive production-grade UI design direction for rule projects. Use when designing pages, components, dashboards... |

## Generated `.context/` output

The context interview must generate these industry-standard outputs from `assets/context-server/templates.json`:

- `README.md` — documentation map and project frame
- `ROADMAP.md` — milestone tracker
- `project-context.md` — compact AI working context
- `analysis/functional-analysis.md` and `analysis/implementation-roadmap.md` — product analysis and execution order
- `specs/00-sdd.md` through `specs/10-rule-routing.md` — SDD, product, domain, rules, architecture, quality, ADRs, deployment, security, and rule routing
- `schemas/ruleset.schema.json` — validation contract for reusable domain rules
- `qa/checklist.md` — manual QA and a11y/resilience checks
- concrete support docs such as `constraints.concrete.md` and `use-cases.concrete.md`

## Placeholder and inventory governance

- `assets/context-server/placeholders.json` is the interview schema.
- `assets/context-server/templates.json` is the generated `.context/` source.
- [`knowledge/context-inventory.md`](./knowledge/context-inventory.md) is the census of generated files, placeholders, tools, and skill routing.
- Every placeholder used by a template must be present in `placeholders.json`.
- Every generated project must include `RULE_MCP_PRIMARY_SKILL`, `RULE_MCP_SECONDARY_SKILLS`, `RULE_MCP_RECOMMENDED_TOOLS`, `ARCHITECTURE_DECISIONS`, `QUALITY_GATES`, and `DELIVERY_WORKFLOW`.

## Quality gates

Before architecture work is complete:

- [ ] `pix_detect` has been run when a project path exists.
- [ ] Primary and secondary skills are explicit.
- [ ] Deterministic tool sequence is captured in `.context/specs/10-rule-routing.md`.
- [ ] ADRs exist for irreversible or high-impact decisions.
- [ ] Tests, docs, a11y/security/performance gates are listed.
- [ ] `pix_check` passes for generated code or templates where applicable.
- [ ] `pix_process_handoff` can summarize the project for a new LLM session.

## See also

- [rule](../rule/SKILL.md) — Central skill and tool dispatcher
- [rule-process-adr](../rule-process-adr/SKILL.md) — Architecture Decision Records
- [rule-process-documentation](../rule-process-documentation/SKILL.md) — Documentation standards
- [rule-devops-testing](../rule-devops-testing/SKILL.md) — Testing and coverage gates
- [rule-toolchain-project](../rule-toolchain-project/SKILL.md) — Project configuration baseline
