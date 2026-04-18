import { ClaudeSubprocessModel } from "./claude-subprocess-model.js";
import { loadInspectorConfig } from "./config.js";
import { CursorSubprocessModel } from "./cursor-subprocess-model.js";

/**
 * Returns the model from `inspector.config.json` (or INSPECTOR_CONFIG_PATH).
 *
 * - "copilot-extension": model id string (resolved via initChatModel)
 * - "subprocess": Claude CLI subprocess model
 * - "cursor-subprocess": Cursor agent CLI subprocess model
 */
export function getInspectorModel():
  | string
  | ClaudeSubprocessModel
  | CursorSubprocessModel {
  const config = loadInspectorConfig();

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
