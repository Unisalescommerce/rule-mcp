/** Guardrail `fp-nfc-text`: text is NFC-normalized */

export const fpNfcText = {
  id: "ai-nfc-text",
  label: "Text is NFC-normalized",
  description: "A decomposed accent is a different byte sequence for the same letter, so diffs and greps miss it.",
  check: (code) => {
    const normalized = code.normalize("NFC") === code;

    return {
      pass: normalized,
      failCount: normalized ? 0 : 1,
      detail: normalized ? [] : ["the text is not NFC-normalized"],
      suggestion: "Normalize the text to NFC. The combining accent that looks identical to a precomposed letter is a different code point.",
    };
  },
};
