import { DynamicStructuredTool } from "@langchain/core/tools";
/**
 * Stand-in tools when no Notion MCP server is configured.
 * Replace with real MCP tools in production (same names are not required — prompts use generic wording).
 */
export declare function createMockNotionTools(): DynamicStructuredTool[];
