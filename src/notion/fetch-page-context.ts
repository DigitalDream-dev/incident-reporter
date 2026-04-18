/** Notion REST API version for `Notion-Version` header. */
const NOTION_VERSION = "2022-06-28";

/** Max blocks pulled from the page tree to keep prompts bounded. */
const MAX_BLOCKS = 120;

function stripTrailingSlash(base: string): string {
  return base.replace(/\/+$/, "");
}

function richTextToPlain(
  rich: Array<{ plain_text?: string; plainText?: string }> | undefined,
): string {
  if (!rich?.length) {
    return "";
  }
  return rich.map((r) => r.plain_text ?? r.plainText ?? "").join("");
}

type NotionBlock = {
  type?: string;
  id?: string;
  has_children?: boolean;
  paragraph?: { rich_text?: unknown };
  heading_1?: { rich_text?: unknown };
  heading_2?: { rich_text?: unknown };
  heading_3?: { rich_text?: unknown };
  bulleted_list_item?: { rich_text?: unknown };
  numbered_list_item?: { rich_text?: unknown };
  quote?: { rich_text?: unknown };
  to_do?: { rich_text?: unknown; checked?: boolean };
  code?: { rich_text?: unknown; language?: string };
  callout?: { rich_text?: unknown };
};

function blockLines(block: NotionBlock): string[] {
  const rt = (obj?: { rich_text?: unknown }) =>
    richTextToPlain(obj?.rich_text as Array<{ plain_text?: string }>);
  const t = block.type;
  if (!t) {
    return [];
  }
  switch (t) {
    case "paragraph":
      return [rt(block.paragraph)].filter(Boolean);
    case "heading_1":
      return [`# ${rt(block.heading_1)}`];
    case "heading_2":
      return [`## ${rt(block.heading_2)}`];
    case "heading_3":
      return [`### ${rt(block.heading_3)}`];
    case "bulleted_list_item":
      return [`- ${rt(block.bulleted_list_item)}`];
    case "numbered_list_item":
      return [`1. ${rt(block.numbered_list_item)}`];
    case "quote":
      return [`> ${rt(block.quote)}`];
    case "to_do": {
      const c = block.to_do?.checked ? "[x]" : "[ ]";
      return [`${c} ${rt(block.to_do)}`];
    }
    case "code": {
      const lang = block.code?.language ?? "";
      return [`\`\`\`${lang}\n${rt(block.code)}\n\`\`\``];
    }
    case "callout":
      return [rt(block.callout)];
    default:
      return [];
  }
}

async function notionGet(
  token: string,
  baseUrl: string,
  path: string,
): Promise<unknown> {
  const url = `${stripTrailingSlash(baseUrl)}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Notion API ${res.status}: ${bodyText.slice(0, 800)}`);
  }
  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    throw new Error("Notion API returned non-JSON response");
  }
}

function pageTitleFromProperties(properties: Record<string, unknown> | undefined): string | null {
  if (!properties) {
    return null;
  }
  for (const [, prop] of Object.entries(properties)) {
    if (!prop || typeof prop !== "object") {
      continue;
    }
    const p = prop as { type?: string; title?: Array<{ plain_text?: string }> };
    if (p.type === "title" && Array.isArray(p.title)) {
      const t = richTextToPlain(p.title);
      if (t) {
        return t;
      }
    }
  }
  return null;
}

/**
 * Loads the Notion page and block children as plain text for the extract agent.
 * Requires a valid integration token with access to the page.
 */
export async function fetchNotionPageContext(
  pageId: string,
  token: string,
  baseUrl: string,
): Promise<string> {
  const enc = encodeURIComponent(pageId);
  const pageJson = (await notionGet(token, baseUrl, `/v1/pages/${enc}`)) as {
    properties?: Record<string, unknown>;
    url?: string;
    last_edited_time?: string;
  };

  const title = pageTitleFromProperties(pageJson.properties);
  const meta: string[] = [];
  if (title) {
    meta.push(`Title: ${title}`);
  }
  if (pageJson.url) {
    meta.push(`URL: ${pageJson.url}`);
  }
  if (pageJson.last_edited_time) {
    meta.push(`Last edited: ${pageJson.last_edited_time}`);
  }

  const lines: string[] = [...meta];
  let cursor: string | undefined;
  let count = 0;

  do {
    const qs = cursor ? `?start_cursor=${encodeURIComponent(cursor)}&page_size=100` : "?page_size=100";
    const blocksRes = (await notionGet(token, baseUrl, `/v1/blocks/${enc}/children${qs}`)) as {
      results?: NotionBlock[];
      has_more?: boolean;
      next_cursor?: string | null;
    };
    const batch = blocksRes.results ?? [];
    for (const b of batch) {
      lines.push("", ...blockLines(b));
      count++;
      if (count >= MAX_BLOCKS) {
        lines.push("", "[…truncated: block limit reached…]");
        return lines.join("\n").trim();
      }
    }
    if (blocksRes.has_more && blocksRes.next_cursor) {
      cursor = blocksRes.next_cursor;
    } else {
      break;
    }
  } while (cursor);

  return lines.join("\n").trim() || "(empty page)";
}
