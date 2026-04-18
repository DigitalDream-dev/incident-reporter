import type { IncidentWorkflowState } from "../state.js";
export declare function finishRejectedNode(state: IncidentWorkflowState): Promise<{
    createRecordResult: string;
}>;
