export declare const IncidentWorkflowStateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    notionPageId: {
        (annotation: import("@langchain/langgraph").SingleReducer<string, string>): import("@langchain/langgraph").BaseChannel<string, string | import("@langchain/langgraph").OverwriteValue<string>, unknown>;
        (): import("@langchain/langgraph").LastValue<string>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    filledTemplate: {
        (annotation: import("@langchain/langgraph").SingleReducer<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        } | null, {
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        } | null>): import("@langchain/langgraph").BaseChannel<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        } | null, {
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        } | import("@langchain/langgraph").OverwriteValue<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        } | null> | null, unknown>;
        (): import("@langchain/langgraph").LastValue<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        } | null>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    orchestration: {
        (annotation: import("@langchain/langgraph").SingleReducer<{
            approved: boolean;
            feedback: string;
        } | null, {
            approved: boolean;
            feedback: string;
        } | null>): import("@langchain/langgraph").BaseChannel<{
            approved: boolean;
            feedback: string;
        } | null, {
            approved: boolean;
            feedback: string;
        } | import("@langchain/langgraph").OverwriteValue<{
            approved: boolean;
            feedback: string;
        } | null> | null, unknown>;
        (): import("@langchain/langgraph").LastValue<{
            approved: boolean;
            feedback: string;
        } | null>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
    createRecordResult: {
        (annotation: import("@langchain/langgraph").SingleReducer<string | null, string | null>): import("@langchain/langgraph").BaseChannel<string | null, string | import("@langchain/langgraph").OverwriteValue<string | null> | null, unknown>;
        (): import("@langchain/langgraph").LastValue<string | null>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
}>;
export type IncidentWorkflowState = typeof IncidentWorkflowStateAnnotation.State;
