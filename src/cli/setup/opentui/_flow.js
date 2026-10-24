/** @module cli/setup/opentui/flow - profile, dimensions, manifest */
import { DIMENSION_DETAIL, DIMENSIONS, PROFILES, resolveProfile } from "../../install/_profiles.js";

/**
 * Drive the wizard: pick a profile, resolve its dimensions (or ask for them
 * when the profile is custom) and hand the answer to the recorder.
 *
 * @param {{ pickProfile: Function, pickDimensions: Function, record: Function }} ports
 * @returns {Promise<{ profile: string, dimensions: string[] }|null>}
 */
export async function runInstallerFlow({ pickProfile, pickDimensions, record }) {
  const profile = await pickProfile({
    profiles: Object.entries(PROFILES).map(([id, value]) => ({ id, label: value.label, description: value.description })),
  });

  if (!profile) {
    return null;
  }

  const dimensions = profile === "custom" ? await pickDimensions({ dimensions: DIMENSIONS, details: DIMENSION_DETAIL }) : resolveProfile(profile).dimensions;

  if (!dimensions) {
    return null;
  }

  const result = { profile, dimensions };

  record(result);

  return result;
}
