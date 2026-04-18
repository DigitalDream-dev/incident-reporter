import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, isAIMessage, type BaseMessage } from "@langchain/core/messages";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { notionApiBaseUrl, notionToken, resolveNotionPageId } from "../../config.js";
import { fetchNotionPageContext } from "../../notion/fetch-page-context.js";
import { IncidentTemplateSchema, type IncidentTemplate } from "../../schema/incident-template.js";
import type { IncidentWorkflowState } from "../state.js";

function aiMessageTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const block of content) {
      if (typeof block === "string") {
        parts.push(block);
      } else if (
        block &&
        typeof block === "object" &&
        "type" in block &&
        (block as { type: string }).type === "text" &&
        "text" in block
      ) {
        parts.push(String((block as { text: string }).text));
      }
    }
    if (parts.length > 0) {
      return parts.join("\n");
    }
  }
  return "";
}

/** Cursor subprocess often returns ```json ... ``` instead of a function tool call; the SO parser then yields nothing. */
function parseJsonObjectFromAssistantText(text: string): Record<string, unknown> | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const inner = fence ? fence[1].trim() : text.trim();
  try {
    const v = JSON.parse(inner) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    const brace = inner.match(/\{[\s\S]*\}/);
    if (!brace) {
      return null;
    }
    try {
      const v = JSON.parse(brace[0]) as unknown;
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

function templateFromReactResult(result: {
  structuredResponse?: unknown;
  messages?: BaseMessage[];
}): IncidentTemplate | null {
  const direct = IncidentTemplateSchema.safeParse(result.structuredResponse);
  if (direct.success) {
    return direct.data;
  }
  const messages = result.messages;
  if (!messages?.length) {
    return null;
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!isAIMessage(m)) {
      continue;
    }
    const text = aiMessageTextContent(m.content);
    if (!text.trim()) {
      continue;
    }
    const obj = parseJsonObjectFromAssistantText(text);
    if (!obj) {
      continue;
    }
    const parsed = IncidentTemplateSchema.safeParse(obj);
    if (parsed.success) {
      return parsed.data;
    }
  }
  return null;
}

export function createExtractAgent(llm: BaseChatModel, tools: DynamicStructuredTool[]) {
  return createReactAgent({
    llm,
    tools,
    prompt: `You are Agent 1 (incident triage) for on-call workflows.

The user message may include plain text loaded from the Notion REST API. You may also use Notion MCP tools when needed.
From the page content (and any tool results), extract ALL required fields:
- project: owning product or repo area
- description: clear summary of what is wrong and impact (from page title and body)
- environment: deployment or environment (e.g. prod, staging, dev) inferred from content or routing context
- timestamp: when the incident occurred or was reported, as an ISO-8601 string if you can infer a time; otherwise use the page last-edited time or a sensible placeholder from the source

When tool calls return JSON or text, parse carefully. The final structured output must match the schema exactly.

For the final template response, respond with raw JSON only (no markdown code fences) when asked for structured output, or your answer may fail parsing.`,
    responseFormat: IncidentTemplateSchema,
  });
}

export function createExtractNode(
  extractAgent: ReturnType<typeof createExtractAgent>,
): (state: IncidentWorkflowState) => Promise<{
  extractAttempts: number;
  filledTemplate: IncidentTemplate | null;
  notionPageId: string;
}> {
  return async (state) => {
    const nextAttempt = (state.extractAttempts ?? 0) + 1;
    const pageId = resolveNotionPageId(state.notionPageId);
    const token = notionToken();
    let apiContext = "";
    if (token) {
      try {
        const text = await fetchNotionPageContext(pageId, token, notionApiBaseUrl());
        apiContext = `\n\n--- Notion page (REST API) ---\n${text}\n---`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        apiContext = `\n\n--- Notion REST API error (verify NOTION_TOKEN, NOTION_BASE_URL, and integration page access) ---\n${msg}\n---`;
      }
    } else {
      apiContext =
        "\n\n(No NOTION_TOKEN: use Notion MCP tools to load the page, or set NOTION_TOKEN for direct REST fetch.)";
    }
    const preamble = `Incident accepted. Notion page id: ${pageId}.${apiContext}\n\nProduce the incident template from the content above.`;
    const retry =
      state.orchestration && !state.orchestration.approved
        ? `\n\nYour previous output was not accepted. Return a template that matches the schema exactly (project, description, environment, timestamp — all non-empty strings).\nFeedback:\n${state.orchestration.feedback}`
        : "";
    const result = await extractAgent.invoke({
      messages: [new HumanMessage(preamble + retry)],
    });
    const filledTemplate = templateFromReactResult(result);
    return {
      extractAttempts: nextAttempt,
      filledTemplate,
      notionPageId: pageId,
    };
  };
}
