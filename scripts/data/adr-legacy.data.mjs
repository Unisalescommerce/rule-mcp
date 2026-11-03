/**
 * @module scripts/data/adr-legacy
 *
 * ADR numbers that predate a rule, one list per rule id.
 *
 * The six ADR rules cannot be green on the record they describe: old decisions
 * are immutable, so a rule that fires on ADR 001 would stay red forever and be
 * ignored. This is the router-gap shape (ADR 172): the list is the measurement,
 * the suite asserts every entry is still a violation, and it only shrinks.
 *
 * Measured on 2026-11-03 across 210 numbered records.
 */

/** Rule id -> the ADR numbers excused for it. */
export const ADR_LEGACY = {
  // 56 records stop before the section existed; every gap sits at 090 or below.
  "adr-ends-when": [
    "001",
    "002",
    "003",
    "004",
    "005",
    "006",
    "007",
    "008",
    "009",
    "010",
    "011",
    "012",
    "013",
    "014",
    "015",
    "016",
    "017",
    "018",
    "019",
    "020",
    "021",
    "022",
    "023",
    "024",
    "025",
    "026",
    "027",
    "028",
    "029",
    "030",
    "031",
    "032",
    "033",
    "034",
    "035",
    "036",
    "037",
    "038",
    "039",
    "040",
    "041",
    "042",
    "043",
    "044",
    "045",
    "046",
    "047",
    "048",
    "049",
    "050",
    "051",
    "052",
    "053",
    "067",
    "068",
    "090",
  ],
  // A free-form status value, a `## Status` heading instead of the header line,
  // or a supersede recorded under a key other than `by [NNN]`.
  "adr-status-vocabulary": ["039", "067", "068", "079", "080", "085", "087", "097", "106", "149"],
  "adr-author-line": [],
  "adr-file-naming": [],
  "adr-index-derived": [],
  "adr-english": [],
};
