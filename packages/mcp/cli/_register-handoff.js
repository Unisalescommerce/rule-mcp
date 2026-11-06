/** The handoff command registrar. */

/** Register the `handoff` command. */
export function registerHandoffCommand(program) {
  program
    .command("handoff")
    .description("Generate a compressed LLM context handoff summary")
    .argument("[subcommand]", "doctor | land | compact | merge-index - repair numbering, number pending ADRs, close numbering holes, or regenerate a merge conflict index")
    .argument("[args...]", "merge-index receives %O %A %B %P from git")
    .option("--dir <path>", "project root (default: .)", ".")
    .option("--format <f>", "full (default), brief, minimal")
    .option("--compress", "aggressively truncate values")
    .option("--mode <m>", "handoff (default) or close-session")
    .option("--no-archive", "render without archiving completed docs or repairing the ADR numbering")
    .option("--fix", "apply the ADR renumber plan; with compact: close the holes and rewrite citations")
    .option("--fix-commits", "amend local commit messages to match renumbered ADRs")
    .option("--commit", "with land: commit the numbered ADRs")
    .option("--quiet", "with land: suppress progress")
    .allowExcessArguments(true)
    .action(async function handoffAction(subcommand, args, options) {
      if (subcommand === "doctor") {
        const { applyRenumber, planRenumber, renderRenumberPlan, rewriteCommitReferences } = await import("../core/docs-numbering/index.js");
        const projectDir = options.dir;
        const onProgress = ({ message }) => process.stdout.write(`  ${message}\n`);
        const plan = planRenumber({ projectDir, onProgress });
        process.stdout.write(`${renderRenumberPlan(plan, { fix: options.fix })}\n`);
        const authors = plan.authors?.length ?? 0;
        const somethingToFix = plan.renames.length > 0 || plan.indexUnordered || plan.indexStale || plan.handoffIndexUnordered || plan.handoffIndexStale || authors > 0;

        if (options.fixCommits) {
          const rewrite = rewriteCommitReferences(plan, { projectDir, onProgress });
          process.stdout.write(
            rewrite.refused ? `Commit messages left alone: ${rewrite.refused}.\n` : `Rewrote ${rewrite.rewritten} commit message(s); ${rewrite.skipped} left for a human.\n`,
          );
        }

        if (options.fix && somethingToFix) {
          const applied = applyRenumber(plan, { projectDir, onProgress });
          process.stdout.write(
            `Renumbered ${applied.renamed} document(s); ${applied.referencesUpdated} file(s) had references updated` +
              `${applied.indexRegenerated ? "; ADR.md regenerated" : ""}` +
              `${applied.handoffIndexRegenerated ? "; HANDOFF.md regenerated" : ""}` +
              `${applied.authorsNamed > 0 ? `; ${applied.authorsNamed} author(s) named` : ""}.\n`,
          );

          if (!options.fixCommits && plan.renames.length > 0) {
            process.stdout.write("Commit messages were not touched. Add --fix-commits to amend the local ones.\n");
          }
        }

        process.exitCode = somethingToFix && !options.fix ? 1 : 0;

        return;
      }

      if (subcommand === "compact") {
        // ADR 219: closing a hole moves every document after it, so it never
        // runs inside a handoff or a closeout. It is this command, it asks for
        // --fix, and it refuses to finish while a mention of a moved number is
        // still there in a form the rewrite does not own.
        const { applyRenumber, planRenumber } = await import("../core/docs-numbering/index.js");
        const projectDir = options.dir;
        const onProgress = ({ message }) => process.stdout.write(`  ${message}\n`);
        const plan = planRenumber({ projectDir, compact: true, onProgress });

        if (plan.gaps.length === 0) {
          process.stdout.write("No holes to close: the sequence is already dense.\n");

          return;
        }

        const holes = plan.gaps.map((gap) => gap.number).join(", ");

        process.stdout.write(`${plan.gaps.length} hole(s): ${holes}. ${plan.renames.length} document(s) would move.\n`);

        if (!options.fix) {
          process.stdout.write("Dry run. Add --fix to close the holes and rewrite the citations.\n");
          process.exitCode = 1;

          return;
        }

        const applied = applyRenumber(plan, { projectDir, onProgress });
        const { replacements, unresolved } = applied.citations ?? { replacements: 0, unresolved: [] };

        process.stdout.write(`Renumbered ${applied.renamed} document(s); ${replacements} citation(s) in ${applied.referencesUpdated} file(s).\n`);

        if (unresolved.length > 0) {
          process.stdout.write(`${unresolved.length} mention(s) of a moved number are left; fix them by hand:\n`);

          for (const entry of unresolved) {
            process.stdout.write(`  ${entry.file} names ${entry.number}\n`);
          }

          process.exitCode = 1;
        }

        return;
      }

      if (subcommand === "land") {
        const { landPendingAdrs, settleDuplicateAdrs, onTrunk } = await import("../core/docs/adr-pending/index.js");
        const projectDir = options.dir;

        if (onTrunk(projectDir)) {
          const result = landPendingAdrs(projectDir, { commit: Boolean(options.commit), quiet: Boolean(options.quiet) });

          if (!options.quiet) {
            if (result.skipped) {
              process.stdout.write(`Land skipped: ${result.skipped}\n`);
            } else if (result.landed.length === 0) {
              process.stdout.write("No pending ADRs to land.\n");
            } else {
              process.stdout.write(`Landed ${result.landed.length} ADR(s); ${result.referencesUpdated} file(s) updated` + `${result.committed ? "; committed" : ""}.\n`);
            }
          }
        } else {
          const settled = settleDuplicateAdrs(projectDir);

          if (!options.quiet) {
            process.stdout.write(
              settled.settled.length === 0
                ? "Off trunk: nothing to settle; pending ADRs keep their slugs.\n"
                : `Settled ${settled.settled.length} duplicate number(s) back into _pending.\n`,
            );
          }
        }

        return;
      }

      if (subcommand === "merge-index") {
        const [ancestor, ours, theirs, repoPath] = args ?? [];

        if (!ours || !repoPath) {
          process.stderr.write("usage: rule-mcp handoff merge-index <O> <A> <B> <P>\n");
          process.exitCode = 2;

          return;
        }

        const { mergeGeneratedIndex } = await import("../core/docs/adr-pending/index.js");
        const result = mergeGeneratedIndex(ancestor, ours, theirs, repoPath, { projectDir: options.dir });

        process.exitCode = result.regenerated ? 0 : 1;

        return;
      }

      const { registerHandoffTool } = await import("../tools/handoff/index.js");
      const { callTool: ct } = await import("../tools/router/index.js");
      registerHandoffTool();
      const handoffRes = await ct("rule_tool_handoff", {
        projectDir: options.dir,
        compress: options.compress,
        format: options.format ?? "full",
        mode: options.mode ?? "handoff",
        closeout: options.archive !== false,
      });

      process.stdout.write(`${handoffRes.content[0].text}\n`);
    });
}
