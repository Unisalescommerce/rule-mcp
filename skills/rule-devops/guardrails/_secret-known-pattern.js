/**
Provider token patterns adapted from Betterleaks (MIT), copyright 2026 Zachary Rice.
Source: betterleaks/betterleaks commit 6cd808f299a81b19fdbd196b04a64e63565c8c5c,
config/betterleaks.toml. These three rules are a curated subset, not a full scanner.
*/
import { shannonEntropy } from "./_secret-entropy.js";

const RULES = [
  { id: "github-pat", keyword: "ghp_", pattern: /ghp_[0-9a-zA-Z]{36}/g, minEntropy: 3 },
  { id: "gitlab-pat", keyword: "glpat-", pattern: /glpat-[\w-]{20}/g, minEntropy: 3 },
  { id: "aws-access-token", keyword: ["a3t", "akia", "asia", "abia", "acca"], pattern: /\b(?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16}\b/g, minEntropy: 3 },
];

/** Find provider-specific tokens without returning their values or source lines. */
export function findKnownSecrets(code, { fileName = "" } = {}) {
  if (Buffer.byteLength(code, "utf8") > 262144) {
    throw new RangeError("Secret scan input exceeds 262144 bytes");
  }

  const lower = code.toLowerCase();
  const matches = [];

  for (const rule of RULES) {
    const keywords = Array.isArray(rule.keyword) ? rule.keyword : [rule.keyword];

    if (keywords.every((keyword) => !lower.includes(keyword))) {
      continue;
    }

    if (rule.id === "github-pat" && /(?:^|\/)@octokit\/auth-token\/README\.md$/.test(fileName)) {
      continue;
    }

    for (const match of code.matchAll(rule.pattern)) {
      if (shannonEntropy(match[0]) <= rule.minEntropy || (rule.id === "aws-access-token" && match[0].endsWith("EXAMPLE"))) {
        continue;
      }

      matches.push({ ruleId: rule.id, offset: match.index });
    }
  }

  matches.sort((a, b) => a.offset - b.offset || a.ruleId.localeCompare(b.ruleId));
  let line = 1;
  let cursor = 0;

  return matches.map((match) => {
    while (cursor < match.offset) {
      if (code[cursor] === "\n") {
        line += 1;
      }

      cursor += 1;
    }

    return { ruleId: match.ruleId, line };
  });
}
