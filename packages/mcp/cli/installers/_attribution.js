/**
@module cli/installers/attribution-writer
 *
 * Apply one attribution mode to one agent's config text.
 *
 * The invariants are the same for every row, whatever the file's dialect: a
 * value the user set stays, `hide` writes only the documented value, `keep`
 * removes only the value an install wrote, an unparseable file is refused, and
 * a row without a cited page touches nothing.
 *
 * Only the JSON dialect exists so far, because the two documented rows today
 * both live in JSON files. A TOML row needs its writer when a page names one.
 */

import { attributionRow } from "./_attribution.data.js";

export { attributionRow, attributionRows } from "./_attribution.data.js";

/** The JSON pretty format every installer in this tree writes. */
const toJson = (object) => `${JSON.stringify(object, null, 2)}\n`;

/**
Whether a value is exactly the marker an install writes.

@param {unknown} value
@param {unknown} marker
@returns {boolean}
*/
const isMarker = (value, marker) => value === marker;

/**
@param {string} agent
@param {string} text - the config file's current contents
@param {{ mode: "keep"|"hide" }} options
@returns {{ text: string, status: "applied"|"unchanged"|"not-documented"|"refused" }}
*/
export function applyAttribution(agent, text, { mode } = {}) {
  const row = attributionRow(agent);

  if (!row || row.evidence === "unverified" || row.mechanism === null || row.mechanism === "none" || !row.key) {
    return { text, status: "not-documented" };
  }

  let parsed;

  try {
    // An absent file is an empty object, the way every JSON writer here reads
    // it: a settings file that does not exist yet is not an unparseable one.
    parsed = text.trim() === "" ? {} : JSON.parse(text);
  } catch {
    return { text, status: "refused" };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { text, status: "refused" };
  }

  const current = parsed[row.key];

  if (mode === "hide") {
    if (current !== undefined) {
      return { text, status: "unchanged" };
    }

    return { text: toJson({ ...parsed, [row.key]: row.hide }), status: "applied" };
  }

  if (mode === "keep") {
    if (!isMarker(current, row.hide)) {
      return { text, status: "unchanged" };
    }

    const rest = { ...parsed };

    delete rest[row.key];

    return { text: Object.keys(rest).length > 0 ? toJson(rest) : "", status: "applied" };
  }

  return { text, status: "unchanged" };
}
