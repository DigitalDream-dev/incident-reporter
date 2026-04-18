/**
 * LangGraph CLI entry point.
 * Exports the compiled incident workflow graph for `npx @langchain/langgraph-cli dev`.
 */
import "dotenv/config";
import { resolveAgentChatModel } from "../llm/inspector/resolve-chat-model.js";
import { loadAzureDevOpsMcpTools } from "../mcp/load-azure-devops-mcp-tools.js";
import { loadNotionMcpTools } from "../mcp/load-notion-tools.js";
import { buildIncidentWorkflow } from "./incident-workflow.js";

const llm = resolveAgentChatModel();
const notionTools = await loadNotionMcpTools();
const adoTools = await loadAzureDevOpsMcpTools();

export const graph = buildIncidentWorkflow(llm, notionTools, adoTools);
