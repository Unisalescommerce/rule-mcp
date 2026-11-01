/**
 * @module cli/install/projects
 *
 * `~/.rule-mcp/state/projects.json` records each project-scope install so
 * refresh and uninstall can walk the same roots without re-detecting them.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { getRuntimePaths } from "../paths/index.js";

/** Schema version this tree writes. */
export const PROJECTS_VERSION = 1;

/** Absolute path of the projects store under the runtime state directory. */
export function projectsPath() {
  return join(getRuntimePaths().stateDir, "projects.json");
}

/** Empty store used when the file is missing or unreadable. */
function emptyStore() {
  return { version: PROJECTS_VERSION, projects: {} };
}

/**
 * Read the projects store, or an empty one when never written.
 *
 * @returns {{ version: number, projects: Record<string, object> }}
 */
export function readProjects() {
  try {
    const parsed = JSON.parse(readFileSync(projectsPath(), "utf8"));
    const projects = parsed.projects && typeof parsed.projects === "object" ? parsed.projects : {};

    return { version: PROJECTS_VERSION, projects };
  } catch {
    return emptyStore();
  }
}

/**
 * Merge unique string lists, sorted.
 *
 * @param {string[]} prior
 * @param {string[]} next
 * @returns {string[]}
 */
function mergeUnique(prior = [], next = []) {
  return [...new Set([...prior, ...next])].sort();
}

/**
 * Merge per-agent written path maps.
 *
 * @param {Record<string, string[]>} prior
 * @param {Record<string, string[]>} next
 * @returns {Record<string, string[]>}
 */
function mergeWritten(prior = {}, next = {}) {
  const agents = new Set([...Object.keys(prior), ...Object.keys(next)]);
  const merged = {};

  for (const agent of agents) {
    merged[agent] = mergeUnique(prior[agent], next[agent]);
  }

  return merged;
}

/**
 * Persist the store, or delete the file when no projects remain.
 *
 * @param {{ version: number, projects: Record<string, object> }} store
 * @param {boolean} dryRun
 */
function writeStore(store, dryRun) {
  if (dryRun) {
    return;
  }

  const path = projectsPath();

  if (Object.keys(store.projects).length === 0) {
    rmSync(path, { force: true });

    return;
  }

  mkdirSync(getRuntimePaths().stateDir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`);
}

/**
 * Record (or merge) one project-scope install.
 *
 * @param {{
 *   root: string,
 *   agents?: string[],
 *   projectConfig?: "shared"|"local",
 *   written?: Record<string, string[]>,
 *   dryRun?: boolean,
 * }} entry
 * @returns {object} the store as written (or as it would be, on dryRun)
 */
export function recordProject({ root, agents = [], projectConfig = "shared", written = {}, dryRun = false } = {}) {
  if (!root) {
    throw new Error("recordProject requires a project root");
  }

  const key = resolve(root);
  const store = readProjects();
  const prior = store.projects[key] ?? {};
  const next = {
    ...store,
    projects: {
      ...store.projects,
      [key]: {
        agents: mergeUnique(prior.agents, agents),
        projectConfig: projectConfig ?? prior.projectConfig ?? "shared",
        written: mergeWritten(prior.written, written),
        installedAt: new Date().toISOString(),
      },
    },
  };

  writeStore(next, dryRun);

  return next;
}

/**
 * Drop one project root from the store.
 *
 * @param {{ root: string, dryRun?: boolean }} options
 * @returns {object}
 */
export function forgetProject({ root, dryRun = false } = {}) {
  if (!root) {
    throw new Error("forgetProject requires a project root");
  }

  const key = resolve(root);
  const store = readProjects();
  const { [key]: _removed, ...projects } = store.projects;
  const next = { ...store, projects };

  writeStore(next, dryRun);

  return next;
}

/**
 * List recorded projects as `{ root, ...entry }` sorted by root.
 *
 * @returns {Array<{ root: string, agents: string[], projectConfig: string, written: object, installedAt: string }>}
 */
export function listProjects() {
  const { projects } = readProjects();

  return Object.keys(projects)
    .sort()
    .map((root) => ({ root, ...projects[root] }));
}

/** Whether any project install is recorded. */
export function hasProjects() {
  return existsSync(projectsPath()) && Object.keys(readProjects().projects).length > 0;
}
