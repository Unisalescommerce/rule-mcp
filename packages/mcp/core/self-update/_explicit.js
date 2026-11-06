/** The mode an explicit update call runs in. */

/**
 * `rule_tool_update` and `rule-mcp update` are the reader asking for the
 * update, so the ambient default does not apply to them. Without this, the
 * notify default would turn the one command that is supposed to act into
 * another announcement.
 *
 * @returns {"upgrade"}
 */
export function explicitMode() {
  return "upgrade";
}
