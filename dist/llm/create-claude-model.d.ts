import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
/**
 * Anthropic Messages API (`api`) or local `claude` CLI (`cli`), controlled by `CLAUDE_TRANSPORT`.
 */
export declare function createClaudeModel(): BaseChatModel;
