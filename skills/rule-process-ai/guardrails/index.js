/** The rules rule-process-ai owns, in canonical order. */
import { fpAmericanEnglish } from "./_american-english.js";
import { fpBidiControls } from "./_bidi-controls.js";
import { fpBoxRectangular } from "./_box-rectangular.js";
import { fpNfcText } from "./_nfc-text.js";
import { fpNoEmoji } from "./_no-emoji.js";
import { fpRepeatedOpener } from "./_repeated-opener.js";
import { fpStructuralTells } from "./_structural-tells.js";
import { enEnglishOnlyFilenames } from "./_english-only-filenames.js";
import { enEnglishOnlyProse } from "./_english-only-prose.js";
import { fpNoEmdash } from "./_no-emdash.js";
import { noPlaceholderImplementation } from "./_no-placeholder-implementation.js";
import { noSpeculativeAuditTable } from "./_no-speculative-audit-table.js";
import { noSuppressedErrors } from "./_no-suppressed-errors.js";
import { fpNoTypographicChars } from "./_no-typographic-chars.js";

export const GUARDRAILS = [
  enEnglishOnlyFilenames,
  enEnglishOnlyProse,
  fpAmericanEnglish,
  fpNoEmdash,
  fpNoTypographicChars,
  fpBidiControls,
  fpNoEmoji,
  fpNfcText,
  fpRepeatedOpener,
  fpStructuralTells,
  fpBoxRectangular,
  noPlaceholderImplementation,
  noSpeculativeAuditTable,
  noSuppressedErrors,
];
