import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import type { IncidentWorkflowState } from "../state.js";
import { lastMessageText } from "../utils.js";

export function createAzureDevOpsContextAgent(
  llm: BaseChatModel,
  tools: DynamicStructuredTool[],
  pendingIncidentTag: string,
) {
  const tag = pendingIncidentTag.trim() || "pending";
  return createReactAgent({
    llm,
    tools,
    prompt: `You are an Azure DevOps investigator for incident triage.

You receive a structured incident template from Notion (project, description, environment, timestamp).

**Incident backlog filter:** Only consider work items that count as **${tag}** incidents for this workflow (tag \`${tag}\`, matching Area/State, or WIQL that restricts to that tag). Do **not** use broad searches that return closed or unrelated items when tools allow scoping by tag or state.

Use the available Azure DevOps tools (search work items, WIQL if available, list projects to scope). When a tool accepts tag, state, or work-item-type filters, apply them so results are **only** items still tracked as \`${tag}\` (open backlog) where your org encodes that.

Goals:
- Among **${tag}** items only, find work items that may relate to this outage or regression.
- Prefer the project implied by the template "project" field when possible.
- If no **${tag}** items match thematically, say so clearly.

Respond with a short factual summary: bullet list of candidate work items (id, title, tags/state) and relevance, or that no matching **${tag}** items were found.`,
  });
}

export function createAzureDevOpsContextNode(
  agent: ReturnType<typeof createAzureDevOpsContextAgent>,
  pendingIncidentTag: string,
): (state: IncidentWorkflowState) => Promise<{ adoContext: string }> {
  const tag = pendingIncidentTag.trim() || "pending";

  return async (state) => {
    const t = state.filledTemplate;
    if (!t) {
      return {
        adoContext: "Azure DevOps search skipped: extraction did not produce a template.",
      };
    }

    const out = await agent.invoke({
      messages: [
        new HumanMessage(
          `Investigate Azure DevOps for **${tag}-tagged** incidents related to this case.\n\nTemplate:\n${JSON.stringify(t, null, 2)}`,
        ),
      ],
    });

    return { adoContext: lastMessageText(out.messages) };
  };
}
