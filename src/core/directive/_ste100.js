/**
 * @module core/directive/ste100
 *
 * rule-mcp ASD-STE100 writing profile at about 80%. One wording for every
 * surface that authors Markdown (plans, reviews, audits, ADR, handoff,
 * impersonation, comments). This is a documented subset of STE100 habits, not a
 * licensed STE dictionary product.
 *
 * @see docs/plans/_asd-ste100.md
 */

/** Short re-anchor for the per-prompt directive line (keeps the budget). */
export const STE100_ANCHOR = "STE100~80.";

/**
 * Canonical directive string for session injection, skills, and generators.
 * Technical docs and code stay in American English; chat language follows AGENTS.md.
 */
export const STE100_DIRECTIVE =
  "Write in ASD-STE100 style at about 80%. Prefer short sentences, active voice, one idea per sentence, and the same word for the same thing. Keep about 20% natural tone so the text does not sound robotic. Prefer concrete verbs and named artifacts over abstract nouns. Technical docs and code stay in American English; chat language follows AGENTS.md.";

/** Hard rules we enforce (~80% STE100-ish). */
export const STE100_HARD_RULES = [
  "Prefer sentences under about 25 words when the idea fits",
  "Prefer active voice",
  "One idea per sentence",
  "Same word for the same thing (no synonym churn for key nouns)",
  "ASCII punctuation: no em dashes, no curly quotes",
  "Prefer concrete verbs and named artifacts over abstract nouns",
];

/** Soft rules that keep ~20% natural tone. */
export const STE100_SOFT_RULES = [
  "Keep about 20% natural tone so prose does not sound robotic",
  "Limited hedging only when uncertainty is real",
  "Light rhythm variation is allowed",
  "No slang",
];

/** @type {Array<{ id: string, pattern: RegExp }>} */
const BANNED = [
  { id: "em-dash", pattern: /\u2014/g },
  { id: "utilize", pattern: /\butiliz(?:e|es|ed|ing)\b/gi },
  {
    id: "stacked-hedge",
    pattern: /\b(?:might|may|could)\s+(?:possibly|potentially)\b|\bseems\s+to\s+appear\b/gi,
  },
];

/**
 * Scan MCP-authored prose for banned STE100~80 patterns.
 *
 * @param {string} text
 * @returns {{ ok: boolean, findings: Array<{ id: string, match: string }> }}
 */
export function scanSte100Prose(text) {
  const source = typeof text === "string" ? text : "";
  /** @type {Array<{ id: string, match: string }>} */
  const findings = [];

  for (const rule of BANNED) {
    rule.pattern.lastIndex = 0;
    let match = rule.pattern.exec(source);

    while (match) {
      findings.push({ id: rule.id, match: match[0] });

      if (!rule.pattern.global) {
        break;
      }

      match = rule.pattern.exec(source);
    }
  }

  return { ok: findings.length === 0, findings };
}
