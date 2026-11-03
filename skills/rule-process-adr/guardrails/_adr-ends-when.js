/** Guardrail `adr-ends-when`: the record names the observation that ends it */

const SECTION = /^## What would end this[^\S\n]*$/m;

// What generateAdr writes when it has no endsWhen: a sentence that says nothing
// about the decision, so a record can look complete and carry no limit.
const PLACEHOLDER = "The assumption this leans on, and the observation that would make it wrong.";

export const adrEndsWhen = {
  id: "adr-ends-when",
  label: "The record says what would end it",
  description: "A decision with no stated end condition is never revisited.",
  check: (code) => {
    const at = code.search(SECTION);

    if (at === -1) {
      return {
        pass: false,
        failCount: 1,
        detail: ["no ## What would end this section"],
        suggestion: "Add the section and name the observation that would make the decision wrong.",
      };
    }

    const body = code.slice(at + code.slice(at).indexOf("\n")).trim();

    if (body.length === 0 || body.split(/\n##\s/, 1)[0].trim() === PLACEHOLDER) {
      return {
        pass: false,
        failCount: 1,
        detail: ["the section is empty or keeps the generated placeholder"],
        suggestion: "Replace the placeholder with the observation that would make the decision wrong.",
      };
    }

    return { pass: true, failCount: 0, detail: [] };
  },
};
