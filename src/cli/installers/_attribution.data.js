/**
@module cli/installers/attribution
 *
 * Attribution, one row per agent: where that agent reads the setting, what it
 * writes to hide, and the page the row came from.
 *
 * The table is deliberately mostly empty. A row is filled only when a vendor
 * page names the key and its values; everything else carries `unverified`, no
 * mechanism and no values, and the install prints that instead of writing a
 * setting nobody read. A switch wired to one vendor and applied to twenty-three
 * is the failure this table exists to prevent.
 *
 * @see docs/adr/_pending/attribution-is-one-table-row-per-agent-and-an-undocumented-agent-is-left-alone.md
 */

import { allAgents } from "./_catalog.js";

/** The value `evidence` carries when no page has been read for an agent. */
const UNVERIFIED = "unverified";

/**
The rows that have a cited page, by agent.

`mechanism` is one of `commit-trailer`, `pr-body`, `tool-signature`, `none`.
`keep` is what the agent reads when the attribution is visible; `null` means
the vendor default, which is what an install restores rather than inventing a
value of its own. `hide` is the value that removes it.
*/
const DOCUMENTED = {
  claude: {
    mechanism: "commit-trailer",
    file: "~/.claude/settings.json",
    key: "attribution",
    keep: null,
    hide: false,
    evidence: "https://code.claude.com/docs/en/settings-reference.md#attribution",
  },
  gemini: {
    mechanism: "none",
    file: null,
    key: null,
    keep: null,
    hide: null,
    evidence: "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/reference/configuration.md",
  },
};

/** One row, documented or not, for every agent in the catalog. */
export function attributionRows() {
  return allAgents.map((agent) => ({
    agent,
    ...(DOCUMENTED[agent] ?? { mechanism: null, file: null, key: null, keep: null, hide: null, evidence: UNVERIFIED }),
  }));
}

/**
The row for one agent, or undefined when it is not in the catalog.

@param {string} agent
@returns {object|undefined}
*/
export function attributionRow(agent) {
  return attributionRows().find((row) => row.agent === agent);
}
