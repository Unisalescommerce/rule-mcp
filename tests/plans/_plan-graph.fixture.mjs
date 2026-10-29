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

export { edges, graphLine, graphSection };
