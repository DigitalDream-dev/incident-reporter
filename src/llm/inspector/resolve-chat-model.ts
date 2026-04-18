import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { loadInspectorConfig } from "./config.js";
import { getInspectorModel } from "./provider.js";
import { LlmLoggingHandler } from "./logging.js";

/**
 * Resolves the workflow LLM from `inspector.config.json` (or INSPECTOR_CONFIG_PATH).
 *
 * - copilot-extension → ChatOpenAI (OPENAI_BASE_URL + OPENAI_API_KEY in .env)
 * - subprocess → Claude CLI subprocess model
 * - cursor-subprocess → Cursor agent CLI subprocess model
 */
export function resolveAgentChatModel(): BaseChatModel {
  const config = loadInspectorConfig();
  console.log(`[inspector] providerMode = ${config.providerMode}`);

  let model: BaseChatModel;

  switch (config.providerMode) {
    case "subprocess": {
      console.log(`[inspector] Claude subprocess (${config.subprocess?.command ?? "claude"})`);
      const m = getInspectorModel();
      if (typeof m === "string") {
        throw new Error("[inspector] subprocess expected ClaudeSubprocessModel");
      }
      model = m;
      break;
    }

    case "cursor-subprocess": {
      console.log(`[inspector] Cursor subprocess (${config.cursor?.command ?? "agent"})`);
      const m = getInspectorModel();
      if (typeof m === "string") {
        throw new Error("[inspector] cursor-subprocess expected CursorSubprocessModel");
      }
      model = m;
      break;
    }

    case "copilot-extension":
    default: {
      const baseUrl = process.env.OPENAI_BASE_URL;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!baseUrl || !apiKey) {
        throw new Error(
          "[inspector] copilot-extension requires OPENAI_BASE_URL and OPENAI_API_KEY in .env",
        );
      }
      console.log(`[inspector] copilot-extension (model: ${config.model})`);
      model = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: config.model,
        temperature: 0,
        configuration: { baseURL: baseUrl },
      });
      break;
    }
  }

  const existing = Array.isArray(model.callbacks) ? model.callbacks : [];
  model.callbacks = [...existing, new LlmLoggingHandler()];
  return model;
}
