import type { IncidentWorkflowState } from "../state.js";

/** Prints the approved incident summary to stdout and stores it on state for callers (e.g. CLI JSON). */
export async function createRecordNode(state: IncidentWorkflowState): Promise<{
  createRecordResult: string;
  solved: true;
}> {
  const parts: string[] = ["=== Incident workflow (approved) ===", `Notion page id: ${state.notionPageId}`];

  if (state.filledTemplate) {
    parts.push("", "Template:", JSON.stringify(state.filledTemplate, null, 2));
  } else {
    parts.push("", "(No template on state.)");
  }

  if (state.adoContext?.trim()) {
    parts.push("", "Azure DevOps context:", state.adoContext.trim());
  }

  const text = parts.join("\n");
  console.log(text);
  return { createRecordResult: text, solved: true };
}
