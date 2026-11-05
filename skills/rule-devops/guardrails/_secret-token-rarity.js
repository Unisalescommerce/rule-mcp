/** Offline cl100k_base token rarity, adapted from Betterleaks (MIT). */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const TOKEN_PATTERN = /'s|'t|'re|'ve|'m|'ll|'d|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/giu;
let ranks;
let words;

/** Read and cache the upstream merge ranks on first use. */
function tokenRanks() {
  if (ranks) {
    return ranks;
  }

  const data = gunzipSync(readFileSync(new URL("assets/cl100k_base.tiktoken.gz", import.meta.url))).toString("utf8");
  const loaded = new Map();

  for (const line of data.trimEnd().split("\n")) {
    const [encoded, rank] = line.split(" ", 2);

    loaded.set(Buffer.from(encoded, "base64").toString("latin1"), Number(rank));
  }

  if (loaded.size !== 100256) {
    throw new Error("Invalid cl100k_base ranks; restore the bundled asset");
  }

  ranks = loaded;

  return ranks;
}

/** Count BPE merges on a byte string. */
function countPiece(piece, table) {
  if (table.has(piece)) {
    return 1;
  }

  const boundaries = Array.from({ length: piece.length + 1 }, (_, index) => index);

  while (boundaries.length > 2) {
    let bestRank = Infinity;
    let bestIndex = -1;

    for (let index = 0; index < boundaries.length - 2; index += 1) {
      const rank = table.get(piece.slice(boundaries[index], boundaries[index + 2]));

      if (rank === undefined || !(rank < bestRank)) {
        continue;
      }

      bestRank = rank;
      bestIndex = index;
    }

    if (bestIndex < 0) {
      break;
    }

    boundaries.splice(bestIndex + 1, 1);
  }

  return boundaries.length - 1;
}

/** Count ordinary cl100k_base tokens, without special tokens. */
export function countTokens(value) {
  if (Buffer.byteLength(value, "utf8") > 4096) {
    throw new RangeError("Token rarity candidate exceeds the 4096-byte limit");
  }

  if (!value) {
    return 0;
  }

  const table = tokenRanks();
  let count = 0;

  for (const match of value.matchAll(TOKEN_PATTERN)) {
    count += countPiece(Buffer.from(match[0], "utf8").toString("latin1"), table);
  }

  return count;
}

/** Search the upstream word list without requiring word boundaries. */
function containsWord(value, minimum) {
  words ??= new Set(
    gunzipSync(readFileSync(new URL("assets/words.txt.gz", import.meta.url)))
      .toString("utf8")
      .split("\n"),
  );
  const lower = value.toLowerCase();

  for (let start = 0; start <= lower.length - minimum; start += 1) {
    for (let end = start + minimum; end <= lower.length; end += 1) {
      if (words.has(lower.slice(start, end))) {
        return true;
      }
    }
  }

  return false;
}

/** Return the ratio of UTF-8 bytes to ordinary tokens. */
export function tokenRatio(secret) {
  const value = Buffer.byteLength(secret, "utf8") < 20 ? secret.replaceAll(/[\r\n]/g, "") : secret;
  const count = countTokens(value);

  return count === 0 ? 0 : Buffer.byteLength(value, "utf8") / count;
}

/** Return whether a candidate resembles natural language by upstream policy. */
export function failsTokenEfficiency(secret) {
  const value = Buffer.byteLength(secret, "utf8") < 20 ? secret.replaceAll(/[\r\n]/g, "") : secret;
  const ratio = tokenRatio(value);

  if (ratio === 0) {
    return false;
  }

  if (containsWord(value, 5)) {
    return true;
  }

  const threshold = Buffer.byteLength(value, "utf8") < 12 && containsWord(value, 4) ? 2.1 : 2.5;

  return ratio >= threshold;
}
