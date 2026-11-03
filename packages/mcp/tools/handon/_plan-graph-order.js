/** Ordering the plan graph: the cascade frontier, cycles and unknown edges. */
import { dependencyState, levelOf, retiredPlans, readPlans } from "./_plan-graph-read.js";

/** The plans the cascade allows to start: open steps, not superseded, every HARD edge met. */
export function frontier(plans, retired) {
  const ready = [];
  const ordered = [...plans.values()].sort((left, right) => levelOf(left.id, plans, retired) - levelOf(right.id, plans, retired) || left.path.localeCompare(right.path));

  for (const plan of ordered) {
    if (plan.open === 0 || plan.status === "superseded") {
      continue;
    }

    const hard = plan.edges.filter((edge) => edge.kind === "HARD");
    const states = hard.map((edge) => dependencyState(edge.id, plans, retired));

    if (states.every((state) => state === "met")) {
      ready.push({
        ...plan,
        level: levelOf(plan.id, plans, retired),
        waitsFor: hard.filter((edge, at) => states[at] !== "met").map((edge) => edge.id),
      });
    }
  }

  return ready;
}

/** Cycles among plan ids, as readable chains; empty when the graph is a DAG. */
export function cycles(plans) {
  const found = [];
  const state = new Map();

  const visit = (id, chain) => {
    state.set(id, 1);

    for (const edge of plans.get(id)?.edges ?? []) {
      if (!plans.has(edge.id)) {
        continue;
      }

      if (state.get(edge.id) === 1) {
        found.push([...chain, id, edge.id].join(" -> "));
      } else if (state.get(edge.id) !== 2) {
        visit(edge.id, [...chain, id]);
      }
    }

    state.set(id, 2);
  };

  for (const id of plans.keys()) {
    if (state.get(id) !== 2) {
      visit(id, []);
    }
  }

  return found;
}

/** Edges that name no plan and no closeout ADR: a typo or a plan that moved. */
export function unknownEdges(plans, retired) {
  const unknown = [];

  for (const plan of plans.values()) {
    for (const edge of plan.edges) {
      if (dependencyState(edge.id, plans, retired) === "unknown") {
        unknown.push(`${plan.path}: ${edge.id} (${edge.kind})`);
      }
    }
  }

  return unknown;
}

/**
The whole analysis a caller needs: the ready work, the blocked work, the
unknown edges and the cycles.

@param {string} projectDir
*/
export function planGraph(projectDir) {
  const plans = readPlans(projectDir);
  const retired = retiredPlans(projectDir);

  return {
    plans,
    retired,
    ready: frontier(plans, retired),
    blocked: [...plans.values()].filter((plan) => plan.open > 0 && plan.status !== "superseded" && frontier(plans, retired).every((ready) => !(ready.id === plan.id))),
    unknown: unknownEdges(plans, retired),
    cycles: cycles(plans),
  };
}
