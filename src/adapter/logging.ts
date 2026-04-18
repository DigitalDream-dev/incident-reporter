import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { BaseMessage } from "@langchain/core/messages";
import type { LLMResult } from "@langchain/core/outputs";

/**
 * LangChain callback handler that logs every LLM call (prompt + response)
 * to the console. Works with all provider modes.
 *
 * Usage: pass `{ callbacks: [new LlmLoggingHandler()] }` when invoking
 * agents or chains, or set it as a default callback on the model.
 */
export class LlmLoggingHandler extends BaseCallbackHandler {
  name = "llm-logger";

  handleLLMStart(
    _llm: Serialized,
    prompts: string[],
    _runId: string,
    _parentRunId?: string,
    _extraParams?: Record<string, unknown>,
  ): void {
    console.log("\n┌─── [LLM] PROMPT ───");
    for (const p of prompts) {
      console.log(`│ ${truncate(p, 1000)}`);
    }
    console.log("└──────────────────────────────────");
  }

  handleChatModelStart(
    _llm: Serialized,
    messages: BaseMessage[][],
  ): void {
    console.log("\n┌─── [LLM] CHAT PROMPT ───");
    for (const batch of messages) {
      for (const msg of batch) {
        const type = msg._getType();
        const content = msgContent(msg);
        console.log(`│ [${type}] ${truncate(content, 1000)}`);
      }
    }
    console.log("└──────────────────────────────────");
  }

  handleLLMEnd(output: LLMResult): void {
    console.log("\n┌─── [LLM] RESPONSE ───");
    for (const gen of output.generations) {
      for (const g of gen) {
        if (g.text) {
          console.log(`│ ${truncate(g.text, 2000)}`);
        }
        const toolCalls =
          (g as any).tool_calls ??
          (g as any).message?.tool_calls;
        if (toolCalls?.length) {
          console.log(
            "│ Tool calls:",
            truncate(JSON.stringify(toolCalls, null, 2), 2000),
          );
        }
      }
    }
    console.log("└────────────────────────────────────");
  }

  handleLLMError(err: Error): void {
    console.error("\n┌─── [LLM] ERROR ───");
    console.error(`│ ${err.message}`);
    console.error("└────────────────────────────────────");
  }
}

function msgContent(msg: BaseMessage): string {
  return typeof msg.content === "string"
    ? msg.content
    : JSON.stringify(msg.content);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}
