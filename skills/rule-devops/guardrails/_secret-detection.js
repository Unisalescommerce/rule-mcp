/** Guardrail `secret-detection`: credentials come from the environment, not the source. */
export const secretDetection = {
  id: "secret-detection",
  label: "No hardcoded secrets",
  description: "Passwords, API keys, and tokens must use environment variables.",
  check: (code, context = {}) => {
    const matches = [...code.matchAll(/(?:password|passwd|secret|apiKey|api_key|token|api_secret)["']?\s*[:=]\s*["'][^"']{8,}["']/gi)];
    const providers = context.findKnownSecrets(code, { fileName: context.fileName });
    const dotenv = /(?:^|[\\/])\.env(?:\.[^\\/]*)?$/.test(context.fileName ?? "");
    const dotenvMatches = dotenv
      ? [...code.matchAll(/^[ \t]*(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*([^\s"'#][^\s#]*)/gm)].filter((match) => {
          const value = match[2];

          return (
            /(?:password|passwd|secret|api_?key|token)/i.test(match[1]) &&
            value.length >= 8 &&
            !value.includes("$") &&
            !/^(?:your[_-]|replace[_-]|change[_-]|example|placeholder)/i.test(value)
          );
        })
      : [];
    const detail = [
      ...providers.map((finding) => `${finding.ruleId} at line ${finding.line}`),
      ...matches.map(() => "Hardcoded credential assignment"),
      ...dotenvMatches.map(() => "Hardcoded dotenv credential"),
    ];

    return {
      pass: detail.length === 0,
      failCount: detail.length,
      detail: detail.slice(0, 10),
      suggestion: "Store secrets in environment variables: process.env.DB_PASSWORD. Never hardcode credentials.",
    };
  },
};
