import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * Stand-in tools when no Notion MCP server is configured.
 * Replace with real MCP tools in production (same names are not required — prompts use generic wording).
 */
export function createMockNotionTools() {
    const getPage = new DynamicStructuredTool({
        name: "notion_get_page",
        description: "Fetch a Notion page by id and return structured fields for incident triage (project, service, connection).",
        schema: z.object({
            page_id: z.string().describe("Notion page id or URL fragment"),
        }),
        func: async ({ page_id }) => {
            const payload = {
                page_id,
                project: "universe",
                service: "billing-api",
                connection: "k8s:prod/billing, postgres:incidents-ro, kafka:main",
                title: "[MOCK] Accepted incident",
                body: "Synthetic page body for local testing.",
            };
            return JSON.stringify(payload);
        },
    });
    const createDbRow = new DynamicStructuredTool({
        name: "notion_create_database_item",
        description: "Create a row in the Notion incidents database from structured properties.",
        schema: z.object({
            properties_json: z
                .string()
                .describe("JSON string of Notion property map matching your database schema"),
        }),
        func: async ({ properties_json }) => {
            return JSON.stringify({
                ok: true,
                mock: true,
                stored: JSON.parse(properties_json),
            });
        },
    });
    return [getPage, createDbRow];
}
