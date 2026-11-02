/** Render one ADR document from its fields (Nygard template). */
import { adrAuthor } from "./_author.js";

/** Generate ADR markdown content. Pending (off-trunk) uses `# Pending:` and no number. */
export function generateAdr({ number, title, status, context, decision, consequences, outcome, alternatives, endsWhen, tags, date, author, pending = false }) {
  date ??= new Date().toISOString().slice(0, 10);
  const heading = pending ? `# Pending: ${title}` : `# ${String(number).padStart(3, "0")}: ${title}`;
  const lines = [

    heading,
    "",
    `- **Date**: ${date}`,
    `- **Status**: ${status}`,
    `- **Tags**: ${tags.join(", ")}`,
    `- **Author**: ${author || adrAuthor()}`,
    "",
    "## Context",
    "",
    context || "The forcing factors that led to this decision.",
    "",
    ...(outcome?.items?.length > 0
      ? [
          "## Outcome",
          "",
          ...outcome.items.map((item) => `- ${item}`),
          ...(outcome.total > outcome.items.length ? [`- ...and ${outcome.total - outcome.items.length} more step(s) in the closed record.`] : []),
          "",
        ]
      : []),
    "## Decision",
    "",
    decision || "The decision taken, and why.",
    "",
    "## Consequences",
    "",
    consequences || "What this costs and what it buys, both stated.",
    "",
    // Written now, because the assumptions a decision leans on are clear while
    // it is being taken and invisible a year later. Without it a reversal is
    // only ever noticed by accident.
    "## What would end this",
    "",
    endsWhen || "The assumption this leans on, and the observation that would make it wrong.",
    "",
  ];

  if (alternatives?.length > 0) {
    lines.push("## Alternatives Considered", "");

    for (const alt of alternatives) {
      lines.push(`1. ${alt}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/** Exported so the template can be asserted without writing a file. */
export function buildAdrBody(fields) {
  return generateAdr(fields);
}
