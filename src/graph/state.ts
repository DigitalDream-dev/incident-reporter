import { Annotation } from "@langchain/langgraph";
import type { IncidentTemplate } from "../schema/incident-template.js";

export const IncidentWorkflowStateAnnotation = Annotation.Root({
  notionPageId: Annotation<string>,
  filledTemplate: Annotation<IncidentTemplate | null>,
  orchestration: Annotation<{ approved: boolean; feedback: string } | null>,
  createRecordResult: Annotation<string | null>,
});

export type IncidentWorkflowState = typeof IncidentWorkflowStateAnnotation.State;
