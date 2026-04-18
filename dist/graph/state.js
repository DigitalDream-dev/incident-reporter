import { Annotation } from "@langchain/langgraph";
export const IncidentWorkflowStateAnnotation = Annotation.Root({
    notionPageId: (Annotation),
    filledTemplate: (Annotation),
    orchestration: (Annotation),
    createRecordResult: (Annotation),
});
