/** The Scope step: where this install writes, and where inside the project. */

import { resolve } from "node:path";

import { BACK, CANCEL } from "./_answers.js";
import { projectConfigItems, scopeItems } from "./_items.js";

/**
 * Ask where the install goes, then which projects and which kind.
 *
 * The current directory is offered as the first project, so a project install is
 * two answers on a fresh checkout; `p` is the row that takes a typed path
 * instead, and every extra path is appended to the same list.
 *
 * @param {{ screen: object, answers: object }} context
 * @returns {Promise<unknown>} an answer to take for navigation, or undefined to continue
 */
export async function askScope({ screen, answers }) {
  const scope = await screen.ask({
    title: "Where does this install write?",
    help: ["Global writes your own agent configs. Project writes only into the repositories you name."],
    items: scopeItems(),
    mode: "radio",
    initial: [answers.scope ?? "global"],
    height: 6,
  });

  if (scope === CANCEL || scope === BACK) {
    return scope;
  }

  answers.scope = scope;

  if (scope === "global") {
    answers.projects = [];
    answers.projectConfig = "shared";

    return;
  }

  const picked = await screen.ask({
    title: "Which projects?",
    help: ["The current directory is offered. Pick `p` to type another root."],
    items: [
      { id: "cwd", label: `This directory: ${resolve(process.cwd())}`, note: "offered", detail: [] },
      { id: "p", label: "Add a path", note: "type a root", detail: ["Absolute or relative to the current directory."] },
    ],
    mode: "check",
    initial: ["cwd"],
  });

  if (picked === CANCEL || picked === BACK) {
    return picked;
  }

  const chosen = Array.isArray(picked) ? picked : [picked];
  const projects = chosen.includes("cwd") ? [resolve(process.cwd())] : [];

  if (chosen.includes("p")) {
    // The field refuses a path that is not a folder, so no answer here can put
    // the plan inside a directory that does not exist.
    const typed = await screen.askPath({
      title: "Project root",
      help: ["Tab lists the folders here, and applies the row you pick. Enter accepts a full path."],
    });

    if (typed === CANCEL || typed === BACK) {
      return typed;
    }

    projects.push(resolve(String(typed)));
  }

  answers.projects = projects;

  const projectConfig = await screen.ask({
    title: "Which project config?",
    help: ["Shared is portable, no machine paths. Local carries the full launcher for this machine only."],
    items: projectConfigItems(),
    mode: "radio",
    initial: [answers.projectConfig ?? "shared"],
    height: 6,
  });

  if (projectConfig === CANCEL || projectConfig === BACK) {
    return projectConfig;
  }

  answers.projectConfig = projectConfig;

  return;
}
