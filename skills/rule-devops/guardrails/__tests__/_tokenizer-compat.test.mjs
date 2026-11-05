import assert from "node:assert/strict";
import test from "node:test";
import { countTokens } from "../_secret-token-rarity.js";

// Reproduce math/rand/v2 PCG and FNV-1a used by Betterleaks' compatibility test.
const MASK = (1n << 64n) - 1n;
const MULTIPLIER = (2549297995355413924n << 64n) | 4865540595714422341n;
const INCREMENT = (6364136223846793005n << 64n) | 1442695040888963407n;

function upstreamRandom() {
  let state = (0x5eedn << 64n) | 0xc0ffeen;

  function next() {
    state = (state * MULTIPLIER + INCREMENT) & ((1n << 128n) - 1n);
    let high = state >> 64n;
    const low = state & MASK;

    high ^= high >> 32n;
    high = (high * 0xda942042e4dd58b5n) & MASK;
    high ^= high >> 48n;

    return (high * (low | 1n)) & MASK;
  }

  return (limit) => {
    const n = BigInt(limit);

    if ((n & (n - 1n)) === 0n) {
      return Number(next() & (n - 1n));
    }

    const threshold = (1n << 64n) % n;
    let product = next() * n;

    while ((product & MASK) < threshold) {
      product = next() * n;
    }

    return Number(product >> 64n);
  };
}

test("matches the upstream 2000-input compatibility digest", () => {
  const random = upstreamRandom();
  const alphabet = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-./:+ =\r\n世界🔐é");
  const inputs = [
    "",
    "MIGRATE_HELM_2TO3",
    "linkedinX9qB2mK7pR4zT8",
    "this-is-a-long-readable-placeholder-value",
    "ghp_" + "aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5",
    "line one\r\nline two\n\nline three",
    "<|endoftext|>",
    "こんにちは世界",
    "🔐 secrets café",
    "a".repeat(1000),
  ];

  for (let index = 0; index < 2000; index += 1) {
    const length = random(128);
    let value = "";

    for (let offset = 0; offset < length; offset += 1) {
      value += alphabet[random(alphabet.length)];
    }

    inputs.push(value);
  }

  let digest = 0xcbf29ce484222325n;

  for (const input of inputs) {
    let count = BigInt(countTokens(input));

    for (let byte = 0; byte < 8; byte += 1) {
      digest = ((digest ^ (count & 255n)) * 0x100000001b3n) & MASK;
      count >>= 8n;
    }
  }

  assert.equal(digest, 0x5183dc9c07b70cf4n);
});
