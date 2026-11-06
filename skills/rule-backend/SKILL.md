---
name: rule-backend
description: >-
  Use when designing or building a backend service to route to the right runtime, protocol, or hardening skill. Covers REST, GraphQL, Express, Fastify, NestJS, Hono, the Node runtime, and the security and worker boundaries.
tags:
  - "backend"
  - "api"
  - "server"
  - "umbrella"
  - "index"
frameworks: [all]
guardrails: [cors-explicit, error-exposure, helmet-headers, input-validation, rate-limiting, sql-injection]
---

# rule-backend - Backend Skill Index

This skill routes. The contract, the code and the failure modes live in the leaf
that owns the runtime or the protocol.

## Route the request

| The request names      | Skill                                                      | The leaf owns                                                |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| NestJS, modules, DI    | [rule-backend-nestjs](../rule-backend-nestjs/SKILL.md)     | Layering, validation pipes, GraphQL in a modular service     |
| Express, middleware    | [rule-backend-express](../rule-backend-express/SKILL.md)   | Middleware order, error handlers, route contracts            |
| Fastify, schemas       | [rule-backend-fastify](../rule-backend-fastify/SKILL.md)   | Route schemas, plugins, serialization                        |
| Hono, edge, serverless | [rule-backend-hono](../rule-backend-hono/SKILL.md)         | Edge runtime limits, secure headers, multi-runtime routing   |
| Node runtime, files    | [rule-backend-node](../rule-backend-node/SKILL.md)         | Local-first storage, filesystem, outbound timeouts, shutdown |
| GraphQL                | [rule-backend-graphql](../rule-backend-graphql/SKILL.md)   | Schema-first contract, resolver boundaries, N+1, query abuse |
| Auth, validation, CORS | [rule-backend-security](../rule-backend-security/SKILL.md) | Hardening: headers, input, rate limits, error exposure       |
| Workers, event loop    | [rule-backend-workers](../rule-backend-workers/SKILL.md)   | libuv pool, `worker_threads`, piscina, cluster, backpressure |

## Two other areas answer two of these questions

- **Which database?** The access pattern decides, not the fashion. Route to
  [rule-data](../rule-data/SKILL.md): PostgreSQL, MySQL, MongoDB, SQLite,
  DuckDB, and the shared query rules.
- **Which HTTP shape?** REST with OpenAPI first is the default. GraphQL is the
  exception a consumer earns, and its leaf says what that costs.

## Six questions describe an architecture

Most architecture questions are the same six wearing different clothes. The
diagram is derived; the questions are not.

1. **Where does the state live?** State in process memory survives until the
   second instance. Shared state goes where sharing was designed.
2. **What is cached, and how stale may it be?** Caching trades freshness for
   speed. Where the answer is "not at all", do not cache.
3. **Where does consistency matter?** A balance must be right now; a follower
   count may be seconds behind. Decide per operation, not per system.
4. **What can be asynchronous?** Anything the caller does not need before the
   response. A queue arrives with retries, a dead-letter path and a view of both.
5. **What guarantees does the data need?** Transactions and constraints are what
   a relational database is for. The access pattern decides, not the label.
6. **What is the contract, and who holds it?** Adding a field is safe. Removing
   or renaming one is a breaking change whatever the version says.

Two more, once the system is real:

- **Backpressure.** Every component needs a way to say "not so fast" that is not
  falling over. A bounded queue that refuses beats an unbounded one that dies.
- **Failure domains.** Ask what one slow dependency takes with it. If it slows
  every request, there is no isolation, and more capacity will not create any.

## Layouts, and the symptom that ends each

There is no correct structure, only the one that matches the team and the
lifetime of the code. Move when the symptom appears, not before.

| Layout                                    | Stops paying when                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Routes, models, handlers                  | Two handlers start disagreeing about the same business rule             |
| A service layer under the handlers        | The folder becomes a second dumping ground with no owner                |
| Feature folders, one per domain           | A feature needs another's internals; the crossing import is the warning |
| Ports and adapters, framework at the edge | The domain does not earn the indirection a reader pays on every trace   |
| Separate services, separate deployments   | The organization is not yet several teams: a distributed monolith       |

The boundary that matters is the one you cannot cross by accident. Make the
crossing visible: an index that defines the surface, or a lint rule that refuses
the deep import.

## See also

- [rule](../rule/SKILL.md) - Central skill index and dispatcher
