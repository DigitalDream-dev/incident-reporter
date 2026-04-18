import { BaseChatModel, type BaseChatModelCallOptions, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import type { BindToolsInput } from "@langchain/core/language_models/chat_models";
import { type BaseMessage } from "@langchain/core/messages";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type { ChatResult } from "@langchain/core/outputs";
export interface ClaudeCliChatModelFields extends BaseChatModelParams {
    /** Executable name or path (default: `claude`). Must be on PATH or absolute. */
    cliCommand?: string;
    /** Appended after built-in `-p` / print flags (e.g. JSON `["--max-turns","10"]`). */
    extraArgs?: string[];
    /** Model id passed to `--model` when `passModelFlag` is true (default: true). */
    model: string;
    temperature?: number;
    /** Max stdout buffer for the CLI subprocess (bytes). */
    maxBuffer?: number;
    /** Pass `--model` and `model` to the CLI (disable if your CLI uses a different flag). */
    passModelFlag?: boolean;
}
interface ClaudeCliCallOptions extends BaseChatModelCallOptions {
    tools?: BindToolsInput[];
}
/**
 * Headless Claude via the `claude` CLI (e.g. `claude -p "..."` / Claude Code).
 * Uses a JSON line protocol so {@link BaseChatModel#bindTools} and {@link BaseChatModel#withStructuredOutput} work without HTTP.
 *
 * Requires the CLI installed, on PATH, and authenticated (e.g. `claude login`).
 */
export declare class ClaudeCliChatModel extends BaseChatModel<ClaudeCliCallOptions> {
    static lc_name(): string;
    lc_namespace: string[];
    disableStreaming: boolean;
    cliCommand: string;
    extraArgs: string[];
    model: string;
    maxBuffer: number;
    passModelFlag: boolean;
    constructor(fields: ClaudeCliChatModelFields);
    _llmType(): "claude_cli";
    bindTools(tools: BindToolsInput[], kwargs?: Partial<ClaudeCliCallOptions>): import("@langchain/core/runnables").Runnable<import("@langchain/core/language_models/base").BaseLanguageModelInput, import("@langchain/core/messages").AIMessageChunk<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>, ClaudeCliCallOptions>;
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], _runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
}
export {};
