import type {
  BaseLanguageModelInput,
  StructuredOutputMethodOptions,
} from "@langchain/core/language_models/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  assembleStructuredOutputPipeline,
  createFunctionCallingParser,
} from "@langchain/core/language_models/structured_output";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { isSerializableSchema } from "@langchain/core/utils/standard_schema";
import {
  getSchemaDescription,
  isInteropZodSchema,
} from "@langchain/core/utils/types";
import type { Runnable } from "@langchain/core/runnables";

/**
 * {@link BaseChatModel.withStructuredOutput} defaults to a parser that only accepts
 * {@link AIMessageChunk}, which breaks `.invoke()` (non-streaming). Models that only
 * implement `_generate` should use tool-call parsing on full {@link AIMessage}s instead —
 * same approach as {@link ChatAnthropic.withStructuredOutput}.
 */
export function chatModelWithStructuredOutput<RunOutput extends Record<string, unknown>>(
  model: BaseChatModel,
  outputSchema: unknown,
  config?: StructuredOutputMethodOptions<boolean>,
): Runnable<BaseLanguageModelInput, RunOutput> {
  if (typeof model.bindTools !== "function") {
    throw new Error(`Chat model must implement ".bindTools()" to use withStructuredOutput.`);
  }
  if (config?.strict) {
    throw new Error(`"strict" mode is not supported for this model.`);
  }

  let method = config?.method ?? "functionCalling";
  if (method === "jsonMode" || method === "jsonSchema") {
    method = "functionCalling";
  }
  if (method !== "functionCalling") {
    throw new TypeError(
      `Unrecognized structured output method '${String(method)}'. Use "functionCalling" for this model.`,
    );
  }

  const name = config?.name;
  const includeRaw = config?.includeRaw;
  const description =
    getSchemaDescription(outputSchema as never) ?? "A function available to call.";

  let functionName = name ?? "extract";
  const schemaRecord = outputSchema as Record<string, unknown> & { name?: string };
  if (
    !isInteropZodSchema(outputSchema) &&
    !isSerializableSchema(outputSchema) &&
    typeof schemaRecord.name === "string"
  ) {
    functionName = schemaRecord.name;
  }

  const parameters =
    isInteropZodSchema(outputSchema) || isSerializableSchema(outputSchema)
      ? toJsonSchema(outputSchema as never)
      : outputSchema;

  const tools = [
    {
      type: "function" as const,
      function: {
        name: functionName,
        description,
        parameters,
      },
    },
  ];

  const outputParser = createFunctionCallingParser(
    outputSchema as never,
    functionName,
  );
  const llm = model.bindTools(tools);
  const runName = includeRaw ? "StructuredOutputRunnable" : "CliStructuredOutput";
  return assembleStructuredOutputPipeline(
    llm,
    outputParser,
    includeRaw,
    runName,
  ) as Runnable<BaseLanguageModelInput, RunOutput>;
}
