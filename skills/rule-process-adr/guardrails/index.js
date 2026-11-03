/** The rules rule-process-adr owns, in canonical order. */
import { adrAuthorLine } from "./_adr-author-line.js";
import { adrEndsWhen } from "./_adr-ends-when.js";
import { adrEnglish } from "./_adr-english.js";
import { adrFileNaming } from "./_adr-file-naming.js";
import { adrIndexDerived } from "./_adr-index-derived.js";
import { adrStatusVocabulary } from "./_adr-status-vocabulary.js";

export const GUARDRAILS = [adrFileNaming, adrStatusVocabulary, adrAuthorLine, adrEndsWhen, adrIndexDerived, adrEnglish];
