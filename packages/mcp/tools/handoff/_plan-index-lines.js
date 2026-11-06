/**
 * @module tools/handoff/plan-index-lines
 *
 * The line-level rewrites that retire one plan from an index.
 *
 * Each patcher reads a single line and returns either the rewritten line or
 * null when the line is not the shape it owns. `mapLines` applies them in order
 * and reports whether anything moved, so a second pass is a no-op.
 */
import { PROGRESS_STATUS, adrLink, basename } from "./_plan-index-shape.js";

/**
 * The snapshot row of the level-0 index names the file as its own cell.
 *
 * @param {string} line
 * @param {string} filename
 * @param {number} adrNumber
 * @returns {string | null}
 */
export function patchSnapshotRow(line, filename, adrNumber) {
  if (!line.startsWith("|") || line.includes("done → ADR")) {
    return null;
  }

  const cells = line.split("|");
  const at = cells.findIndex((cell) => cell.trim() === `\`${filename}\``);

  if (at === -1 || at + 1 >= cells.length - 1) {
    return null;
  }

  cells[at] = " _(retired)_ ";
  cells[at + 1] = ` done → ADR ${adrNumber} `;

  return cells.join("|");
}

/**
 * A workstream checkbox is `- [ ] [\`file\`](file) - <open work>`.
 *
 * @param {string} line
 * @param {{ filename: string, adrNumber: number, adrFile: string }} entry
 * @returns {string | null}
 */
export function patchCheckbox(line, entry) {
  const link = `[\`${entry.filename}\`](${entry.filename})`;

  if (!line.includes(link) || !/^\s*-\s*\[ \]/.test(line) || line.includes("retired →")) {
    return null;
  }

  const closed = line.replace(/^(\s*-\s*)\[ \]/, "$1[x]");
  const at = closed.indexOf(link) + link.length;
  const tail = closed.slice(at).replace(/[\s.;]*$/u, "");

  return `${closed.slice(0, at)}${tail}; retired → ${adrLink(entry)}.`;
}

/**
 * A dependency-graph leaf is `│   ├── <file>` with the optional annotation.
 *
 * @param {string} line
 * @param {{ filename: string, label: string, adrNumber: number }} entry
 * @returns {string | null}
 */
export function patchGraphLeaf(line, entry) {
  const leaf = basename(entry.filename);

  if (!/^\s*[│├└─\s]*[├└]──/.test(line) || !line.includes(leaf) || line.includes("done → ADR")) {
    return null;
  }

  return `${line.slice(0, line.indexOf(leaf))}${entry.label} ... done → ADR ${entry.adrNumber}`;
}

/**
 * A plan detail line is `Plan: [\`file\`](file)` or `Orchestrator: ...`.
 *
 * @param {string} line
 * @param {{ filename: string, adrNumber: number, adrFile: string }} entry
 * @returns {string | null}
 */
export function patchPlanLink(line, entry) {
  const trimmed = line.trim();
  const label = trimmed.startsWith("Plan:") ? "Plan" : trimmed.startsWith("Orchestrator:") ? "Orchestrator" : "";

  if (label === "" || !line.includes(basename(entry.filename)) || line.includes("done → ADR")) {
    return null;
  }

  return `${label}: retired → ${adrLink(entry)}`;
}

/**
 * A progress row is `| \`node-id\` | area | status | box | stage |`.
 *
 * @param {string} line
 * @param {{ nodeId?: string }} entry
 * @returns {string | null}
 */
export function patchProgressRow(line, entry) {
  if (!entry.nodeId || !line.startsWith("|")) {
    return null;
  }

  const cells = line.split("|");
  const at = cells.findIndex((cell) => cell.trim() === `\`${entry.nodeId}\``);

  if (at === -1) {
    return null;
  }

  const status = cells.findIndex((cell, index) => index > at && PROGRESS_STATUS.test(cell.trim()));

  if (status === -1 || cells[status].trim() === "retired") {
    return null;
  }

  cells[status] = " retired ";

  return cells.join("|");
}

/** Apply one patch per line and report whether anything moved. */
export function mapLines(text, patches) {
  let changed = false;
  const out = text.split("\n").map((line) => {
    for (const patch of patches) {
      const next = patch(line);

      if (next !== null && next !== line) {
        changed = true;

        return next;
      }
    }

    return line;
  });

  return { text: out.join("\n"), changed };
}
