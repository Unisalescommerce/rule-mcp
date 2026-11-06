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
import { depthItems, modeItems } from "./_items-depth.js";
import { readManifest } from "../../install/_manifest.js";
import { agentRows } from "../_agent-rows.js";

import { installNextSteps, uninstallNextSteps } from "../_next-steps.js";

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
  featureLevelItems,
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
  attributionItems,
} from "./_items.js";

import { askFeatures } from "./_wizard-features.js";
import { askReview } from "./_wizard-review.js";
import { askScope } from "./_wizard-scope.js";
import { INSTALL_RAIL,  UNINSTALL_RAIL,  } from "./_wizard-steps.js";
import { installOrder, installPlan, uninstallOrder } from "./_wizard-steps.js";

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

  const flaggedFeatures = Object.fromEntries(
    (Array.isArray(defaults.features) ? defaults.features : [])
      .map((spec) => {
        if (typeof spec === "object" && spec?.id) {
          return [spec.id, spec.level];
        }

        if (typeof spec !== "string" || !spec.includes("=")) {
          return null;
        }

        const eq = spec.indexOf("=");

        return [spec.slice(0, eq), spec.slice(eq + 1)];
      })
      .filter(Boolean),
  );

  const answers = {
    profile: defaults.profile ?? null,
    dimensions: defaults.dimensions ?? null,
    agents: defaults.agents ?? catalog.detected,
    mode: defaults.mode ?? "stdio",
    surface: defaults.surface ?? null,
    selection: defaults.selection ?? null,
    features: { ...flaggedFeatures },
    adrPolicy: defaults.adrPolicy ?? null,
    attribution: defaults.attribution ?? "keep",
    scope: defaults.scope === "project" ? "project" : "global",
    projects: Array.isArray(defaults.projects) ? defaults.projects : [],
    projectConfig: defaults.projectConfig === "local" ? "local" : "shared",
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

        return;
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

        return;
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

        return;
      }

      case "scope": {
        const outcome = await askScope({ screen, answers });

        return outcome;
      }

      case "depth": {
        const level = await screen.ask({
          title: "How much should the install write?",
          help: ["Each host writes as much as it supports, up to the row you pick.", "The screen before this one says where each host stops."],
          items: depthItems(answers.agents),
          mode: "radio",
          initial: [answers.level ?? "auto"],
          height: 6,
        });

        if (level === CANCEL || level === BACK) {
          return level;
        }

        answers.level = level;

        return;
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

        return;
      }

      case "features": {
        const outcome = await askFeatures({ screen, answers });

        return outcome;
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

          return;
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

          return;
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

        return;
      }

      case "review": {
        return askReview({ screen, answers, context, defaults });
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

        return;
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

        return;
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

          return;
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

export {INSTALL_STEPS, UNINSTALL_STEPS, installOrder, uninstallOrder} from "./_wizard-steps.js";