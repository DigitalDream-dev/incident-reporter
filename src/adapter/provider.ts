import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ClaudeSubprocessModel } from "./claude-subprocess.js";
import { loadConfig } from "./config.js";
import { CursorSubprocessModel } from "./cursor-subprocess.js";
import { LlmLoggingHandler } from "./logging.js";

/**
 * Returns the model to use based on the inspector config.
 *
 * - "copilot-extension": returns the model string as-is (extension handles routing)
 * - "subprocess": returns a ClaudeSubprocessModel that spawns the Claude CLI
 * - "cursor-subprocess": returns a CursorSubprocessModel that spawns the Cursor agent CLI
 */
export function getModel():
  | string
  | ClaudeSubprocessModel
  | CursorSubprocessModel {
  const config = loadConfig();

  switch (config.providerMode) {
    case "copilot-extension":
      return config.model;

    case "subprocess":
      return new ClaudeSubprocessModel({
        command: config.subprocess?.command ?? "claude",
        claudeModel: config.subprocess?.model,
        apiKey: config.subprocess?.apiKey,
      });

    case "cursor-subprocess":
      return new CursorSubprocessModel({
        command: config.cursor?.command ?? "agent",
        cursorModel: config.cursor?.model,
        apiKey: config.cursor?.apiKey,
      });

    default:
      return config.model;
  }
}

/**
 * Returns a BaseChatModel ready for the LangGraph workflow.
 *
 * - "subprocess"        → ClaudeSubprocessModel  (has built-in logging)
 * - "cursor-subprocess" → CursorSubprocessModel  (has built-in logging)
 * - "copilot-extension" → Anthropic API model via createClaudeModel()
 *
 * A LlmLoggingHandler callback is attached for API-based models so
 * every provider mode produces visible prompt/response logs.
 */
export function getWorkflowModel(): BaseChatModel {
  const config = loadConfig();
  console.log(`[adapter] providerMode = ${config.providerMode}`);

  let model: BaseChatModel;
  switch (config.providerMode) {
    case "subprocess": {
      console.log(`[adapter] Using Claude subprocess (command: ${config.subprocess?.command ?? "claude"})`);
      model = new ClaudeSubprocessModel({
        command: config.subprocess?.command ?? "claude",
        claudeModel: config.subprocess?.model,
        apiKey: config.subprocess?.apiKey,
      });
      break;
    }

    case "cursor-subprocess": {
      console.log(`[adapter] Using Cursor subprocess (command: ${config.cursor?.command ?? "agent"})`);
      model = new CursorSubprocessModel({
        command: config.cursor?.command ?? "agent",
        cursorModel: config.cursor?.model,
        apiKey: config.cursor?.apiKey,
      });
      break;
    }

    case "copilot-extension":
    default: {
      const baseUrl = process.env.OPENAI_BASE_URL;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!baseUrl || !apiKey) {
        throw new Error(
          "[adapter] copilot-extension mode requires OPENAI_BASE_URL and OPENAI_API_KEY in .env",
        );
      }
      console.log(`[adapter] Using GitHub Copilot extension (model: ${config.model})`);
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
