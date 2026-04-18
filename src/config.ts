import "dotenv/config";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export type ClaudeTransport = "api" | "cli";

/** How to reach Claude: HTTP API (`api`, default) or local `claude` CLI (`cli`). */
export function getClaudeTransport(): ClaudeTransport {
  const v = (process.env.CLAUDE_TRANSPORT ?? "api").toLowerCase();
  if (v === "cli" || v === "api") {
    return v;
  }
  throw new Error("CLAUDE_TRANSPORT must be 'api' or 'cli'");
}

export function getAnthropicModelName(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
}

/** When true, use mock Notion tools instead of a real MCP subprocess (local dev). */
export function useMockNotion(): boolean {
  return process.env.USE_MOCK_NOTION === "1" || process.env.USE_MOCK_NOTION === "true";
}

/**
 * Optional JSON string: a map of server name → MCP connection (stdio/http/sse).
 * Passed through to MultiServerMCPClient as Record<string, Connection>.
 */
export function mcpServersJson(): Record<string, unknown> | null {
  const raw = process.env.MCP_SERVERS_JSON;
  if (!raw?.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("MCP_SERVERS_JSON must be valid JSON");
  }
}
