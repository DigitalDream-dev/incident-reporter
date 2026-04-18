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

/** Default page id when `USE_MOCK_NOTION` is set and no id was passed in graph input or NOTION_PAGE_ID. */
const DEFAULT_MOCK_NOTION_PAGE_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Resolves the Notion page id for extraction.
 *
 * Order: non-empty graph input `notionPageId` → `NOTION_PAGE_ID` env → if mock mode, `MOCK_NOTION_PAGE_ID` env or a stable default.
 *
 * LangGraph dev / Studio often omit `notionPageId` in the input payload; in that case env (and mock default) apply.
 */
export function resolveNotionPageId(explicit: string | undefined | null): string {
  const trimmed = explicit?.trim();
  if (trimmed) {
    return trimmed;
  }
  const fromEnv = process.env.NOTION_PAGE_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (useMockNotion()) {
    return process.env.MOCK_NOTION_PAGE_ID?.trim() || DEFAULT_MOCK_NOTION_PAGE_ID;
  }
  throw new Error(
    "Missing Notion page id: pass `notionPageId` in graph input, or set NOTION_PAGE_ID in the environment.",
  );
}

const DEFAULT_NOTION_API_BASE_URL = "https://api.notion.com";

/** Same secret for REST (`fetch-page-context`) and MCP: prefer NOTION_API_KEY, else NOTION_TOKEN. */
function resolveNotionIntegrationToken(): string | undefined {
  const fromApiKey = process.env.NOTION_API_KEY?.trim();
  if (fromApiKey) {
    return fromApiKey;
  }
  return process.env.NOTION_TOKEN?.trim() || undefined;
}

/**
 * Notion internal integration token for the MCP subprocess (passed through as NOTION_TOKEN to @notionhq/notion-mcp-server).
 */
export function notionMcpApiKey(): string | undefined {
  return resolveNotionIntegrationToken();
}

/** When set, the extract step loads page text via Notion REST before the LLM runs. */
export function notionToken(): string | undefined {
  return resolveNotionIntegrationToken();
}

/** Base URL for Notion REST API (omit path). Defaults to the official API when unset. */
export function notionApiBaseUrl(): string {
  const u = process.env.NOTION_BASE_URL?.trim();
  return u || DEFAULT_NOTION_API_BASE_URL;
}

/** When true, use in-process mock Azure DevOps tools instead of the real MCP subprocess. */
export function useMockAzureDevOps(): boolean {
  return process.env.USE_MOCK_AZURE_DEVOPS === "1" || process.env.USE_MOCK_AZURE_DEVOPS === "true";
}

/**
 * Ensures real Azure DevOps MCP (`@tiberriver256/mcp-server-azure-devops`) can authenticate.
 * Default auth method is `pat` when unset (CI-friendly); use `azure-cli` or `azure-identity` otherwise.
 */
/** Tag used when searching Azure DevOps for open incidents (default `pending`). Override via INCIDENT_PENDING_TAG. */
export function incidentPendingTag(): string {
  return process.env.INCIDENT_PENDING_TAG?.trim() || "pending";
}

export function validateAzureDevOpsMcpConfig(): void {
  const org = process.env.AZURE_DEVOPS_ORG_URL?.trim();
  if (!org) {
    throw new Error(
      "Set AZURE_DEVOPS_ORG_URL (e.g. https://dev.azure.com/yourorg) or USE_MOCK_AZURE_DEVOPS=true.",
    );
  }
  const auth = (process.env.AZURE_DEVOPS_AUTH_METHOD ?? "pat").trim().toLowerCase();
  if (auth === "pat" && !process.env.AZURE_DEVOPS_PAT?.trim()) {
    throw new Error(
      "AZURE_DEVOPS_AUTH_METHOD is pat (default): set AZURE_DEVOPS_PAT, " +
        "or set AZURE_DEVOPS_AUTH_METHOD to azure-cli / azure-identity and sign in as documented for the MCP server.",
    );
  }
}
