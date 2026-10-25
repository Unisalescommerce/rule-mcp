/**
 * @module cli/setup/opentui/wizard
 *
 * The install and uninstall flows, as code that reads top to bottom.
 *
 * The flow talks to a screen port, never to OpenTUI: `setStep`, `ask`,
 * `confirm` and `progress` are the whole surface (see `_screen.js` for the
 * adapter). That is what lets a test drive the real flow with a fake screen -
 * every question and every sentence is asserted without a terminal.
 *
 * Back is a step index and a jump table rather than per-screen state: a step
 * that answers `BACK` decrements the index, and the flow re-asks whatever was
 * there. Nothing is written until the review is confirmed.
 */

import { DIMENSIONS, resolveProfile } from "../../install/_profiles.js";
import { depthItems } from "./_items.js";
import { readManifest } from "../../install/_manifest.js";
import { agentRows } from "../_agent-rows.js";
import { selectionLabel } from "../_commands-items.js";
import { installNextSteps, uninstallNextSteps } from "../_next-steps.js";
import { buildInstallPlan } from "../_plan-install.js";
import { buildUninstallPlan } from "../_plan-uninstall.js";
import { preflight } from "../_preflight.js";
import { runPlan, TASK_PENDING, tally } from "../_run-plan.js";
import { installableTargets } from "../_rules-apply.js";
import { scanInstallation } from "../_scan.js";
import { GLYPHS } from "../_theme.js";
import { BACK, CANCEL } from "./_answers.js";
import {
  doneLines,
  dimensionItems,
  modeItems,
  preflightLines,
  profileItems,
  progressRows,
  purgeItems,
  reviewLines,
  selectionFromSurface,
  surfaceAreaItems,
  surfaceItems,
  surfaceLabel,
  surfaceSkillItems,
  uninstallItems,
} from "./_items.js";

/** The rail labels, in the order the wizard lights them. */
export const INSTALL_STEPS = ["Preflight", "Profile", "Agents", "Depth", "Transport", "Surface", "Review", "Install", "Done"];

/** The uninstall rail, in the same order. */
export const UNINSTALL_STEPS = ["Select", "Purge", "Review", "Remove", "Done"];

/** Where each install step sits on that rail. */
const INSTALL_RAIL = { preflight: 0, profile: 1, agents: 2, depth: 3, transport: 4, surface: 5, review: 6, install: 7, done: 8 };

/** Where each uninstall step sits on that rail. */
const UNINSTALL_RAIL = { select: 0, purge: 1, review: 2, remove: 3, done: 4 };

/**
 * The install steps, always the same order.
 *
 * Surface is the only place that picks a tier: the slash-command files follow
 * that answer, so there is no separate Commands screen (ADR 178).
 *
 * @returns {string[]}
 */
export function installOrder() {
  return ["preflight", "profile", "agents", "depth", "transport", "surface", "review"];
}

/**
 * The uninstall steps this machine needs.
 *
 * @param {{ hasPurge?: boolean }} [options]
 * @returns {string[]}
 */
export function uninstallOrder({ hasPurge = false } = {}) {
  return ["select", ...(hasPurge ? ["purge"] : []), "review"];
}

/** The dimensions map the manifest records. */
const dimensionMap = (dimensions) => Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, dimensions.includes(dimension)]));

/** The plan the review screen lists and the run executes. */
const installPlan = ({ answers, context, force, minimal }) =>
  buildInstallPlan({
    agents: answers.dimensions.includes("server") ? answers.agents : [],
    mode: answers.mode,
    extras: {
      rules: answers.dimensions.includes("rules"),
      commands: answers.dimensions.includes("commands"),
      // A level below L3 does not ask for hooks, and the dimension list cannot
      // put one back: the confirmation is the level, not the checkbox.
      hooks: answers.dimensions.includes("hooks") && (answers.level === "auto" || answers.level === undefined || Number(answers.level.slice(1)) >= 3),
      doctor: answers.dimensions.includes("doctor"),
      // The platform service belongs to daemon mode and is automatic there.
      service: answers.mode === "daemon",
    },
    force,
    context,
    selection: answers.selection,
    minimal,
    surface: answers.surface,
    profile: answers.profile,
    dimensions: dimensionMap(answers.dimensions),
  });

