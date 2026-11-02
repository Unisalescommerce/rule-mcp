/**
 * @module tools/handoff/closeout-scan
 *
 * Which working papers are finished.
 *
 * A plan is finished when its `Status:` line says so and no step is open; a
 * review is finished when its Status column has no open row; an audit rides on
 * a finished review of the same name. Detection is read-only: nothing here
 * writes to disk.
 */
import { readFileSync } from "node:fs";
import { join, parse } from "node:path";

import { countMatches, dateOf, markdownFiles, titleOf } from "./_closeout-docs.js";

/** Working-paper kinds that close out, in archive order. */
export const KINDS = ["plans", "reviews", "audits"];

/** Statuses that mean the record is implemented. ADR 154 makes the line mandatory. */
const DONE_STATUS = new Set(["done", "complete", "completed", "closed"]);

/** Remove fenced blocks: a checkbox quoted as an example is not a step. */
export function stripFenced(text) {
  const kept = [];
  let fence = null;

  for (const line of text.split("\n")) {
    const marker = /^\s*(```+|~~~+)/.exec(line)?.[1];

    if (marker) {
      const char = marker[0];

      if (fence === null) {
        fence = char;
      } else if (fence === char) {
        fence = null;
      }

      continue;
    }

    if (fence === null) {
      kept.push(line);
    }
  }

  return kept.join("\n");
}

/** The value of the `Status:` line, lower-cased, or "". */
export function planStatus(text) {
  return (text.match(/^Status:\s*`?([a-z-]+)`?/im)?.[1] ?? "").toLowerCase();
}

/** The closed steps a plan carries, in order, without markers. */
export function closedSteps(text) {
  return stripFenced(text)
    .split("\n")

    .filter((line) => /^\s*-\s*\[[xX]\]/.test(line))

    .map((line) =>
      line
        .replace(/^\s*-\s*\[[xX]\]\s*/, "")
        .replaceAll("**", "")
        .replaceAll("`", "")
        .trim(),
    )

    .filter(Boolean);
}

/** True when a plan is implemented: done status, one closed step, none open. */
export function planDone(text) {
  const boxes = stripFenced(text).match(/^\s*-\s*\[[ xX]\]/gm) ?? [];

  return DONE_STATUS.has(planStatus(text)) && boxes.some((line) => /\[[xX]\]/.test(line)) && !boxes.some((line) => /\[ \]/.test(line));
}

/** True when a review shows a Status column and no open row. */
export function reviewDone(text) {
  return /\|\s*Status\s*\|/.test(text) && !/\|\s*open\s*\|/.test(text);
}

/** Read-only scan: every completed doc with its size, never touching disk. */
export function findCompletedDocs(projectDir) {
  const read = (kind, file) => {
    try {
      return readFileSync(join(projectDir, "docs", kind, file), "utf8");
    } catch {
      return "";
    }
  };
  const reviewState = new Map();

  for (const file of markdownFiles(join(projectDir, "docs", "reviews"))) {
    const text = read("reviews", file);

    reviewState.set(parse(file).name, { done: reviewDone(text), resolved: countMatches(text, /\|\s*resolved\s*\|/g) });
  }

  const done = [];

  for (const kind of KINDS) {
    for (const file of markdownFiles(join(projectDir, "docs", kind))) {
      const text = read(kind, file);
      const name = parse(file).name;
      const review = reviewState.get(name);
      const complete = kind === "plans" ? planDone(text) : Boolean(review?.done);

      if (!complete) {
        continue;
      }

      const items = kind === "plans" ? closedSteps(text).length : (review?.resolved ?? 0);

      done.push({ kind, name, path: `docs/${kind}/${file}`, title: titleOf(text, name), date: dateOf(text), items });
    }
  }

  return done;
}
