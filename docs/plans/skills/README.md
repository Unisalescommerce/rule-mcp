# Per-skill implementation plans

Reverse alphabetical order, starting from `rule-ui-design-system` as requested.
One plan per skill at `docs/plans/skills/<area>/_<skill-file>.md` (leading `_`; `plan-of-plans.md` is the only unprefixed plan).
The router `rule-mcp` is not a skill and has no plan.
Status: `pending`, `planned`, `implemented`.
Run order and the four real dependencies: [`DEPENDENCIES.md`](DEPENDENCIES.md).
Live ordering authority, stages, gates and per-plan progress:
[`_skills-plan.md`](_skills-plan.md).

Total: 81 skills in the catalog, each with a plan, plus five planned skills that
do not exist yet: `rule-platform-mobile` (85), `rule-toolchain-electron` (86),
`rule-toolchain-tauri` (87), `rule-process-cargo-release` (88) and
`rule-process-uv-release` (89) - the two release skills that answer the same
question as `rule-process-npm-release` for Rust and for Python managed with
`uv`. Numbers 40, 49 and 54 are
retired: those skills were removed from the catalog and their plans are gone.
New rows append and existing numbers stay put, so the `#NN` references in the
plans keep pointing at the same skill.

| #   | Skill                           | Area       | Plan path                                                       | Status  |
| --- | ------------------------------- | ---------- | --------------------------------------------------------------- | ------- |
| 1   | `rule-ui-design-system`         | ui         | `docs/plans/skills/ui/_rule-mcp-ui-design-system.md`                 | planned |
| 2   | `rule-ui`                       | ui         | `docs/plans/skills/ui/_rule-mcp-ui.md`                               | planned |
| 3   | `rule-toolchain-vite`           | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-vite.md`            | planned |
| 4   | `rule-toolchain-turborepo`      | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-turborepo.md`       | planned |
| 5   | `rule-toolchain-rspack`         | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-rspack.md`          | planned |
| 6   | `rule-toolchain-pnpm`           | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-pnpm.md`            | planned |
| 7   | `rule-toolchain-parcel`         | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-parcel.md`          | planned |
| 8   | `rule-toolchain-husky`          | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-husky.md`           | planned |
| 9   | `rule-toolchain-eslint`         | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-eslint.md`          | planned |
| 10  | `rule-toolchain-biome`          | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-biome.md`           | planned |
| 11  | `rule-toolchain`                | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain.md`                 | planned |
| 12  | `rule-styleguide-typescript`    | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-typescript.md`    | planned |
| 13  | `rule-styleguide-naming`        | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-naming.md`        | planned |
| 14  | `rule-styleguide-markdown`      | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-markdown.md`      | planned |
| 15  | `rule-styleguide-json`          | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-json.md`          | planned |
| 16  | `rule-styleguide-javascript`    | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-javascript.md`    | planned |
| 17  | `rule-styleguide-i18n`          | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-i18n.md`          | planned |
| 18  | `rule-styleguide-html`          | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-html.md`          | planned |
| 19  | `rule-styleguide-git`           | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-git.md`           | planned |
| 20  | `rule-styleguide-file-tree`     | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-file-tree.md`     | planned |
| 21  | `rule-styleguide-css`           | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-css.md`           | planned |
| 22  | `rule-styleguide-configuration` | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-configuration.md` | planned |
| 23  | `rule-styleguide-comments`      | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-comments.md`      | planned |
| 24  | `rule-styleguide-baseline`      | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-baseline.md`      | planned |
| 25  | `rule-styleguide-a11y`          | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide-a11y.md`          | planned |
| 26  | `rule-styleguide`               | styleguide | `docs/plans/skills/styleguide/_rule-mcp-styleguide.md`               | planned |
| 27  | `rule-process-tdd`              | process    | `docs/plans/skills/process/_rule-mcp-process-tdd.md`                 | planned |
| 28  | `rule-process-readme`           | process    | `docs/plans/skills/process/_rule-mcp-process-readme.md`              | planned |
| 29  | `rule-process-npm-release`      | process    | `docs/plans/skills/process/_rule-mcp-process-npm-release.md`         | planned |
| 30  | `rule-process-code-review`      | process    | `docs/plans/skills/process/_rule-mcp-process-code-review.md`         | planned |
| 31  | `rule-process-changelog`        | process    | `docs/plans/skills/process/_rule-mcp-process-changelog.md`           | planned |
| 32  | `rule-process-bmad`             | process    | `docs/plans/skills/process/_rule-mcp-process-bmad.md`                | planned |
| 33  | `rule-process-ai`               | process    | `docs/plans/skills/process/_rule-mcp-process-ai.md`                  | planned |
| 34  | `rule-process-adr`              | process    | `docs/plans/skills/process/_rule-mcp-process-adr.md`                 | planned |
| 35  | `rule-process`                  | process    | `docs/plans/skills/process/_rule-mcp-process.md`                     | planned |
| 36  | `rule-platform-web`             | platform   | `docs/plans/skills/platform/_rule-mcp-platform-web.md`               | planned |
| 37  | `rule-platform-library`         | platform   | `docs/plans/skills/platform/_rule-mcp-platform-library.md`           | planned |
| 38  | `rule-platform-desktop`         | platform   | `docs/plans/skills/platform/_rule-mcp-platform-desktop.md`           | planned |
| 39  | `rule-platform-auth`            | platform   | `docs/plans/skills/platform/_rule-mcp-platform-auth.md`              | planned |
| 41  | `rule-platform`                 | platform   | `docs/plans/skills/platform/_rule-mcp-platform.md`                   | planned |
| 42  | `rule-meta-remix`               | meta       | `docs/plans/skills/meta/_rule-mcp-meta-remix.md`                     | planned |
| 43  | `rule-meta-nuxt`                | meta       | `docs/plans/skills/meta/_rule-mcp-meta-nuxt.md`                      | planned |
| 44  | `rule-meta-next`                | meta       | `docs/plans/skills/meta/_rule-mcp-meta-next.md`                      | planned |
| 45  | `rule-meta-astro`               | meta       | `docs/plans/skills/meta/_rule-mcp-meta-astro.md`                     | planned |
| 46  | `rule-meta`                     | meta       | `docs/plans/skills/meta/_rule-mcp-meta.md`                           | planned |
| 47  | `rule-frontend-workers`         | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-workers.md`           | planned |
| 48  | `rule-frontend-vue`             | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-vue.md`               | planned |
| 50  | `rule-frontend-template-engine` | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-template-engine.md`   | planned |
| 51  | `rule-frontend-svelte`          | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-svelte.md`            | planned |
| 52  | `rule-frontend-solidjs`         | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-solidjs.md`           | planned |
| 53  | `rule-frontend-react`           | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-react.md`             | planned |
| 55  | `rule-frontend-angular`         | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend-angular.md`           | planned |
| 56  | `rule-frontend`                 | frontend   | `docs/plans/skills/frontend/_rule-mcp-frontend.md`                   | planned |
| 57  | `rule-devops-testing`           | devops     | `docs/plans/skills/devops/_rule-mcp-devops-testing.md`               | planned |
| 58  | `rule-devops-observability`     | devops     | `docs/plans/skills/devops/_rule-mcp-devops-observability.md`         | planned |
| 59  | `rule-devops-docker`            | devops     | `docs/plans/skills/devops/_rule-mcp-devops-docker.md`                | planned |
| 60  | `rule-devops-deploy-preview`    | devops     | `docs/plans/skills/devops/_rule-mcp-devops-deploy-preview.md`        | planned |
| 61  | `rule-devops`                   | devops     | `docs/plans/skills/devops/_rule-mcp-devops.md`                       | planned |
| 62  | `rule-data-validation`          | data       | `docs/plans/skills/data/_rule-mcp-data-validation.md`                | planned |
| 63  | `rule-data-sqlite`              | data       | `docs/plans/skills/data/_rule-mcp-data-sqlite.md`                    | planned |
| 64  | `rule-data-sql`                 | data       | `docs/plans/skills/data/_rule-mcp-data-sql.md`                       | planned |
| 65  | `rule-data-postgresql`          | data       | `docs/plans/skills/data/_rule-mcp-data-postgresql.md`                | planned |
| 66  | `rule-data-mysql`               | data       | `docs/plans/skills/data/_rule-mcp-data-mysql.md`                     | planned |
| 67  | `rule-data-mongodb`             | data       | `docs/plans/skills/data/_rule-mcp-data-mongodb.md`                   | planned |
| 68  | `rule-data-indexed-db`          | data       | `docs/plans/skills/data/_rule-mcp-data-indexed-db.md`                | planned |
| 69  | `rule-data-duckdb`              | data       | `docs/plans/skills/data/_rule-mcp-data-duckdb.md`                    | planned |
| 70  | `rule-data`                     | data       | `docs/plans/skills/data/_rule-mcp-data.md`                           | planned |
| 71  | `rule-backend-workers`          | backend    | `docs/plans/skills/backend/_rule-mcp-backend-workers.md`             | planned |
| 72  | `rule-backend-security`         | backend    | `docs/plans/skills/backend/_rule-mcp-backend-security.md`            | planned |
| 73  | `rule-backend-node`             | backend    | `docs/plans/skills/backend/_rule-mcp-backend-node.md`                | planned |
| 74  | `rule-backend-nestjs`           | backend    | `docs/plans/skills/backend/_rule-mcp-backend-nestjs.md`              | planned |
| 75  | `rule-backend-hono`             | backend    | `docs/plans/skills/backend/_rule-mcp-backend-hono.md`                | planned |
| 76  | `rule-backend-graphql`          | backend    | `docs/plans/skills/backend/_rule-mcp-backend-graphql.md`             | planned |
| 77  | `rule-backend-fastify`          | backend    | `docs/plans/skills/backend/_rule-mcp-backend-fastify.md`             | planned |
| 78  | `rule-backend-express`          | backend    | `docs/plans/skills/backend/_rule-mcp-backend-express.md`             | planned |
| 79  | `rule-backend`                  | backend    | `docs/plans/skills/backend/_rule-mcp-backend.md`                     | planned |
| 80  | `rule-ai-prompting`             | ai         | `docs/plans/skills/ai/_rule-mcp-ai-prompting.md`                     | planned |
| 81  | `rule-ai-evals`                 | ai         | `docs/plans/skills/ai/_rule-mcp-ai-evals.md`                         | planned |
| 82  | `rule-ai-context-engineering`   | ai         | `docs/plans/skills/ai/_rule-mcp-ai-context-engineering.md`           | planned |
| 83  | `rule-ai-agent-architecture`    | ai         | `docs/plans/skills/ai/_rule-mcp-ai-agent-architecture.md`            | planned |
| 84  | `rule-ai`                       | ai         | `docs/plans/skills/ai/_rule-mcp-ai.md`                               | planned |
| 85  | `rule-platform-mobile`          | platform   | `docs/plans/skills/platform/_rule-mcp-platform-mobile.md`            | planned |
| 86  | `rule-toolchain-electron`       | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-electron.md`        | planned |
| 87  | `rule-toolchain-tauri`          | toolchain  | `docs/plans/skills/toolchain/_rule-mcp-toolchain-tauri.md`           | planned |
| 88  | `rule-process-cargo-release`    | process    | `docs/plans/skills/process/_rule-mcp-process-cargo-release.md`   | planned |
| 89  | `rule-process-uv-release`       | process    | `docs/plans/skills/process/_rule-mcp-process-uv-release.md`      | planned |
