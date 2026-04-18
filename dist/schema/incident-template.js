import { z } from "zod";
/**
 * Static incident template: downstream agents can rely on this shape.
 * Tags are normalized labels derived from the source Notion page.
 */
export const IncidentTemplateSchema = z.object({
    version: z.literal("1"),
    notionPageId: z.string().min(1),
    project: z.string().min(1),
    service: z.string().min(1),
    /** Where the service is connected (e.g. cluster, VPC, dependencies). */
    connection: z.string().min(1),
    /** Tags for routing / future agents (e.g. env, team, severity). */
    tags: z.array(z.string()).min(1),
});
export const OrchestratorDecisionSchema = z.object({
    approved: z.boolean(),
    feedback: z.string(),
});
