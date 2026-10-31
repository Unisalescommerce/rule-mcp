/**
 * @module prompts/task-prompts-export
 *
 * One-shot prompts for /rule-adr, /rule-export, and /rule-keep.
 */

/**
 * The export-side task prompt for a name, or null when it is not one.
 *
 * @param {string} name
 * @param {Record<string, string>} args
 * @param {(text: string) => object[]} user - message wrapper
 * @returns {object|null}
 */
export function exportTaskPrompt(name, args, user) {
  switch (name) {
    case "rule-adr": {
      return {
        name,
        description: "Write an ADR then offer decision-cache keep",
        messages: user(
          [
            `Record an architecture decision and keep it. Options: ${args.options ?? "interview the user for the ADR"}.`,
            "",
            "1. Call `rule_tool_process_adr` with the title/context/decision from the arguments (or ask the user when fields are missing).",
            "2. After the ADR is written, offer `/rule-keep` (call `rule_tool_keep`) with a fingerprint and the accepted choice - only when the user confirms.",
            "3. This prompt binds ADR write to the export decision-cache; bare `rule_tool_process_adr` does not.",
            "4. Do not short-circuit hooks from the decision-cache.",
            "",
            "Finish by proposing a conventional commit with a mandatory scope if the tree changed. Ask the user what to do when the next step is unclear.",
          ].join("\n"),
        ),
      };
    }

    case "rule-export": {
      return {
        name,
        description: "Distill sessions into .flight and interview dubious decisions",
        messages: user(
          [
            `Export distill for this project. Options: ${args.options ?? "distill + interview, no delete, keep log"}.`,
            "",
            "1. Use the session map and `exportDistill` path (keep MCP events unless arguments say `drain`).",
            "2. Flag dubious decisions and interview the user before writing pending/confirmed/discarded entries.",
            "3. For a confirmed choice, call `rule_tool_keep`. Never invent confirmation.",
            "4. Do not hard-delete agent sessions unless arguments include `cleanup` and the user confirmed.",
            "",
            "Finish by proposing a conventional commit with a mandatory scope only if a tracked file changed. Ask the user what to do when cleanup or interview choices are unclear.",
          ].join("\n"),
        ),
      };
    }

    case "rule-keep": {
      return {
        name,
        description: "Confirm one decision into the export decision-cache",
        messages: user(
          [
            `Confirm one decision into the export decision-cache. Options: ${args.options ?? "ask the user for fingerprint and choice"}.`,
            "",
            "1. Parse fingerprint and choice from the arguments (fingerprint=<id> choice=<text|json> [agent=<id>]).",
            "2. Call `rule_tool_keep` with those fields. Do not invent a fingerprint or a choice; ask the user when either is missing.",
            "3. Report the confirmed record. Do not short-circuit hooks from this cache.",
            "",
            "Finish by proposing a conventional commit with a mandatory scope only if a tracked file changed.",
          ].join("\n"),
        ),
      };
    }

    default: {
      return null;
    }
  }
}
