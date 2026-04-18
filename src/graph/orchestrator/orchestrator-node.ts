import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  IncidentTemplateSchema,
  OrchestratorDecisionSchema,
} from "../../schema/incident-template.js";
import type { IncidentWorkflowState } from "../state.js";

/** Max completed extract runs before the workflow stops retrying and finishes rejected. */
export const MAX_EXTRACT_ATTEMPTS = 3;

export function createOrchestratorNode(llm: BaseChatModel) {
  return async (
    state: IncidentWorkflowState,
  ): Promise<{ orchestration: { approved: boolean; feedback: string } }> => {
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

    try {
      const decision = await llm.withStructuredOutput(OrchestratorDecisionSchema).invoke([
        new SystemMessage(
          `You are the incident orchestrator. You only check whether the filled template is plausible and complete for routing (non-empty fields, description and environment make sense together, timestamp looks reasonable).`,
        ),
        new HumanMessage(`Template JSON:\n${JSON.stringify(parsed.data, null, 2)}`),
      ]);
      return { orchestration: decision };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        orchestration: {
          approved: false,
          feedback: `Orchestrator LLM output failed structured validation: ${msg}`,
        },
      };
    }
  };
}

export function routeAfterOrchestrator(
  state: IncidentWorkflowState,
): "agent1Extract" | "createRecord" | "finishRejected" {
  if (state.orchestration?.approved) {
    return "createRecord";
  }
  const attempts = state.extractAttempts ?? 0;
  if (attempts < MAX_EXTRACT_ATTEMPTS) {
    return "agent1Extract";
  }
  return "finishRejected";
}
