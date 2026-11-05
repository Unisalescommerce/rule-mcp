/** Read the prompt-shaped argument of a cacheable tool. */
import { NORMALIZABLE } from "./_state.js";

/**
@param {string} toolName
@param {object} args
@returns {string|null}
*/
export function promptOf(toolName, args) {
  for (const field of NORMALIZABLE.get(toolName) ?? []) {
    const value = args?.[field];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}
