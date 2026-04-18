import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import type { IncidentWorkflowState } from "../state.js";
export declare function createCreateRecordAgent(llm: BaseChatModel, tools: DynamicStructuredTool[]): import("@langchain/langgraph").CompiledStateGraph<import("@langchain/langgraph").StateType<{
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}>, import("@langchain/langgraph").UpdateType<{
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}>, any, {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}, {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
    structuredResponse: {
        (annotation: import("@langchain/langgraph").SingleReducer<Record<string, any>, Record<string, any>>): import("@langchain/langgraph").BaseChannel<Record<string, any>, Record<string, any> | import("@langchain/langgraph").OverwriteValue<Record<string, any>>, unknown>;
        (): import("@langchain/langgraph").LastValue<Record<string, any>>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
} & {
    messages: import("@langchain/langgraph").BaseChannel<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").OverwriteValue<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]> | import("@langchain/langgraph").Messages, unknown>;
}, import("@langchain/langgraph").StateDefinition, unknown, unknown, unknown>;
export declare function createCreateRecordNode(createRecordAgent: ReturnType<typeof createCreateRecordAgent>): (state: IncidentWorkflowState) => Promise<{
    createRecordResult: string;
}>;
