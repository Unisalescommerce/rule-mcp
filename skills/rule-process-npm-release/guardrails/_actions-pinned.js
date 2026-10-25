/** Guardrail `release-actions-pinned`: every action in a release workflow is a commit SHA */

const WORKFLOW_FILE = /\.ya?ml$/iu;

/** `uses:` with the ref, and the version comment the ref must carry. */
const USES = /^\s*(?:-\s*)?uses:\s*["']?([^\s"'#]+)["']?(?:\s+#\s*(\S+))?\s*$/u;

/** A full commit SHA, not a tag, a branch or a short hash. */
const SHA = /@[0-9a-f]{40}$/u;

/** A local action has no upstream to pin, and a docker image needs a digest this rule does not read. */
const UNPINNABLE = /^(?:\.\/|docker:\/\/)/u;

export const releaseActionsPinned = {
  id: "release-actions-pinned",
  label: "Every action is pinned to a commit SHA",
  description:
    "A release workflow runs with privileges nothing else in the repository has, and a tag like `@v4` is a pointer its owner can move at any time without a diff here. Pinning the full SHA makes the update explicit and reviewable; the trailing version comment keeps it readable, so the pin is not a hex blob nobody dares touch.",
  check: (code, context) => {
    if (!WORKFLOW_FILE.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a workflow file, skipping" };
    }

    const offenders = [];

    for (const line of String(code).split("\n")) {
      const match = line.match(USES);

      if (!match || UNPINNABLE.test(match[1])) {
        continue;
      }

      if (!SHA.test(match[1])) {
        offenders.push(`${line.trim()} - not a 40-character commit SHA`);
        continue;
      }

      if (!match[2]) {
        offenders.push(`${line.trim()} - add the version as a trailing comment`);
      }
    }

    return {
      pass: offenders.length === 0,
      failCount: offenders.length,
      detail: offenders,
      suggestion: "Pin the full commit SHA and keep the tag in a `#` comment: `uses: owner/action@<40-hex> # v4`.",
    };
  },
};
