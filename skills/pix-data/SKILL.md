---
name: rule-data
description: >
  Index of all data/database skills: SQL fundamentals, PostgreSQL, MySQL, and MongoDB.
  Delegates to the specific database skill based on project requirements.
tags:
  - "data"
  - "database"
  - "index"
  - "sql"
  - "nosql"
frameworks: [all]
---

# rule-data — Data & Database Skills Index

## Available Skills

| Skill | Database | Type | Best For |
|-------|----------|------|----------|
| [rule-data-sql](../rule-data-sql/SKILL.md) | SQL General | Relational | Query patterns, DDL, indexing theory, transactions |
| [rule-data-postgresql](../rule-data-postgresql/SKILL.md) | PostgreSQL 16+ | Relational (ACID) | Complex queries, JSONB, partitioning, replication |
| [rule-data-mysql](../rule-data-mysql/SKILL.md) | MySQL 8+ / MariaDB 11+ | Relational (InnoDB) | Web apps, LAMP stack, high read throughput |
| [rule-data-mongodb](../rule-data-mongodb/SKILL.md) | MongoDB 7+ | Document (NoSQL) | Flexible schemas, rapid prototyping, time-series |

## Quick Selection Guide

```
Need ACID + complex JOINs?            → rule-data-postgresql
Need high read throughput?             → rule-data-mysql
Need flexible schemas + rapid dev?     → rule-data-mongodb
Need SQL fundamentals + theory?        → rule-data-sql
```

## See also

- [rule-backend-node](../rule-backend-node/SKILL.md) — Backend runtime with DB integration
- [rule](../rule/SKILL.md) — Central skill index
