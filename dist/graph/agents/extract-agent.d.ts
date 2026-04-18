import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { type IncidentTemplate } from "../../schema/incident-template.js";
import type { IncidentWorkflowState } from "../state.js";
export declare function createExtractAgent(llm: BaseChatModel, tools: DynamicStructuredTool[]): import("@langchain/langgraph").CompiledStateGraph<import("@langchain/langgraph").StateType<{
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}>, import("@langchain/langgraph").UpdateType<{
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}>, any, {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}, {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
    structuredResponse: {
        (annotation: import("@langchain/langgraph").SingleReducer<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        }, {
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        }>): import("@langchain/langgraph").BaseChannel<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        }, {
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
        }>, unknown>;
        (): import("@langchain/langgraph").LastValue<{
            version: "1";
            notionPageId: string;
            project: string;
            service: string;
            connection: string;
            tags: string[];
        }>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
} & {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}, import("@langchain/langgraph").StateDefinition, unknown, unknown, unknown>;
export declare function createExtractNode(extractAgent: ReturnType<typeof createExtractAgent>): (state: IncidentWorkflowState) => Promise<{
    filledTemplate: IncidentTemplate | null;
}>;