/** A plan as pending rows, for the frame before the first task starts. */
const pendingRows = (plan) => progressRows(plan.map((task) => ({ ...task, status: TASK_PENDING, summary: "" })));

/** How many tasks are neither pending nor running. */
const finished = (results) => results.filter((task) => task.status !== TASK_PENDING && task.status !== "running").length;

/**
 * Run the install wizard.
 *
 * @param {{ screen: object, defaults?: object }} options
 * @returns {Promise<{ results: object[], dryRun: boolean }|null>} null when the user quit
 */
export async function runInstallWizard({ screen, defaults = {} }) {
  const { checks, context } = preflight();
  const catalog = agentRows();
  const ruleFiles = installableTargets(undefined, defaults.agents ?? catalog.detected).map((target) => target.file);

  const answers = {
    profile: defaults.profile ?? null,
    dimensions: defaults.dimensions ?? null,
    agents: defaults.agents ?? catalog.detected,
    mode: defaults.mode ?? "stdio",
    surface: defaults.surface ?? null,
    selection: defaults.selection ?? null,
    dryRun: Boolean(defaults.dryRun),
  };

  const order = installOrder();
  let index = 0;

  /** One screen, and the answer it produced. */
  const askStep = async (step) => {
    switch (step) {
      case "preflight": {
        const action = await screen.confirm({
          title: "Environment",
          blocked: context.blocked,
          lines: [
            ...preflightLines(checks),
            { text: "" },
            context.blocked
              ? { text: `${GLYPHS.fail} Fix the failures above before installing.`, tone: "fail" }
              : { text: `${GLYPHS.arrow} Press Enter to choose an installation profile.`, tone: "muted" },
          ],
          actions: [{ key: "return", label: context.blocked ? "quit" : "next", value: "next" }],
        });

        if (action === CANCEL || action === BACK || context.blocked) {
          return CANCEL;
        }

        return undefined;
      }

      case "profile": {
        const profile = await screen.ask({
          title: "Which installation profile?",
          help: ["One profile chooses the server, the rules, the commands, the hooks and the health check together."],
          items: profileItems(),
          mode: "radio",
          initial: [answers.profile ?? "standard"],
        });

        if (profile === CANCEL || profile === BACK) {
          return profile;
        }

        answers.profile = profile;

        if (profile === "custom") {
          const chosen = await screen.ask({
            title: "What should this install write?",
            help: ["Space toggles a dimension. Every row says what it writes on this machine."],
            items: dimensionItems({ agents: answers.agents, ruleFiles }),
            mode: "check",
            initial: answers.dimensions ?? DIMENSIONS,
            height: 8,
          });

          if (chosen === CANCEL || chosen === BACK) {
            return chosen;
          }

          answers.dimensions = chosen;
        } else {
          answers.dimensions = resolveProfile(profile).dimensions;
        }

        answers.surface = answers.surface ?? { preset: resolveProfile(profile).surface };
        answers.selection = answers.selection ?? selectionFromSurface(answers.surface);

        return undefined;
      }

      case "agents": {
        const picked = await screen.ask({
          title: "Which agents get the MCP entry?",
          help: ["Detected agents start ticked; everything else stays reachable so the choice is yours."],
          items: catalog.items,
          mode: "check",
          initial: answers.agents,
        });

        if (picked === CANCEL || picked === BACK) {
          return picked;
        }

        answers.agents = picked;

        return undefined;
      }

      case "depth": {
        const level = await screen.ask({
          title: "How deep should the integration go?",
          help: [
            "A level is a cap, not a promise: each host installs the rungs it supports up to it.",
            "The ceiling beside every host on the previous screen is what it can reach.",
          ],
          items: depthItems(answers.agents),
          mode: "radio",
          initial: [answers.level ?? "auto"],
          height: 6,
        });

        if (level === CANCEL || level === BACK) {
          return level;
        }

        answers.level = level;

        return undefined;
      }

      case "transport": {
        const mode = await screen.ask({
          title: "How do the agents reach the server?",
          help: ["Every agent supports stdio. The remote modes are offered with the hosts that document them."],
          items: modeItems(answers.agents),
          mode: "radio",
          initial: [answers.mode],
          height: 6,
        });

        if (mode === CANCEL || mode === BACK) {
          return mode;
        }

        answers.mode = mode;

        return undefined;
      }

      case "surface": {
        const preset = await screen.ask({
          title: "Which surface?",
          help: ["One tier for the tools the server exposes and the slash commands it writes."],
          items: surfaceItems(),
          mode: "radio",
          initial: [answers.surface?.preset ?? resolveProfile(answers.profile).surface],
        });

        if (preset === CANCEL || preset === BACK) {
          return preset;
        }

        if (preset !== "custom") {
          answers.surface = { preset };
          answers.selection = selectionFromSurface(answers.surface);

          return undefined;
        }

        const areas = await screen.ask({
          title: "Which areas?",
          help: ["The area hubs are kept either way. The same choice picks the slash commands."],
          items: surfaceAreaItems(),
          mode: "check",
          initial: answers.surface?.areas ?? surfaceAreaItems().map((item) => item.id),
        });

        if (areas === CANCEL || areas === BACK) {
          return areas;
        }

        if (areas.length === 0) {
          answers.surface = { areas };
          answers.selection = selectionFromSurface(answers.surface);

          return undefined;
        }

        const skills = surfaceSkillItems(areas);
        const picked = await screen.ask({
          title: "Which skills? (the area hubs are kept either way)",
          items: skills,
          mode: "check",
          initial: skills.map((item) => item.id),
        });

        if (picked === CANCEL || picked === BACK) {
          return picked;
        }

        answers.surface = picked.length === skills.length ? { areas } : { skills: picked };
        answers.selection = selectionFromSurface(answers.surface);

        return undefined;
      }

      case "review": {
        const plan = installPlan({ answers, context, force: Boolean(defaults.force), minimal: defaults.minimal });

        for (;;) {
          const action = await screen.confirm({
            title: "Review",
            lines: [
              { text: `Profile: ${answers.profile} - ${answers.dimensions.join(", ") || "nothing"}`, tone: "muted" },
              { text: `Surface: ${surfaceLabel(answers.surface)} - commands ${selectionLabel(answers.selection)}`, tone: "muted" },
              { text: "" },
              ...reviewLines(plan, { dryRun: answers.dryRun }),
            ],
            actions: [
              { key: "d", label: "toggle dry run", value: "dry" },
              { key: "return", label: answers.dryRun ? "keep it a dry run" : "run it", value: "run" },
            ],
          });

          if (action === CANCEL || action === BACK) {
            return action;
          }

          if (action === "dry") {
            answers.dryRun = !answers.dryRun;
            continue;
          }

          answers.plan = plan;

          return undefined;
        }
      }

      default: {
        return CANCEL;
      }
    }
  };

  while (index < order.length) {
    const step = order[index];

    screen.setStep(INSTALL_RAIL[step]);

    const answer = await askStep(step);

    if (answer === CANCEL) {
      return null;
    }

    if (answer === BACK) {
      index = Math.max(0, index - 1);
      continue;
    }

    index += 1;
  }

  const plan = answers.plan ?? installPlan({ answers, context, force: Boolean(defaults.force), minimal: defaults.minimal });
  const title = answers.dryRun ? "Dry run" : "Installing";

  screen.setStep(INSTALL_RAIL.install);
  screen.progress({ title, rows: pendingRows(plan), done: 0 });

  const results = await runPlan(plan, {
    dryRun: answers.dryRun,
    onUpdate: (current) => screen.progress({ title, rows: progressRows(current), done: finished(current) }),
  });
  const summary = doneLines({ counts: tally(results), results, dryRun: answers.dryRun, nextSteps: installNextSteps({ mode: answers.mode, dryRun: answers.dryRun }) });

  screen.setStep(INSTALL_RAIL.done);
  await screen.confirm({
    title: summary.heading,
    lines: summary.lines,
    actions: [{ key: "return", label: "close", value: "close" }],
    copy: [summary.heading, ...summary.lines.map((line) => line.text)].join("\n"),
  });

  return { results, dryRun: answers.dryRun };
}

