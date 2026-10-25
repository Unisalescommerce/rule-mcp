/** Guardrail `release-manifest-metadata`: a crate carries the five fields crates.io asks for */

const MANIFEST = /(?:^|\/)Cargo\.toml$/iu;

/** The fields the Cargo Book names before a first publish. */
const REQUIRED = ["license", "description", "repository", "readme"];

/** A key assigned at the top of a table: `key = value`, or `key.workspace = true`. */
const assignedIn = (text, table, key) => {
  const lines = text.split("\n");
  let inTable = false;

  for (const line of lines) {
    const header = line.match(/^\s*\[([^\]]+)\]\s*$/u);

    if (header) {
      inTable = header[1].trim() === table;
      continue;
    }

    if (inTable && new RegExp(String.raw`^\s*${key}\s*(?:\.\w+\s*)?=`, "u").test(line)) {
      return true;
    }
  }

  return false;
};

export const releaseManifestMetadata = {
  id: "release-manifest-metadata",
  label: "The manifest carries the metadata crates.io requires",
  description:
    "crates.io refuses a first publish without `license` (or `license-file`), `description`, `repository` and `readme`, and it refuses it after the archive is built. The failure is cheap but it arrives at the worst moment, and the missing field is usually the one that makes a crate discoverable at all - which is the difference between a release and a release somebody can find.",
  check: (code, context) => {
    if (!MANIFEST.test(context?.fileName ?? "")) {
      return { pass: true, note: "Not a Cargo.toml, skipping" };
    }

    const text = String(code);

    if (!/^\s*\[package\]\s*$/mu.test(text)) {
      return { pass: true, note: "Not a package manifest, skipping" };
    }

    const hasLicense = assignedIn(text, "package", "license") || assignedIn(text, "package", "license-file");
    const missing = REQUIRED.filter((key) => key !== "license" && !assignedIn(text, "package", key));

    if (!hasLicense) {
      missing.unshift("license");
    }

    return {
      pass: missing.length === 0,
      failCount: missing.length,
      detail: missing,
      suggestion: "Add the missing fields under `[package]`, or set the workspace values and inherit them with `key.workspace = true`.",
    };
  },
};
