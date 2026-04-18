import { z } from "zod";

/**
 * Static incident template: downstream agents can rely on this shape.
 * Fields are derived from the source Notion page and triage context.
 */
export const IncidentTemplateSchema = z.object({
  project: z.string().min(1).describe("Owning product or repo area"),
  description: z.string().min(1).describe("Description of the incident"),
  environment: z.string().min(1).describe("Environment of the incident"),
  timestamp: z.string().min(1).describe("Timestamp of the incident"),
});

export type IncidentTemplate = z.infer<typeof IncidentTemplateSchema>;

export const OrchestratorDecisionSchema = z.object({
  approved: z.boolean(),
  feedback: z.string(),
});

export type OrchestratorDecision = z.infer<typeof OrchestratorDecisionSchema>;
