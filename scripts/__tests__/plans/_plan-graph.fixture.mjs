/** Parsers for the plan graph format ADR 154 defines: a section, a line, its edges. */

/** The `## Dependency graph` body of one plan, or "". */
function graphSection(text) {
  const start = text.indexOf("\n## Dependency graph");

  if (start === -1) {
    return "";
  }

  const rest = text.slice(start + 1);
  const end = rest.indexOf("\n## ", 3);

  return end === -1 ? rest : rest.slice(0, end);
}

/** One parseable line from a graph section, trimmed, or "". */
function graphLine(section, label) {
  const line = section.split("\n").find((l) => l.trim().startsWith(label));

  return line ? line.trim().slice(label.length).trim() : "";
}

/** Edge targets from `Depends on: `a` (HARD), `b#2` (CONTRACT)`. */
function edges(line) {
  return line
    .split(",")

    .map((part) => part.trim())

    .filter((part) => part && part !== "-")

    .map((part) => {
      const match = part.match(/^`?([a-z0-9-]+)(?:#(\d+))?`?\s*(?:\(([A-Z]+)\))?/i);

      return match ? { id: match[1], phase: match[2] ? Number(match[2]) : null, kind: (match[3] ?? "HARD").toUpperCase() } : null;
    })
    .filter(Boolean);
}

/** The node id of a plan path: strip leading `_` then `rule-mcp-` → `rule-`. */
const nodeId = (path) =>
  path
    .split("/")
    .pop()
    .replace(/\.md$/, "")
    .replace(/^_/u, "")
    .replace(/^rule-mcp-/u, "rule-");

function stageNumber(title) {
  const match = title.match(/^(\d+)([a-z])?/);

  return match ? Number(match[1]) + (match[2] === "a" ? 0.1 : match[2] === "b" ? 0.2 : 0) : -1;
}

/** Stage number per node id, parsed from the skills-plan stage tables. */
function stagesFromPlan(planText) {
  const stageOf = new Map();

  for (const block of planText.split(/\n### Stage /).slice(1)) {
    const body = block.split(/\n## /, 1)[0];
    const stage = stageNumber(body.split("\n", 1)[0]);

    for (const row of body.split("\n")) {
      const id = row.match(/^\| `([a-z0-9-]+)`/)?.[1];

      if (id) {
        stageOf.set(id, stage);
      }
    }
  }

  return stageOf;
}

export { edges, graphLine, graphSection, nodeId, stageNumber, stagesFromPlan };
