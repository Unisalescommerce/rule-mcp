/** Guardrail `adr-status-vocabulary`: one of the four statuses, and a named successor */

// One line, one capture: a nested whitespace quantifier before a lazy body
// backtracks catastrophically on a run of spaces (the ReDoS corpus caught it).
const STATUS = /^[^\S\n]*(?:-[^\S\n]*)?\*{0,2}Status\*{0,2}:([^\n]*)$/m;
const ALLOWED = /^(?:proposed|accepted|deprecated|superseded)$/i;
const SUCCESSOR = /by \[?\d{3}\]?/;

/** @param {string} code @returns {string|undefined} the raw status value */
function statusOf(code) {
  return code.match(STATUS)?.[1].replaceAll("*", "").trim();
}

export const adrStatusVocabulary = {
  id: "adr-status-vocabulary",
  label: "The status is one of four values",
  description: "A free-form status cannot be read by a later check, and a supersede with no successor stops the chain.",
  check: (code) => {
    const status = statusOf(code);
    const canonical = status !== undefined && ALLOWED.test(status);
    const orphan = /^superseded$/i.test(status ?? "") && !SUCCESSOR.test(code);

    if (status !== undefined && canonical && !orphan) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const detail = status === undefined ? ["no Status line"] : [`status: ${status}`];

    if (orphan) {
      detail.push("superseded with no by [NNN] reference");
    }

    return {
      pass: false,
      failCount: detail.length,
      detail,
      suggestion: "Use proposed, accepted, deprecated or superseded, and when superseding name the successor as by [NNN].",
    };
  },
};
