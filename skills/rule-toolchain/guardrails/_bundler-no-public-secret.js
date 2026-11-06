/** Guardrail `bundler-no-public-secret`: a public prefix never carries a secret. */
const PUBLIC = /^(?:VITE|RSPACK|PARCEL|PUBLIC)_/;
const SECRET = /SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|API_KEY/;

/** The rule `rule-toolchain` owns: a public build variable must not be a secret. */
export const bundlerNoPublicSecret = {
  id: "bundler-no-public-secret",
  label: "No secret in a public variable",
  description: "A public build variable reaches the browser, so its name must not look like a secret.",
  check: (code) => {
    if (!/import\.meta\.env|process\.env/.test(code)) {
      return { pass: true, note: "No environment access, skipping" };
    }

    const names = new Set();

    for (const match of code.matchAll(/\b((?:VITE|RSPACK|PARCEL|PUBLIC)_[A-Z0-9_]+)\b/g)) {
      const name = match[1];

      if (PUBLIC.test(name) && SECRET.test(name)) {
        names.add(name);
      }
    }

    const found = [...names];

    return {
      pass: found.length === 0,
      failCount: found.length,
      detail: found.map((name) => `${name} is public and looks like a secret`),
      suggestion: "Keep the secret out of a public variable: read it on the server, or rename it if the value is safe to ship.",
    };
  },
};
