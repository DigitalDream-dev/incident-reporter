/**
 * LangGraph dev server entry (see `langgraph.json`).
 * LLM: `resolveAgentChatModel` + `inspector.config.json` (see `src/llm/inspector/`).
 *
 * LangSmith: set LANGCHAIN_TRACING_V2=true, LANGCHAIN_API_KEY, LANGCHAIN_PROJECT (and optional LANGCHAIN_ENDPOINT).
 */
import "dotenv/config";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { resolveAgentChatModel } from "./llm/inspector/resolve-chat-model.js";
import { buildIncidentWorkflow } from "./graph/incident-workflow.js";
import { loadNotionMcpTools } from "./mcp/load-notion-tools.js";

const llm = resolveAgentChatModel();
const tools = await loadNotionMcpTools();

export const graph = buildIncidentWorkflow(llm, tools, {
  checkpointer: new MemorySaver(),
});
