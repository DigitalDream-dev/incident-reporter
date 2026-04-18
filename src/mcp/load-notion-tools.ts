import { MultiServerMCPClient, type Connection } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { mcpServersJson, useMockNotion } from "../config.js";
import { createMockNotionTools } from "./mock-notion-tools.js";

export async function loadNotionMcpTools(): Promise<DynamicStructuredTool[]> {
  if (useMockNotion()) {
    return createMockNotionTools();
  }

  const servers = mcpServersJson();
  if (!servers || Object.keys(servers).length === 0) {
    throw new Error(
      "Set MCP_SERVERS_JSON to your Notion MCP server config, or USE_MOCK_NOTION=true for local mocks.",
    );
  }

  const client = new MultiServerMCPClient(servers as Record<string, Connection>);
  return client.getTools();
}
