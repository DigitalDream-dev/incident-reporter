import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { IncidentTemplateSchema, OrchestratorDecisionSchema, } from "../../schema/incident-template.js";
export function createOrchestratorNode(llm) {
    return async (state) => {
        const t = state.filledTemplate;
        if (!t) {
            return {
                orchestration: {
                    approved: false,
                    feedback: "Agent 1 did not return a structured template.",
                },
            };
        }
        const parsed = IncidentTemplateSchema.safeParse(t);
        if (!parsed.success) {
            return {
                orchestration: {
                    approved: false,
                    feedback: `Schema validation failed: ${parsed.error.message}`,
                },
            };
        }
        const decision = await llm.withStructuredOutput(OrchestratorDecisionSchema).invoke([
            new SystemMessage(`You are the incident orchestrator. You only check whether the filled template is plausible and complete for routing (non-empty fields, tags present, values consistent with each other).`),
            new HumanMessage(`Template JSON:\n${JSON.stringify(parsed.data, null, 2)}`),
        ]);
        return { orchestration: decision };
    };
}
export function routeAfterOrchestrator(state) {
    return state.orchestration?.approved ? "createRecord" : "finishRejected";
}
