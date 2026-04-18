import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/** Stand-in tools when `USE_MOCK_AZURE_DEVOPS=true` (same rough names as @tiberriver256/mcp-server-azure-devops). */
export function createMockAzureDevOpsTools(): DynamicStructuredTool[] {
  const searchWorkItems = new DynamicStructuredTool({
    name: "search_work_items",
    description:
      "Search for work items across Azure DevOps projects using a WIQL or text search (read). For incidents, filter to the requested tag (e.g. pending) when possible.",
    schema: z.object({
      searchText: z.string().describe("Keywords or WIQL fragment to search for"),
      project: z.string().optional().describe("Optional project name to scope the search"),
      tag: z.string().optional().describe("Only return work items with this tag (e.g. pending)"),
    }),
    func: async ({ searchText, project, tag }) => {
      const tagFilter = tag ?? "pending";
      return JSON.stringify({
        mock: true,
        query: { searchText, project, tag: tagFilter },
        workItems: [
          {
            id: 9001,
            title: "[MOCK] Related outage: payment API timeouts (pending backlog)",
            state: "Active",
            type: "Bug",
            tags: [tagFilter],
            relevance: "Synthetic **pending**-tagged match for local testing; non-pending items are not returned.",
          },
        ],
      });
    },
  });

  const listProjects = new DynamicStructuredTool({
    name: "list_projects",
    description: "List all projects in the Azure DevOps organization.",
    schema: z.object({}),
    func: async () => {
      return JSON.stringify({
        mock: true,
        projects: [{ name: "universe", id: "mock-proj" }],
      });
    },
  });

  return [searchWorkItems, listProjects];
}
