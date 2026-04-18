import type { IncidentWorkflowState } from "../state.js";

export async function finishRejectedNode(state: IncidentWorkflowState): Promise<{
  createRecordResult: string;
  solved: false;
}> {
  const fb = state.orchestration?.feedback ?? "unknown";
  const msg = `=== Incident workflow (rejected) ===\n${fb}`;
  console.log(msg);
  return {
    createRecordResult: `Workflow stopped (rejected): ${fb}`,
    solved: false,
  };
}
