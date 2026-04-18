import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { IncidentTemplateSchema, type IncidentTemplate } from "../../schema/incident-template.js";
import type { IncidentWorkflowState } from "../state.js";

export function createExtractAgent(llm: BaseChatModel, tools: DynamicStructuredTool[]) {
  return createReactAgent({
    llm,
    tools,
    prompt: `You are Agent 1 (incident triage) for on-call workflows.

Use the available Notion MCP tools to read the incident Notion page the user references.
From that page, extract ALL required fields:
- project: owning product or repo area
- service: the failing or impacted service
- connection: where it runs or what it connects to (clusters, dependencies, regions, etc.)
- title: the incident title from the Notion page
- notionPageId: the Notion page ID provided by the user
- tags: a small array of routing tags derived from the context

For tags, analyze the connection string and other context to generate useful labels for routing
and automation. Include tags for:
- Environment (prod, staging, dev)
- Infrastructure (kubernetes, k8s, postgres, kafka, aws, gcp, etc.)
- Service/component names
- Team or domain labels

Example tags: ["prod", "kubernetes", "billing", "database", "postgres", "kafka", "messaging"]

When tool calls return JSON or text, parse carefully. The final structured output must match the schema exactly.`,
    responseFormat: IncidentTemplateSchema,
  });
}

export function createExtractNode(
  extractAgent: ReturnType<typeof createExtractAgent>,
): (state: IncidentWorkflowState) => Promise<{ filledTemplate: IncidentTemplate | null }> {
  return async (state) => {
    const result = await extractAgent.invoke({
      messages: [
        new HumanMessage(
          `Incident accepted. Load Notion page id: ${state.notionPageId} and produce the incident template.`,
        ),
      ],
    });
    const structured = result.structuredResponse as IncidentTemplate | undefined;
    return {
      filledTemplate: structured ?? null,
    };
  };
}
