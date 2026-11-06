# 136: Move the validation skill from styleguide to data

- **Date**: 2026-10-17
- **Status**: accepted
- **Tags**: skills, data, styleguide, validation, breaking
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The skill holds international business data rules: email, phone, VAT, tax IDs, postal codes, national identifiers, address and entity schemas, and the validation libraries that enforce them. It sat in the styleguide area, whose subject is the rules code is written to, per language and concern, but its content is data shape and country formats, not code style. The same values are validated in the client form, sent to the API and stored, so the data area is the umbrella that already covers where those values go.

## Decision

Rename rule-styleguide-validation to rule-data-validation, change tool to rule_tool_data_validation, move its rows from styleguide tables into data tables in rule-mcp and rule-data, update personas that name it, framework map in guardrail registry, tool-surface snapshot and census, and broaden data area description to include shape and validation of data that reaches database.

## Consequences

The catalog stays at 88 skills while the area counts move: styleguide loses one and data gains one. Clients that call rule_tool_styleguide_validation break and must call rule_tool_data_validation instead. The area description in the census data file now names validation, which is the one hand-written line the derived areas cannot produce.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. Keep skill in styleguide area as cross-cutting concern
1. Create new validation area with its own router
1. Move it to backend area, where input validation at boundary lives
