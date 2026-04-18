import { MultiServerMCPClient, type Connection } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import {
  useMockAzureDevOps,
  validateAzureDevOpsMcpConfig,
} from "../config.js";
import { createMockAzureDevOpsTools } from "./mock-azure-devops-tools.js";

function childEnvWithCurrentProcessEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) {
      env[k] = v;
    }
  }
  return env;
}

/**
 * Stdio MCP to @tiberriver256/mcp-server-azure-devops (PAT / Azure Identity / Azure CLI per env).
 * @see https://github.com/Tiberriver256/mcp-server-azure-devops
 */
function azureDevOpsStdioConnection(): Connection {
  return {
    transport: "stdio",
    command: "npx",
    args: ["-y", "@tiberriver256/mcp-server-azure-devops"],
    env: childEnvWithCurrentProcessEnv(),
  };
}

export async function loadAzureDevOpsMcpTools(): Promise<DynamicStructuredTool[]> {
  if (useMockAzureDevOps()) {
    return createMockAzureDevOpsTools();
  }

  validateAzureDevOpsMcpConfig();

  const client = new MultiServerMCPClient({
    azureDevOps: azureDevOpsStdioConnection(),
  });
  return client.getTools();
}
