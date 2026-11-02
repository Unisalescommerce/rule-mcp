/** Shared shapes of the two plan indexes: paths, statuses, the ADR link. */

/** The level-0 index. */
export const PLAN_OF_PLANS = "docs/plans/plan-of-plans.md";

/** The level-1 catalog orchestrator. */
export const SKILLS_PLAN = "docs/plans/skills/_skills-plan.md";

/** Statuses a progress table can hold. */
export const PROGRESS_STATUS = /^(planned|in-progress|done|blocked|superseded|retired)$/;

/** The relative ADR link the indexes use. */
export const adrLink = (entry) => `[ADR ${entry.adrNumber}](../adr/${entry.adrFile})`;

/** The basename of a plan path: `skills/ai/_x.md` → `_x.md`. */
export const basename = (filename) => filename.split("/").at(-1);
