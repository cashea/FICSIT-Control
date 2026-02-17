import type { CommandType } from "../types/control";
import type { SolverOutput, ProductionNode } from "../types/solver";

export interface ProposedAction {
  id: string;
  type: CommandType;
  payload: Record<string, unknown>;
  description: string;
  building: string;
  enabled: boolean;
}

/**
 * Converts solver output into a list of proposed control actions.
 * Each production node generates a SET_RECIPE action to ensure the
 * correct recipe is set on an available machine of that building type.
 */
export function generatePlanActions(solverOutput: SolverOutput): ProposedAction[] {
  const actions: ProposedAction[] = [];

  for (const node of solverOutput.nodes) {
    actions.push(recipeAction(node));
  }

  return actions;
}

function recipeAction(node: ProductionNode): ProposedAction {
  const buildingCount = Math.ceil(node.buildingCount);
  return {
    id: `recipe-${node.id}`,
    type: "SET_RECIPE",
    payload: {
      machineId: node.buildingId,
      recipeId: node.recipeId,
    },
    description: `Set ${buildingCount}x ${node.buildingId} to recipe "${node.recipeId}"`,
    building: node.buildingId,
    enabled: true,
  };
}
