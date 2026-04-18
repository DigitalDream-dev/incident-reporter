import type { IncidentWorkflowState } from "../state.js";

export async function finishRejectedNode(state: IncidentWorkflowState): Promise<{
  createRecordResult: string;
}> {
  const fb = state.orchestration?.feedback ?? "unknown";
  return {
    createRecordResult: `Notion row not created. Orchestrator rejected: ${fb}`,
  };
}
