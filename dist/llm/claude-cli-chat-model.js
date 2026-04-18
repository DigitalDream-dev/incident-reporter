import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
import { AIMessage } from "@langchain/core/messages";
import { isAIMessage, isToolMessage } from "@langchain/core/messages";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
function getTextContent(msg) {
    const c = msg.content;
    if (typeof c === "string") {
        return c;
    }
    return JSON.stringify(c);
}
function messagesToTranscript(messages) {
    const parts = [];
    for (const m of messages) {
        if (m._getType() === "system") {
            parts.push(`[system]\n${getTextContent(m)}`);
        }
        else if (m._getType() === "human") {
            parts.push(`[user]\n${getTextContent(m)}`);
        }
        else if (m._getType() === "ai") {
            if (isAIMessage(m) && m.tool_calls?.length) {
                parts.push(`[assistant tool_calls]\n${JSON.stringify(m.tool_calls, null, 2)}`);
            }
            else {
                parts.push(`[assistant]\n${getTextContent(m)}`);
            }
        }
        else if (isToolMessage(m)) {
            parts.push(`[tool:${m.name}]\n${getTextContent(m)}`);
        }
        else {
            parts.push(`[${m._getType()}]\n${getTextContent(m)}`);
        }
    }
    return parts.join("\n\n");
}
function stripMarkdownFences(raw) {
    const t = raw.trim();
    const m = t.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    return m ? m[1].trim() : t;
}
/**
 * Headless Claude via the `claude` CLI (e.g. `claude -p "..."` / Claude Code).
 * Uses a JSON line protocol so {@link BaseChatModel#bindTools} and {@link BaseChatModel#withStructuredOutput} work without HTTP.
 *
 * Requires the CLI installed, on PATH, and authenticated (e.g. `claude login`).
 */
export class ClaudeCliChatModel extends BaseChatModel {
    static lc_name() {
        return "ClaudeCliChatModel";
    }
    lc_namespace = ["incident_reporter", "llm"];
    disableStreaming = true;
    cliCommand;
    extraArgs;
    model;
    maxBuffer;
    passModelFlag;
    constructor(fields) {
        super(fields);
        this.cliCommand = fields.cliCommand ?? "claude";
        this.extraArgs = fields.extraArgs ?? [];
        this.model = fields.model;
        this.maxBuffer = fields.maxBuffer ?? 32 * 1024 * 1024;
        this.passModelFlag = fields.passModelFlag ?? true;
    }
    _llmType() {
        return "claude_cli";
    }
    bindTools(tools, kwargs) {
        return this.withConfig({
            tools,
            ...kwargs,
        });
    }
    async _generate(messages, options, _runManager) {
        const transcript = messagesToTranscript(messages);
        const tools = options.tools ?? [];
        const toolLines = tools.length === 0
            ? ""
            : `\n\nAvailable tools (you may only use these names):\n${tools
                .map((t) => {
                if (t && typeof t === "object" && "type" in t && t.type === "function" && "function" in t) {
                    const fn = t
                        .function;
                    return `- ${fn.name}: ${fn.description ?? ""}\n  parameters: ${JSON.stringify(fn.parameters ?? {})}`;
                }
                if (t && typeof t === "object" && "name" in t) {
                    const x = t;
                    return `- ${x.name}: ${x.description ?? ""}\n  schema: ${JSON.stringify(x.schema ?? {})}`;
                }
                return `- ${JSON.stringify(t)}`;
            })
                .join("\n")}`;
        const protocol = `
You are the model behind this CLI bridge. Respond with ONE JSON object only (no markdown fences).

If you need to call one or more tools:
{"tool_calls":[{"id":"optional-id","name":"<tool name>","args":{}}]}

If tools are listed above and you need them, prefer tool_calls until the task is done; otherwise reply with:
{"text":"<plain assistant message>"}

The JSON must be valid.`;
        const prompt = `${protocol}${toolLines}\n\n--- Conversation ---\n${transcript}`;
        const args = [...this.extraArgs, "-p", prompt];
        if (this.passModelFlag) {
            args.push("--model", this.model);
        }
        const { stdout } = await execFileAsync(this.cliCommand, args, {
            maxBuffer: this.maxBuffer,
            env: { ...process.env },
        });
        const trimmed = stripMarkdownFences(stdout);
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch {
            const msg = new AIMessage({ content: trimmed });
            return {
                generations: [{ text: trimmed, message: msg }],
            };
        }
        if (parsed.tool_calls && Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
            const tool_calls = parsed.tool_calls.map((tc, i) => ({
                id: tc.id ?? `cli_${i}_${tc.name}`,
                name: tc.name,
                args: tc.args ?? {},
            }));
            const msg = new AIMessage({
                content: "",
                tool_calls,
            });
            return {
                generations: [{ text: "", message: msg }],
            };
        }
        const text = typeof parsed.text === "string" ? parsed.text : JSON.stringify(parsed);
        const msg = new AIMessage({ content: text });
        return {
            generations: [{ text, message: msg }],
        };
    }
}
