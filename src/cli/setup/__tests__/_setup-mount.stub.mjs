/** Test double for setup/_mount.js used by _setup-index-branches.test.mjs. */

/**
 * Stand in for the OpenTUI mount: no terminal, no native renderer.
 *
 * @param {{ direction?: "install"|"uninstall", defaults?: object }} options
 */
export async function mountWizard({ direction = "install" } = {}) {
  const control = globalThis.__ruleSetupBranches;

  control?.bumpMount();
  control?.recordDirection(direction);

  return {
    results: [],
    dryRun: true,
  };
}
