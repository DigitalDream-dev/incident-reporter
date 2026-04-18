import { MultiServerMCPClient, type Connection } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { notionMcpApiKey, useMockNotion } from "../config.js";
import { createMockNotionTools } from "./mock-notion-tools.js";

/**
 * Official Notion MCP server (stdio). It reads **NOTION_TOKEN** for the Notion API (not NOTION_API_KEY).
 * @see https://github.com/makenotion/notion-mcp-server#option-1-using-notion_token-recommended
 */
function notionMcpStdioConnection(integrationToken: string): Connection {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) {
      env[k] = v;
    }
  }
  // Resolved secret must win over any empty NOTION_* in the parent env.
  env.NOTION_TOKEN = integrationToken;
  return {
    transport: "stdio",
    command: "npx",
    args: ["-y", "@notionhq/notion-mcp-server"],
    env,
  };
}

export async function loadNotionMcpTools(): Promise<DynamicStructuredTool[]> {
  if (useMockNotion()) {
    return createMockNotionTools();
  }

  const key = notionMcpApiKey();
  if (!key) {
    throw new Error(
      "USE_MOCK_NOTION is false but neither NOTION_TOKEN nor NOTION_API_KEY is set.\n" +
        "  Add your Notion integration secret to .env (NOTION_TOKEN is enough for REST + MCP), or\n" +
        "  set USE_MOCK_NOTION=true to use built-in mock tools without calling Notion.",
    );
  }

  const client = new MultiServerMCPClient({
    notion: notionMcpStdioConnection(key),
  });
  return client.getTools();
}
