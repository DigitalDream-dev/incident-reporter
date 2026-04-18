import { ChatAnthropic } from "@langchain/anthropic";
import { requireEnv, getAnthropicModelName, getClaudeTransport } from "../config.js";
import { ClaudeCliChatModel } from "./claude-cli-chat-model.js";
function parseCliExtraArgs() {
    const raw = process.env.CLAUDE_CLI_EXTRA_ARGS?.trim();
    if (!raw) {
        return [];
    }
    try {
        const v = JSON.parse(raw);
        if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
            throw new Error("CLAUDE_CLI_EXTRA_ARGS must be a JSON array of strings");
        }
        return v;
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            throw new Error("CLAUDE_CLI_EXTRA_ARGS must be valid JSON (array of strings)");
        }
        throw e;
    }
}
/**
 * Anthropic Messages API (`api`) or local `claude` CLI (`cli`), controlled by `CLAUDE_TRANSPORT`.
 */
export function createClaudeModel() {
    const transport = getClaudeTransport();
    const model = getAnthropicModelName();
    if (transport === "api") {
        return new ChatAnthropic({
            apiKey: requireEnv("ANTHROPIC_API_KEY"),
            model,
            temperature: 0,
        });
    }
    return new ClaudeCliChatModel({
        model,
        temperature: 0,
        cliCommand: process.env.CLAUDE_CLI_COMMAND ?? "claude",
        extraArgs: parseCliExtraArgs(),
        passModelFlag: process.env.CLAUDE_CLI_PASS_MODEL !== "false",
    });
}
