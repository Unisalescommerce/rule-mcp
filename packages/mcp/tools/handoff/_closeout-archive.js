/**
@module tools/handoff/closeout-archive

Folding a finished record into an ADR, and reporting the sweep.

One ADR per doc, the source deleted, the plan indexes retired. `apply: false`
reports exactly the same list and writes nothing, so a caller can preview the
closeout without a second code path.
*/
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { updateAdrIndex } from "../adr/_adr-index.js";
import { adrAuthor } from "../adr/_author.js";
import { generateAdr } from "../adr/_body.js";
import { adrEnglishOffenses } from "../adr/_english.js";
import { ADR_DIR, adrFilename, listExistingAdrs, nextAdrNumber } from "../adr/_files.js";
import { planNodeId, retireFromPlanIndexes } from "./_plan-index.js";
import { planHandoffName, writePlanHandoff } from "./_closeout-handoff.js";
import { closedSteps, findCompletedDocs } from "./_closeout-scan.js";

/** Outcome steps an ADR carries before it summarizes the rest. */
const OUTCOME_LIMIT = 20;

/** The ADR fields one archived doc folds into. The source title rides along. */
function closeoutFields(doc, text) {
  const kind = doc.kind.slice(0, -1);
  const when = doc.date ? ` on ${doc.date}` : "";
  const steps = doc.kind === "plans" ? closedSteps(text) : [];

  return {
    title: `Close out ${kind} ${doc.name}`,
    context: `The ${kind} record ${doc.path}, "${doc.title}", finished with ${doc.items} closed items${when}.`,
    decision: "Fold the record into this ADR and the session handoff, then delete the source file. The full text stays in git history.",
    consequences: `${doc.path} is gone from the tree; this ADR keeps what it delivered and the handoff of this session names it.`,
    outcome: steps.length > 0 ? { items: steps.slice(0, OUTCOME_LIMIT), total: steps.length } : null,
    endsWhen: `The work this ${kind} closed returns: a step it dismissed reopens, and this ADR no longer explains why.`,
    alternatives: [],
    tags: ["docs", "closeout", kind],
  };
}

/**
Archive every completed doc: one ADR each, a refreshed index, the source
deleted, and the plan indexes retired. `apply: false` reports the same list
and writes nothing.
*/
export function archiveCompletedDocs(projectDir, { author, apply = true } = {}) {
  const archived = [];
  const skipped = [];
  const adrDir = join(projectDir, ADR_DIR);
  let nextNumber = nextAdrNumber(adrDir);

  for (const doc of findCompletedDocs(projectDir)) {
    const text = readFileSync(join(projectDir, doc.path), "utf8");
    const fields = closeoutFields(doc, text);
    const offenses = adrEnglishOffenses({ ...fields, outcome: (fields.outcome?.items ?? []).join("\n") });

    if (offenses.length > 0) {
      skipped.push({ path: doc.path, reason: `non-English content fails the ADR gate (${offenses[0]})` });
      continue;
    }

    const number = nextNumber;
    const adrFile = adrFilename(number, fields.title);
    const handoffPath = doc.kind === "plans" ? `${"docs/handoff/plans"}/${planHandoffName(doc)}` : null;

    if (apply) {
      mkdirSync(adrDir, { recursive: true });
      writeFileSync(join(adrDir, adrFile), generateAdr({ number, status: "accepted", author: author || adrAuthor(), ...fields }));

      if (handoffPath) {
        writePlanHandoff(projectDir, { doc, number, adrFile, steps: fields.outcome?.items ?? [], date: doc.date });
      }

      const filename = doc.path.startsWith("docs/plans/") ? doc.path.slice("docs/plans/".length) : null;

      if (filename) {
        retireFromPlanIndexes(projectDir, {
          filename,
          nodeId: planNodeId(filename),
          label: doc.name.replace(/^_/u, "").replaceAll("-", " "),
          adrNumber: number,
          adrFile,
        });
      }

      rmSync(join(projectDir, doc.path));
    }

    // The number advances in preview too, so the report does not show the same
    // prospective ADR number for every candidate.
    nextNumber = number + 1;
    archived.push({ ...doc, adrNumber: number, adrFile, handoffPath });
  }

  if (apply && archived.length > 0) {
    updateAdrIndex(adrDir, listExistingAdrs(adrDir));
  }

  return { archived, skipped, preview: !apply };
}

/** The handoff section naming what the run archived and what it kept. */
export function closeoutLines(closeout, { isMinimal, heading = "###" }) {
  if (!closeout || isMinimal || (closeout.archived.length === 0 && closeout.skipped.length === 0)) {
    return [];
  }

  const title = closeout.preview ? `${heading} Closeout (preview)` : `${heading} Closeout`;
  const archived = closeout.archived.map((doc) => {
    const label = `\`${doc.path}\` → ADR ${String(doc.adrNumber).padStart(3, "0")} (\`${doc.adrFile}\`)`;
    const handoff = doc.handoffPath ? `; handoff \`${doc.handoffPath}\`` : "";
    const tail = doc.kind === "plans" ? `source file deleted; plan indexes retired${handoff}.` : "source file deleted.";

    return closeout.preview ? `- Would archive ${label}${handoff}; source kept.` : `- Archived ${label}; ${tail}`;
  });

  return [title, "", ...archived, ...closeout.skipped.map((doc) => `- Skipped \`${doc.path}\`: ${doc.reason}; file kept.`), ""];
}
