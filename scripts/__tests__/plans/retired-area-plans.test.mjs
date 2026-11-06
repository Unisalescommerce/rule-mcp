/** Retired area plans keep every rule in one owning skill plan. */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const plansRoot = join(root, "docs", "plans");
const RETIRED_AREA_PLANS = ["ai", "backend", "data", "devops", "frontend", "meta"].map((area) => `_${area}-guardrails.md`);
const RETAINED_AREA_RULES = new Map([
  [
    "skills/ai/_rule-mcp-ai-agent-architecture.md",
    ["ai-tool-schema", "ai-call-timeout", "ai-max-tokens", "ai-output-validated", "ai-no-secrets-in-prompt", "ai-trace-span", "ai-eval-presence", "ai-mcp-token-validation"],
  ],
  [
    "skills/backend/_rule-mcp-backend-security.md",
    [
      "jwt-verify-not-decode",
      "jwt-alg-none-banned",
      "cookie-security-flags",
      "csrf-state-change",
      "auth-log-redaction",
      "no-dynamic-code-execution",
      "prototype-pollution-guard",
      "ssrf-allowlist",
      "body-size-limit",
      "pagination-max-limit",
      "env-validation-at-boot",
    ],
  ],
  ["skills/backend/_rule-mcp-backend-node.md", ["outbound-timeout", "bounded-concurrency", "no-sync-blocking", "graceful-shutdown"]],
  ["skills/backend/_rule-mcp-backend-workers.md", ["worker-pool-per-request"]],
  ["skills/backend/_rule-mcp-backend-graphql.md", ["gql-depth-limit", "gql-introspection-prod", "gql-batching-limit", "gql-pagination", "gql-authz-edges-nodes"]],
  ["skills/backend/_rule-mcp-backend-express.md", ["express-error-handler"]],
  ["skills/backend/_rule-mcp-backend-fastify.md", ["fastify-route-schema"]],
  ["skills/backend/_rule-mcp-backend-hono.md", ["hono-secure-headers"]],
  ["skills/backend/_rule-mcp-backend-nestjs.md", ["nestjs-validation-pipe"]],
  ["skills/data/_rule-mcp-data.md", ["no-select-star", "query-limit", "query-timeout", "db-least-privilege", "migration-down"]],
  ["skills/data/_rule-mcp-data-postgresql.md", ["index-on-fk"]],
  ["skills/data/_rule-mcp-data-mongodb.md", ["mongo-projection", "mongo-esr-index"]],
  ["skills/data/_rule-mcp-data-sqlite.md", ["sqlite-wal"]],
  ["skills/devops/_rule-mcp-devops.md", ["ci-image-digest-pinned", "ci-no-secret-echo", "ci-no-allow-failure", "ci-protected-deploy", "ci-provenance"]],
  ["skills/devops/_rule-mcp-devops-docker.md", ["dockerignore-hardening", "docker-no-build-secrets", "compose-hardening"]],
  ["skills/devops/_rule-mcp-devops-testing.md", ["test-coverage-thresholds", "test-no-focused", "test-no-fixed-sleep", "test-setup-required"]],
  ["skills/devops/_rule-mcp-devops-observability.md", ["obs-health-endpoint", "obs-structured-logs", "obs-no-pii-in-logs", "obs-span-versioning"]],
  ["skills/devops/_rule-mcp-devops-deploy-preview.md", ["preview-on-stop", "preview-auto-stop", "preview-no-secrets-spec", "preview-envsubst-whitelist"]],
  ["skills/frontend/_rule-mcp-frontend.md", ["xss-sink-sanitized", "fe-list-key", "fe-effect-cleanup", "ce-valid"]],
  ["skills/frontend/_rule-mcp-frontend-workers.md", ["worker-no-dom", "worker-transferable"]],
  ["skills/meta/_rule-mcp-meta.md", ["meta-public-env-secret", "meta-server-data-leak", "hydration-safe", "meta-route-validation"]],
  ["skills/meta/_rule-mcp-meta-next.md", ["meta-client-directive", "meta-cache-explicit"]],
  ["skills/meta/_rule-mcp-meta-astro.md", ["astro-client-directive"]],
]);

test("retired area guardrail rules live in their owning skill plans", () => {
  const missing = [];

  for (const [path, ids] of RETAINED_AREA_RULES) {
    const text = readFileSync(join(plansRoot, path), "utf8");

    for (const id of ids) {
      if (!text.includes(`\`${id}\``)) {
        missing.push(`${path}: ${id}`);
      }
    }
  }

  assert.deepEqual(missing, [], `migrate these retained rules before deleting their area plans: ${missing.join(", ")}`);
});

test("retired area guardrail plan files and active references are gone", () => {
  const remainingFiles = RETIRED_AREA_PLANS.filter((path) => existsSync(join(plansRoot, path)));
  const activeReferences = [];
  const retiredReference = /(?:_|\*)(?:ai|backend|data|devops|frontend|meta|\*)-guardrails\.md/g;

  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.name.endsWith(".md") && !RETIRED_AREA_PLANS.includes(entry.name)) {
        const matches = readFileSync(path, "utf8").match(retiredReference) ?? [];
        activeReferences.push(...matches.map((match) => `${path.slice(plansRoot.length + 1)}: ${match}`));
      }
    }
  };

  visit(plansRoot);

  assert.deepEqual(remainingFiles, [], `delete these retired plans: ${remainingFiles.join(", ")}`);
  assert.deepEqual(activeReferences, [], `remove these active references: ${activeReferences.join(", ")}`);
});
