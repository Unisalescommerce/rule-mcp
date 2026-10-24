/** @module cli/setup/opentui/uninstall-flow - manifest-backed removal */
import { DIMENSION_DETAIL } from "../../install/_profiles.js";

/**
 * Offer every dimension the manifest recorded, doctor excluded, all selected;
 * the user can deselect before the removal runs.
 *
 * @param {{ manifest: object, pickDimensions: Function, remove: Function }} ports
 * @returns {Promise<string[]|null>}
 */
export async function runUninstallFlow({ manifest, pickDimensions, remove }) {
  const installed = Object.entries(manifest?.dimensions ?? {})
    .filter(([dimension, on]) => on && dimension !== "doctor")
    .map(([dimension]) => dimension);

  if (installed.length === 0) {
    return null;
  }

  const dimensions = await pickDimensions({ dimensions: installed, details: DIMENSION_DETAIL, selected: installed });

  if (!dimensions) {
    return null;
  }

  remove(dimensions);

  return dimensions;
}
