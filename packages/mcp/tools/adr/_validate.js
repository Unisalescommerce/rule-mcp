/** The supersede fields have to name a record in both directions. */

/**
 * The refusal text for a supersede that names nothing, or null when the pair is
 * well formed.
 *
 * @param {{ status?: string, supersedes?: string, supersededBy?: string }} fields
 * @returns {string|null}
 */
export function supersedeOffense({ status, supersedes, supersededBy }) {
  if (status === "superseded" && !/^\d{3}$/.test(supersededBy ?? "")) {
    return [
      "Not written.",
      "",
      "A superseded ADR names the record that replaces it: pass supersededBy with three digits.",
      "The old record gains `- **Superseded by**: [NNN]`; the new one gains `- **Supersedes**: [NNN]`.",
    ].join("\n");
  }

  if (supersedes !== undefined && !/^\d{3}$/.test(supersedes)) {
    return "Not written.\n\nsupersedes is the three-digit number of the record this one replaces.";
  }

  return null;
}
