#!/usr/bin/env node

/**
 * @module scripts/reports/census
 *
 * Generate the census: the numbered documents at the end of `docs/`.
 *
 * A census written by hand is a census that is wrong by the next commit. This
 * repository has already paid for that once - count claims in the docs that
 * disagreed with the runtime surface (ADR 041). So the inventory is derived,
 * and every file in `GENERATED_DOCS` is an output rather than a document.
 *
 * Everything is formatted here, with the repository's own prettier settings,
 * so the writer and `scripts/__tests__/docs/census-generated.test.mjs` compare the same
 * bytes: a census that drifts fails the build rather than misleading a reader.
 *
 * Usage:
 *   node scripts/reports/census/index.mjs            # write the files
 *   node scripts/reports/census/index.mjs --check    # exit 1 when one would change
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { GENERATED_DOCS } from "./_docs.mjs";
import { gather } from "./_gather.mjs";
import { DOCS } from "./_registries.mjs";
import { SNAPSHOT, readSnapshot, snapshotText } from "./_snapshot.mjs";

export { SNAPSHOT };

/** The current content of a document, or nothing when it does not exist yet. */
function read(file) {
  try {
    return readFileSync(join(DOCS, file), "utf8");
  } catch {
    return "";
  }
}

/**
 * Markdown, formatted the way every other document in the repository is.
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
async function format(text) {
  const prettier = await import("prettier");
  const options = await prettier.resolveConfig(join(DOCS, "README.md"));

  return prettier.format(text, { ...options, parser: "markdown" });
}

/**
 * Every file the census owns, with the content it should hold.
 *
 * @returns {Promise<Array<{file: string, content: string}>>}
 */
export async function censusOutputs() {
  const data = await gather();
  const outputs = [];

  for (const doc of GENERATED_DOCS) {
    outputs.push({ file: doc.file, content: await format(doc.build(data).join("\n")) });
  }

  return outputs;
}

/**
 * Write the census and its snapshot, returning the files that changed.
 *
 * @returns {Promise<string[]>}
 */
export async function writeCensus() {
  const changed = [];
  const outputs = await censusOutputs();

  for (const output of outputs) {
    if (read(output.file) === output.content) {
      continue;
    }

    writeFileSync(join(DOCS, output.file), output.content);
    changed.push(output.file);
  }

  const snapshot = snapshotText(outputs);

  if (readSnapshot() !== snapshot) {
    writeFileSync(SNAPSHOT, snapshot);
    changed.push("scripts/__tests__/fixtures/census.json");
  }

  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--check")) {
    const outputs = await censusOutputs();
    const stale = outputs.filter((output) => read(output.file) !== output.content).map((output) => `docs/${output.file}`);
    const snapshotStale = readSnapshot() !== snapshotText(outputs);

    if (stale.length === 0 && !snapshotStale) {
      console.log("the census is current");
    } else {
      const drifted = [...stale, ...(snapshotStale ? ["scripts/__tests__/fixtures/census.json"] : [])];

      console.error(`stale, run pnpm census: ${drifted.join(", ")}`);
      process.exitCode = 1;
    }
  } else {
    const changed = await writeCensus();

    console.log(changed.length === 0 ? "the census is already current" : `updated: ${changed.join(", ")}`);
  }
}
