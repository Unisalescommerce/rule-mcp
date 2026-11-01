/** The Features step: one screen per multi-level feature, then attribution. */

import { featureIds, FEATURES, levelsFor, readLevel } from "../../../core/runtime/features/index.js";
import { mergedEnv } from "../../../core/runtime/features/_store.js";
import { attributionItems, featureLevelItems } from "./_items.js";
import { BACK, CANCEL } from "./_answers.js";

/**
 * Ask the feature levels and the single attribution question.
 *
 * Attribution is one question, not one per agent: the table holds which agents
 * have a documented key, and the review lists the rest by name.
 *
 * @param {{ screen: object, answers: object }} context
 * @returns {Promise<unknown>} an answer to take for navigation, or undefined to continue
 */
export async function askFeatures({ screen, answers }) {
  // One level screen per feature that offers more than on/off; binary features
  // share a single radio each so every switch is owned here.
  const envView = mergedEnv({ env: process.env });

  for (const id of featureIds()) {
    if (answers.features[id]) {
      continue;
    }

    const levels = levelsFor(id);

    if (levels.length < 2) {
      continue;
    }

    const chosen = await screen.ask({
      title: FEATURES[id].label,
      help: [`Feature: ${id}`, "Pick the level written into ~/.rule-mcp/config/env.json."],
      items: featureLevelItems(id),
      mode: "radio",
      initial: [readLevel(id, envView)],
      height: Math.min(8, levels.length + 2),
    });

    if (chosen === CANCEL || chosen === BACK) {
      return chosen;
    }

    answers.features[id] = chosen;
  }

  const attribution = await screen.ask({
    title: "Commit attribution",
    help: [
      "hide writes the documented value for every agent whose vendor page names one.",
      "keep removes only the value an install wrote; an undocumented agent is left alone.",
    ],
    items: attributionItems(),
    mode: "radio",
    initial: [answers.attribution],
    height: 6,
  });

  if (attribution === CANCEL || attribution === BACK) {
    return attribution;
  }

  answers.attribution = attribution;

  return undefined;
}
