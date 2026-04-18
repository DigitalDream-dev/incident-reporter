import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { IncidentWorkflowState } from "../state.js";
export declare function createOrchestratorNode(llm: BaseChatModel): (state: IncidentWorkflowState) => Promise<{
    orchestration: {
        approved: boolean;
        feedback: string;
    };
}>;
export declare function routeAfterOrchestrator(state: IncidentWorkflowState): "createRecord" | "finishRejected";
