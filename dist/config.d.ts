import "dotenv/config";
export declare function requireEnv(name: string): string;
export type ClaudeTransport = "api" | "cli";
/** How to reach Claude: HTTP API (`api`, default) or local `claude` CLI (`cli`). */
export declare function getClaudeTransport(): ClaudeTransport;
export declare function getAnthropicModelName(): string;
/** When true, use mock Notion tools instead of a real MCP subprocess (local dev). */
export declare function useMockNotion(): boolean;
/**
 * Optional JSON string: a map of server name → MCP connection (stdio/http/sse).
 * Passed through to MultiServerMCPClient as Record<string, Connection>.
 */
export declare function mcpServersJson(): Record<string, unknown> | null;
