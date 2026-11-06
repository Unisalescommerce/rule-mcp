/**
 * ARCH-1: the invocation path must stay acyclic. Tool invocation, skill loading,
 * self-update and the gateway import each other through an `@mcp/` alias and
 * `await import(...)`; the code graph models neither, so this walks the edges.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Every source file under dir, repo-relative, tests excluded. */
function sourceFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") {
        sourceFiles(path, files);
      }
    } else if (/\.m?js$/.test(entry.name)) {
      files.push(relative(root, path).replaceAll("\\", "/"));
    }
  }

  return files;
}

const FROM = /\bfrom\s*["']([^"']+)["']/g;
const DYNAMIC = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

/** Import specifiers in a source file: static `from "x"` and `import("x")`. */
function specifiers(text) {
  const found = [];

  for (const re of [FROM, DYNAMIC]) {
    for (const match of text.matchAll(re)) {
      found.push(match[1]);
    }
  }

  return found;
}

/** The repo-relative file a specifier names, or null when it is not our source. */
function resolveSpecifier(fromFile, specifier) {
  let target;

  if (specifier.startsWith("@mcp/")) {
    target = join(root, "packages", "mcp", specifier.slice("@mcp/".length));
  } else if (specifier.startsWith(".")) {
    target = resolve(root, dirname(fromFile), specifier);
  } else {
    return null;
  }

  const candidate = relative(root, target).replaceAll("\\", "/");

  return existsSync(join(root, candidate)) ? candidate : null;
}

const files = sourceFiles(join(root, "packages", "mcp"));
const graph = new Map(
  files.map((file) => [
    file,
    specifiers(readFileSync(join(root, file), "utf8"))
      .map((s) => resolveSpecifier(file, s))
      .filter(Boolean),
  ]),
);

/** Every file reachable from the given start files, following imports. */
function reachableFrom(startFiles) {
  const seen = new Set();
  const queue = [...startFiles];

  while (queue.length > 0) {
    const file = queue.pop();

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);

    for (const next of graph.get(file) ?? []) {
      if (!seen.has(next)) {
        queue.push(next);
      }
    }
  }

  return seen;
}

/** The files under a directory prefix. */
const under = (prefix) => files.filter((file) => file.startsWith(prefix));

/** The reachable files that live under one of the given prefixes. */
function offenders(startFiles, prefixes) {
  return [...reachableFrom(startFiles)].filter((file) => prefixes.some((prefix) => file.startsWith(prefix))).sort();
}

test("the graph resolves both specifier forms", () => {
  // Without this, every invariant below would pass on an empty graph.
  assert.ok(graph.get("packages/mcp/tools/router/call/_stages.js").includes("packages/mcp/core/cache/tool-cache/index.js"), "the @mcp/ alias must resolve to a file");
  assert.ok(graph.get("packages/mcp/cli/commands/_help.js").includes("packages/mcp/core/skills/index.js"), "a dynamic import must resolve to a file");
});

test("self-update reaches the reload port and nothing else in the catalog", () => {
  assert.deepEqual(
    offenders(under("packages/mcp/core/self-update/"), ["packages/mcp/core/skills/"]),
    ["packages/mcp/core/skills/_reload-port.js"],
    "self-update depends on the port, never on the loader",
  );
});

test("the invocation pipeline never reaches self-update", () => {
  const reached = offenders(["packages/mcp/tools/router/call/_pipeline.js"], ["packages/mcp/core/self-update/"]);

  assert.deepEqual(reached, [], "a tool call must not pull the updater in behind it");
  assert.ok(graph.get("packages/mcp/tools/router/call/_pipeline.js").includes("packages/mcp/tools/router/call/_host.js"), "and it must ask the host");
});

test("the skill catalog never reaches the gateway or the apply tool", () => {
  assert.deepEqual(
    offenders(["packages/mcp/core/skills/_load.js"], ["packages/mcp/tools/gateway/", "packages/mcp/tools/apply/"]),
    [],
    "the bootstrap registers those, not loadAllSkills",
  );
});

test("the search index never reaches the loader", () => {
  // _load.js builds the index and the index reads the skill bodies, so the two
  // modules touch each other. Drawing the index's edge to the skills *barrel*
  // is what turns that into a cycle: the barrel re-exports the loader.
  assert.deepEqual(
    offenders(under("packages/mcp/core/bm25/"), ["packages/mcp/core/skills/_load.js"]),
    [],
    "the index takes the skill cache from its own module, not from the catalog's barrel",
  );
});

test("the loader imports the whole catalog statically", () => {
  const loader = readFileSync(join(root, "packages/mcp/core/skills/_load.js"), "utf8");

  assert.doesNotMatch(loader, /await import\(\s*["']/, "no edge may hide behind a dynamic import in the loader");
});
