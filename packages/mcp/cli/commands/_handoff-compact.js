/**
 * @module cli/commands/handoff-compact
 *
 * `rule-mcp handoff compact`: close the holes in the ADR and handoff sequences.
 *
 * Closing a hole moves every document after it, so this never runs inside a
 * handoff or a closeout (ADR 210). It asks for `--fix`, and it refuses to
 * finish while a mention of a moved number is still there in a form the
 * citation rewrite does not own.
 */

/**
 * Plan the compaction, and apply it when asked.
 *
 * @param {{ projectDir?: string, fix?: boolean, write?: Function }} [options]
 * @returns {{ exitCode: number }}
 */
export async function runHandoffCompact({ projectDir = ".", fix = false, write = (text) => process.stdout.write(text) } = {}) {
  const { applyRenumber, planRenumber } = await import("../../core/docs-numbering/index.js");
  const onProgress = ({ message }) => write(`  ${message}\n`);
  const plan = planRenumber({ projectDir, compact: true, onProgress });

  if (plan.gaps.length === 0) {
    write("No holes to close: the sequence is already dense.\n");

    return { exitCode: 0 };
  }

  const holes = plan.gaps.map((gap) => gap.number).join(", ");

  write(`${plan.gaps.length} hole(s): ${holes}. ${plan.renames.length} document(s) would move.\n`);

  if (!fix) {
    write("Dry run. Add --fix to close the holes and rewrite the citations.\n");

    return { exitCode: 1 };
  }

  const applied = applyRenumber(plan, { projectDir, onProgress });
  const { replacements, unresolved } = applied.citations ?? { replacements: 0, unresolved: [] };

  write(`Renumbered ${applied.renamed} document(s); ${replacements} citation(s) in ${applied.referencesUpdated} file(s).\n`);

  if (unresolved.length === 0) {
    return { exitCode: 0 };
  }

  write(`${unresolved.length} mention(s) of a moved number are left; fix them by hand:\n`);

  for (const entry of unresolved) {
    write(`  ${entry.file} names ${entry.number}\n`);
  }

  return { exitCode: 1 };
}
