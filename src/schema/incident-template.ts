import { z } from "zod";

/**
 * Static incident template: downstream agents can rely on this shape.
 * Tags are normalized labels derived from the source Notion page.
 */
export const IncidentTemplateSchema = z.object({
  project: z.string().min(1).describe("Owning product or repo area"),
  service: z.string().min(1).describe("The failing or impacted service"),
  connection: z.string().min(1).describe("Where it runs or what it connects to: clusters, dependencies, regions, etc."),
  title: z.string().min(1).describe("Incident title from Notion page"),
  tags: z.array(z.string()).describe("Routing tags derived from the incident context (e.g. environment, team, component)"),
  notionPageId: z.string().min(1).describe("The source Notion page ID"),
});

export type IncidentTemplate = z.infer<typeof IncidentTemplateSchema>;

export const OrchestratorDecisionSchema = z.object({
  approved: z.boolean(),
  feedback: z.string(),
});

export type OrchestratorDecision = z.infer<typeof OrchestratorDecisionSchema>;
