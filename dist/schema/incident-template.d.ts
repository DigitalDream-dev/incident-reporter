import { z } from "zod";
/**
 * Static incident template: downstream agents can rely on this shape.
 * Tags are normalized labels derived from the source Notion page.
 */
export declare const IncidentTemplateSchema: z.ZodObject<{
    version: z.ZodLiteral<"1">;
    notionPageId: z.ZodString;
    project: z.ZodString;
    service: z.ZodString;
    connection: z.ZodString;
    tags: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type IncidentTemplate = z.infer<typeof IncidentTemplateSchema>;
export declare const OrchestratorDecisionSchema: z.ZodObject<{
    approved: z.ZodBoolean;
    feedback: z.ZodString;
}, z.core.$strip>;
export type OrchestratorDecision = z.infer<typeof OrchestratorDecisionSchema>;
