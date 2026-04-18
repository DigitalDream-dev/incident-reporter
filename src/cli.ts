#!/usr/bin/env node
import "dotenv/config";

/**
 * Manual trigger (stand-in for PagerDuty webhook later):
 *
 *   ANTHROPIC_API_KEY=... USE_MOCK_NOTION=true npx tsx src/cli.ts --page-id <notion_page_id>
 *   npm requires `--` before script args:  npm run dev -- --page-id <notion_page_id>
 *   Or set NOTION_PAGE_ID in .env and run:  npm run dev
 *   With USE_MOCK_NOTION=true, LangGraph dev can omit notionPageId — NOTION_PAGE_ID or a built-in mock id is used.
 *
 * LLM: `inspector.config.json` (or INSPECTOR_CONFIG_PATH); see `src/llm/inspector/`.
 *   - copilot-extension: set OPENAI_BASE_URL + OPENAI_API_KEY (.env)
 *   - cursor-subprocess: set providerMode + `cursor` block
 *
 * Real Notion MCP: set NOTION_API_KEY (or NOTION_TOKEN) and USE_MOCK_NOTION=false (see .env.example).
 * Azure DevOps MCP: USE_MOCK_AZURE_DEVOPS=false plus AZURE_DEVOPS_ORG_URL (and PAT if using pat auth).
 */
import { resolveAgentChatModel } from "./llm/inspector/resolve-chat-model.js";
import { buildIncidentWorkflow } from "./graph/incident-workflow.js";
import { loadAzureDevOpsMcpTools } from "./mcp/load-azure-devops-mcp-tools.js";
import { loadNotionMcpTools } from "./mcp/load-notion-tools.js";

function parseArgs(): { pageId: string } {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--page-id");
  if (idx !== -1 && argv[idx + 1]) {
    return { pageId: argv[idx + 1]! };
  }
  const fromEnv = process.env.NOTION_PAGE_ID?.trim();
  if (fromEnv) {
    return { pageId: fromEnv };
  }
  console.error(
    "Missing Notion page id. Use: npm run dev -- --page-id <NOTION_PAGE_ID>\n" +
    "(npm needs `--` before arguments) or set NOTION_PAGE_ID in the environment.",
  );
  process.exit(1);
}

async function main() {
  const { pageId } = parseArgs();
  const llm = resolveAgentChatModel();
  const notionTools = await loadNotionMcpTools();
  const adoTools = await loadAzureDevOpsMcpTools();
  const workflow = buildIncidentWorkflow(llm, notionTools, adoTools);

  const result = await workflow.invoke({
    notionPageId: pageId,
    extractAttempts: 0,
    filledTemplate: null,
    orchestration: null,
    adoContext: null,
    solved: null,
    createRecordResult: null,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
