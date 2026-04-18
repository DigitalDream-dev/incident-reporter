import { Annotation } from "@langchain/langgraph";
import type { IncidentTemplate } from "../schema/incident-template.js";

export const IncidentWorkflowStateAnnotation = Annotation.Root({
  notionPageId: Annotation<string>,
  /** How many times agent1Extract has completed (used to cap orchestrator retries). */
  extractAttempts: Annotation<number>,
  filledTemplate: Annotation<IncidentTemplate | null>,
  orchestration: Annotation<{ approved: boolean; feedback: string } | null>,
  /** Summary from the Azure DevOps MCP step (related work items / problems). */
  adoContext: Annotation<string | null>,
  /** Set when the graph completes: true after orchestrator approval path, false when rejected. */
  solved: Annotation<boolean | null>,
  createRecordResult: Annotation<string | null>,
});

export type IncidentWorkflowState = typeof IncidentWorkflowStateAnnotation.State;
