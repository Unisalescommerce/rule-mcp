/**
 * @module resources/read-project
 *
 * The `rule://project` arm: what this project is, and which skill and tool the
 * detector suggests for it.
 */

/**
 * The project profile as a JSON resource body.
 *
 * @returns {Promise<object>}
 */
export async function projectBody() {
  const { detectProject, getFrameworkSuggestion } = await import("../core/detector/index.js");
  const profile = detectProject(process.cwd());
  const { skillName, toolName } = getFrameworkSuggestion(profile.framework);

  return {
    ...profile,
    suggested_skills: [skillName],
    suggested_tools: [toolName, "rule_tool_check", "rule_tool_styleguide"],
    message: `Detected ${profile.framework} project "${profile.projectName}". Use ${toolName} for rule-mcp-compliant code generation.`,
  };
}
