#!/usr/bin/env node
/**
 * Manual trigger (stand-in for PagerDuty webhook later):
 *
 *   ANTHROPIC_API_KEY=... USE_MOCK_NOTION=true npx tsx src/cli.ts --page-id <notion_page_id>
 *   CLAUDE_TRANSPORT=cli  (uses `claude` CLI; no API key — must be logged in via CLI)
 *
 * Real Notion MCP: set MCP_SERVERS_JSON and omit USE_MOCK_NOTION.
 */
import { buildIncidentWorkflow } from "./graph/incident-workflow.js";
import { createClaudeModel } from "./llm/create-claude-model.js";
import { loadNotionMcpTools } from "./mcp/load-notion-tools.js";

function parseArgs(): { pageId: string } {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--page-id");
  if (idx === -1 || !argv[idx + 1]) {
    console.error("Usage: incident-reporter --page-id <NOTION_PAGE_ID>");
    process.exit(1);
  }
  return { pageId: argv[idx + 1]! };
}

async function main() {
  const { pageId } = parseArgs();
  const llm = createClaudeModel();
  const tools = await loadNotionMcpTools();
  const workflow = buildIncidentWorkflow(llm, tools);

  const result = await workflow.invoke({
    notionPageId: pageId,
    filledTemplate: null,
    orchestration: null,
    createRecordResult: null,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
