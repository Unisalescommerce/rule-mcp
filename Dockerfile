# rule-mcp - Docker image
# Workspace root builds the published packages/mcp server. Skills stay embedded
# from the repository.

FROM node:22-alpine
WORKDIR /app
RUN corepack enable

# Manifests first so the install layer caches when sources change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/mcp/package.json packages/mcp/
COPY packages/shared/package.json packages/shared/
COPY packages/docs/package.json packages/docs/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY bin/ bin/
COPY packages/ packages/
COPY skills/ skills/
COPY scripts/ scripts/
COPY prompts/ prompts/
COPY personas/ personas/
COPY package.json server.json README.md LICENSE ./

EXPOSE 37999
ENV NODE_ENV=production
# Bind all interfaces so a mapped SSE port is reachable from the host when
# the container is started with `serve --transport sse`.
ENV RULE_MCP_HOST=0.0.0.0
ENV RULE_MCP_PORT=37999
# Marks this install as a container so detectInstallType() refuses git
# self-update: an image is replaced, not fast-forwarded in place.
ENV RULE_MCP_DOCKER=1
# Feature opt-out switches shipped at 0 (feature ON) for discoverability;
# set any to 1 to disable that feature.
ENV RULE_MCP_NO_AUTOUPDATE=0
ENV RULE_MCP_NO_AUTORESTART=0
ENV RULE_MCP_NO_CACHE=0
ENV RULE_MCP_NO_COMPRESSION=0
ENV RULE_MCP_NO_TOKENSAVE=0
ENV RULE_MCP_NO_REMINDER=0

# Drop root: the server only needs to read /app and write its state dir under
# the node user's home. Must precede CMD or the drop never applies.
USER node

# Default: stdio transport (for MCP agents)
# Override with: --transport sse for IDE integration
CMD ["node", "bin/rule-mcp.js", "serve"]
