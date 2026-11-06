/**
 * @module scripts/__tests__/docs/no-raw-html
 *
 * The documentation is Markdown and nothing else.
 *
 * The parser decides, not a pattern: `<slug>` in a code span is text, and the
 * same `<slug>` in a sentence is a tag that the site drops without a trace. The
 * ignored working papers are not in a fresh clone, so they are not read here.
 */

import { strict as assert } from "node:assert";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { marked } from "marked";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const WORKING_PAPERS = new Set(["plans", "audits", "reviews"]);

/** Every Markdown file under one directory, without the working papers. */
function markdownUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return WORKING_PAPERS.has(name) ? [] : markdownUnder(path);
    }

    return name.endsWith(".md") ? [path] : [];
  });
}

/** The raw HTML the parser finds in one document. */
function rawHtml(text) {
  const found = [];

  marked.walkTokens(marked.lexer(text), (token) => {
    if (token.type === "html") {
      found.push(token.raw.trim().split("\n", 1)[0]);
    }
  });

  return found;
}

test("the scan sees a tag, a comment and a bare placeholder, and leaves code alone", () => {
  assert.equal(rawHtml("<section>x</section>\n").length > 0, true);
  assert.equal(rawHtml("<!-- note -->\n").length > 0, true);
  assert.equal(rawHtml("Pass <slug> here.\n").length > 0, true);
  assert.deepEqual(rawHtml("Pass `<slug>` here.\n\n```html\n<p>x</p>\n```\n"), []);
});

test("the README and every document in docs/ hold no raw HTML", () => {
  const files = [join(root, "README.md"), ...markdownUnder(join(root, "docs"))];
  const offenders = files.flatMap((file) => rawHtml(readFileSync(file, "utf8")).map((html) => `${relative(root, file).split(sep).join("/")}: ${html}`));

  assert.deepEqual(offenders, [], "write Markdown; a placeholder goes in a code span");
});
