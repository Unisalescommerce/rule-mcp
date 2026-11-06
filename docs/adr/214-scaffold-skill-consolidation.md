# 005 - Scaffold Skill Consolidation

- **Date**: 2026-07-10
- **Status**: accepted
- **Tags**: infrastructure, skills, scaffolding, merge
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

`rule-mcp-scaffold-*` skill family was fragmented. Four separate scaffolding skills each contained overlapping content:

- `rule-mcp-scaffold-backend-node` was full backend scaffold but lived in `scaffold-*` instead of `backend-*`
- `rule-mcp-scaffold-ai-agents` was orchestrator that delegated to backend + frontend scaffolders
- `rule-mcp-scaffold-expo` duplicated content that belonged in `platform-expo`
- `rule-mcp-scaffold-frontend-react-vite` mixed three concerns: React setup, Vite config, and generic frontend tooling

Also, `rule-mcp-scaffold` umbrella directory itself served no purpose as skill - `rule_tool_scaffold` core MCP tool already handles config file generation.

## Decision

### 1. Rename and absorb `scaffold-backend-node` -> `backend-node`

skill moves from `rule-mcp-scaffold-backend-node` to `rule-backend-node`, placing it alongside other backend framework skills. No content lost.

### 2. Merge `scaffold-ai-agents` -> `ai-agents`

AI agents scaffold was orchestrator that delegated to backend + frontend scaffolders. Its monorepo setup content is absorbed into agents skill.

### 3. Merge `scaffold-expo` -> `platform-expo`

All Expo/React Native scaffolding content moves into `rule-platform-expo`, platform-level skill.

### 4. Split `scaffold-frontend-react-vite` into three targets

| Content                                                        | Destination                          |
| -------------------------------------------------------------- | ------------------------------------ |
| Vite configuration, vitest, build optimization                 | `rule-toolchain-vite` (new skill)    |
| React-specific scaffolding (app bootstrap, routing, API layer) | `rule-frontend-react` (extant skill) |
| Generic frontend project setup (package.json, tsconfig, biome) | `rule-platform-web` (extant skill)   |

### 5. Delete all remaining `rule-mcp-scaffold-*` directories

`rule_tool_scaffold` core MCP tool continues to handle `.prettierrc`, `.editorconfig`, `.gitignore` scaffolding.

## Consequences

**Positive:**

- Skills now live in their semantic category (`backend-*`, `platform-*`, `frontend-*`, `toolchain-*`)
- No more `scaffold-*` as catch-all category
- Vite has its own dedicated skill (framework-agnostic, usable with React, Vue, Svelte, etc.)
- All content preserved - no deletions, only moves and merges

**Negative:**

- Cross-references from old scaffold directories needed updating across all SKILL.md files
- MCP tool names changed for backend-node and ai-agents

**Migration:**

- Any agent prompts referencing `rule_tool_scaffold_backend_node` must use `rule_tool_backend_node`
- Any agent prompts referencing `rule_tool_scaffold_ai_agents` must use `rule_tool_ai_agents`
- Any agent prompts referencing `rule_tool_scaffold_expo` must use `rule_tool_platform_expo`
- Any agent prompts referencing `rule_tool_scaffold_frontend_react_vite` must use `rule_tool_frontend_react` or `rule_tool_toolchain_vite`
