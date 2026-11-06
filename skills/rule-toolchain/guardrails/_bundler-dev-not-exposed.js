/** Guardrail `bundler-dev-not-exposed`: the dev server stays on localhost. */
export const bundlerDevNotExposed = {
  id: "bundler-dev-not-exposed",
  label: "Dev server not exposed",
  description: "A dev server on every interface, or with an all-hosts allowlist, exposes the machine and the project.",
  check: (code) => {
    const violations = [];
    const wideHost = code.match(/host\s*:\s*(true|["']0\.0\.0\.0["']|["']::["'])/);

    if (wideHost) {
      violations.push(`dev server host is ${wideHost[1]}`);
    }

    if (/allowedHosts\s*:\s*(?:\[[^\]]*["']all["']|["']all["'])/.test(code)) {
      violations.push("allowedHosts accepts every host");
    }

    return {
      pass: violations.length === 0,
      failCount: violations.length,
      detail: violations,
      suggestion: "Keep the dev server on localhost, and name the hosts you need in allowedHosts instead of all.",
    };
  },
};