/**
 * Run the uninstall wizard.
 *
 * @param {{ screen: object, defaults?: object }} options
 * @returns {Promise<{ results: object[], dryRun: boolean }|null>} null when the user quit
 */
export async function runUninstallWizard({ screen, defaults = {} }) {
  const scan = scanInstallation();
  const offered = uninstallItems({ manifest: readManifest(), groups: scan.groups });
  const answers = {
    groups: defaults.groups ?? offered.filter((item) => item.count > 0).map((item) => item.id),
    purgeIds: defaults.purgeIds ?? (defaults.purge ? scan.purge.map((target) => target.id) : []),
    dryRun: Boolean(defaults.dryRun),
  };

  if (offered.length === 0) {
    screen.setStep(UNINSTALL_RAIL.select);
    await screen.confirm({
      title: "Nothing to remove",
      lines: [{ text: "No agent config, instruction file or manifest entry for this server was found.", tone: "muted" }],
      actions: [{ key: "return", label: "close", value: "close" }],
    });

    return { results: [], dryRun: answers.dryRun };
  }

  const purgeRows = purgeItems(scan.purge);
  const order = uninstallOrder({ hasPurge: purgeRows.length > 0 });
  let index = 0;

  const plan = () => buildUninstallPlan({ agents: scan.agents, groups: answers.groups, purgeIds: answers.purgeIds });

  const askStep = async (step) => {
    switch (step) {
      case "select": {
        const picked = await screen.ask({
          title: "What to remove",
          help: ["Every dimension the manifest recorded is ticked. Space toggles one off."],
          items: offered,
          mode: "check",
          initial: answers.groups,
          height: 10,
        });

        if (picked === CANCEL || picked === BACK) {
          return picked;
        }

        answers.groups = picked;

        return undefined;
      }

      case "purge": {
        const picked = await screen.ask({
          title: "Purge state and config",
          help: ["Everything here is kept unless you tick it. Purging deletes it permanently."],
          items: purgeRows,
          mode: "check",
          initial: answers.purgeIds,
          height: 5,
        });

        if (picked === CANCEL || picked === BACK) {
          return picked;
        }

        answers.purgeIds = picked;

        return undefined;
      }

      case "review": {
        const steps = plan();

        for (;;) {
          const action = await screen.confirm({
            title: "Review removal",
            lines: [
              { text: `Removing: ${answers.groups.join(", ") || "nothing"}`, tone: "muted" },
              { text: `Purging: ${answers.purgeIds.length > 0 ? answers.purgeIds.join(", ") : "nothing"}`, tone: "muted" },
              { text: "" },
              ...reviewLines(steps, { dryRun: answers.dryRun, danger: true }),
            ],
            actions: [
              { key: "d", label: "toggle dry run", value: "dry" },
              { key: "return", label: answers.dryRun ? "keep it a dry run" : "remove it", value: "run" },
            ],
          });

          if (action === CANCEL || action === BACK) {
            return action;
          }

          if (action === "dry") {
            answers.dryRun = !answers.dryRun;
            continue;
          }

          answers.plan = steps;

          return undefined;
        }
      }

      default: {
        return CANCEL;
      }
    }
  };

  while (index < order.length) {
    const step = order[index];

    screen.setStep(UNINSTALL_RAIL[step]);

    const answer = await askStep(step);

    if (answer === CANCEL) {
      return null;
    }

    if (answer === BACK) {
      index = Math.max(0, index - 1);
      continue;
    }

    index += 1;
  }

  const steps = answers.plan ?? plan();
  const title = answers.dryRun ? "Dry run" : "Removing";

  screen.setStep(UNINSTALL_RAIL.remove);
  screen.progress({ title, rows: pendingRows(steps), done: 0 });

  const results = await runPlan(steps, {
    dryRun: answers.dryRun,
    onUpdate: (current) => screen.progress({ title, rows: progressRows(current), done: finished(current) }),
  });
  const summary = doneLines({
    counts: tally(results),
    results,
    dryRun: answers.dryRun,
    nextSteps: uninstallNextSteps({ dryRun: answers.dryRun, purged: answers.purgeIds.length > 0 }),
  });

  screen.setStep(UNINSTALL_RAIL.done);
  await screen.confirm({
    title: summary.heading,
    lines: summary.lines,
    actions: [{ key: "return", label: "close", value: "close" }],
    copy: [summary.heading, ...summary.lines.map((line) => line.text)].join("\n"),
  });

  return { results, dryRun: answers.dryRun };
}
