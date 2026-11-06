import assert from "node:assert/strict";
import test from "node:test";
import { countTokens, tokenRatio, failsTokenEfficiency } from "../../tokenizer/_token-rarity.js";

// Vectors from betterleaks internal/tokenizer/tokenizer_test.go.
for (const [input, expected] of [
  ["", 0],
  ["MIGRATE_HELM_2TO3", 9],
  ["linkedinX9qB2mK7pR4zT8", 15],
  ["this-is-a-long-readable-placeholder-value", 7],
  ["ghp_" + "aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5", 38],
  ["line one\r\nline two\n\nline three", 8],
  ["<|endoftext|>", 7],
  ["こんにちは世界", 4],
  ["🔐 secrets café", 5],
  ["a".repeat(1000), 125],
]) {
  test(`counts ${JSON.stringify(input.slice(0, 36))}`, () => {
    assert.equal(countTokens(input), expected);
  });
}

test("token ratio uses UTF-8 byte length and removes newlines for short inputs", () => {
  assert.equal(tokenRatio("é"), 2 / countTokens("é"));
  assert.equal(tokenRatio("abc\ndef"), tokenRatio("abcdef"));
  assert.equal(tokenRatio(""), 0);
});

test("oversized candidates are refused before expensive tokenization", () => {
  assert.throws(() => countTokens("a".repeat(4097)), /4096/);
  assert.throws(() => failsTokenEfficiency("a".repeat(4097)), /4096/);
});

test("matches upstream wordlist and ratio filter examples", () => {
  const mixed = "linkedinX9qB2mK7pR4zT8";
  const placeholder = "this-is-a-long-readable-placeholder-value";

  assert.equal(failsTokenEfficiency(mixed), true);
  assert.ok(tokenRatio(mixed) < 2.5);
  assert.ok(tokenRatio(placeholder) >= 2.5);
});

test("word-based filtering ignores case and recognizes readable placeholders", () => {
  assert.equal(failsTokenEfficiency("THIS-IS-A-PLACEHOLDER"), true);
  assert.equal(failsTokenEfficiency("ghp_" + "aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5"), false);
});
