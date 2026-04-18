import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import type {
  BaseLanguageModelInput,
  StructuredOutputMethodOptions,
} from "@langchain/core/language_models/base";
import {
  BaseChatModel,
  type BaseChatModelParams,
} from "@langchain/core/language_models/chat_models";
import type { Runnable } from "@langchain/core/runnables";
import { chatModelWithStructuredOutput } from "../structured-output-tool-calls.js";
import type { BaseMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";
import { spawn } from "child_process";
import { randomUUID } from "crypto";

interface ToolDef {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

/** LangChain tools vs OpenAI `{ type: "function", function: { name, ... } }` (used by structured output). */
function normalizeBoundTool(t: unknown): ToolDef {
  if (!t || typeof t !== "object") {
    return { name: "tool", description: "" };
  }
  const o = t as Record<string, unknown>;
  if (typeof o.name === "string") {
    let parameters: Record<string, unknown> | undefined;
    const schema = o.schema;
    if (schema && typeof schema === "object" && schema !== null && "jsonSchema" in schema) {
      const js = (schema as { jsonSchema?: () => Record<string, unknown> }).jsonSchema;
      parameters = typeof js === "function" ? js() : undefined;
    } else if (schema && typeof schema === "object") {
      parameters = schema as Record<string, unknown>;
    }
    return {
      name: o.name,
      description: typeof o.description === "string" ? o.description : "",
      parameters,
    };
  }
  const fn = o.function;
  if (fn && typeof fn === "object") {
    const f = fn as Record<string, unknown>;
    return {
      name: typeof f.name === "string" ? f.name : "tool",
      description: typeof f.description === "string" ? f.description : "",
      parameters:
        f.parameters && typeof f.parameters === "object"
          ? (f.parameters as Record<string, unknown>)
          : undefined,
    };
  }
  return { name: "tool", description: "" };
}

interface CursorSubprocessParams extends BaseChatModelParams {
  command?: string;
  cursorModel?: string;
  apiKey?: string;
}

/**
 * Routes calls through the Cursor CLI (`agent -p`) as a subprocess.
 */
export class CursorSubprocessModel extends BaseChatModel {
  static lc_name() {
    return "CursorSubprocessModel";
  }

  command: string;
  cursorModel?: string;
  apiKey?: string;
  boundTools: ToolDef[] = [];

  constructor(params: CursorSubprocessParams = {}) {
    super(params);
    this.command = params.command ?? "agent";
    this.cursorModel = params.cursorModel;
    this.apiKey = params.apiKey;
  }

  _llmType(): string {
    return "cursor-subprocess";
  }

  override bindTools(tools: any[], _kwargs?: any): this {
    const bound = new CursorSubprocessModel({
      command: this.command,
      cursorModel: this.cursorModel,
      apiKey: this.apiKey,
    });
    bound.boundTools = tools.map((t) => normalizeBoundTool(t));
    return bound as this;
  }

  async _generate(
    messages: BaseMessage[],
    _options?: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    const { systemPrompt, userPrompt } = this.formatMessages(messages);
    const fullSystemPrompt = this.buildSystemPrompt(systemPrompt);

    const combinedPrompt =
      fullSystemPrompt.trim().length > 0
        ? `${fullSystemPrompt.trim()}\n\n---\n\n${userPrompt}`
        : userPrompt;

    console.log("\n┌─── [cursor-subprocess] PROMPT ───");
    if (fullSystemPrompt) {
      console.log(
        "│ System:",
        fullSystemPrompt.slice(0, 500),
        fullSystemPrompt.length > 500 ? "..." : "",
      );
    }
    console.log(
      "│ User:",
      userPrompt.slice(0, 1000),
      userPrompt.length > 1000 ? "..." : "",
    );
    console.log("└──────────────────────────────────");

    const args = ["-p", "--trust"];
    if (this.cursorModel) {
      args.push("--model", this.cursorModel);
    }
    args.push("--output-format", "text");
    args.push(combinedPrompt);

    const output = await this.runAgent(args);

    const toolCalls =
      this.boundTools.length > 0 ? this.parseToolCalls(output) : [];

    console.log("\n┌─── [cursor-subprocess] RESPONSE ───");
    if (toolCalls.length > 0) {
      console.log(
        "│ Tool calls:",
        JSON.stringify(toolCalls, null, 2).slice(0, 2000),
      );
    } else {
      console.log(
        "│",
        output.slice(0, 2000),
        output.length > 2000 ? "..." : "",
      );
    }
    console.log("└────────────────────────────────────");

    if (toolCalls.length > 0) {
      return {
        generations: [
          {
            text: "",
            message: new AIMessage({
              content: "",
              tool_calls: toolCalls,
            }),
          },
        ],
      };
    }

    return {
      generations: [
        {
          text: output,
          message: new AIMessage({ content: output }),
        },
      ],
    };
  }

  override withStructuredOutput<
    RunOutput extends Record<string, unknown> = Record<string, unknown>,
  >(
    outputSchema: unknown,
    config?: StructuredOutputMethodOptions<boolean>,
  ): Runnable<BaseLanguageModelInput, RunOutput> {
    return chatModelWithStructuredOutput(this, outputSchema, config);
  }

  private static messageContentToString(content: unknown): string {
    if (typeof content === "string") {
      return content;
    }
    if (Array.isArray(content)) {
      const parts: string[] = [];
      for (const block of content) {
        if (typeof block === "string") {
          parts.push(block);
        } else if (
          block &&
          typeof block === "object" &&
          "type" in block &&
          (block as { type: string }).type === "text" &&
          "text" in block
        ) {
          parts.push(String((block as { text: string }).text));
        }
      }
      if (parts.length > 0) {
        return parts.join("\n");
      }
    }
    return JSON.stringify(content);
  }

  private formatMessages(messages: BaseMessage[]): {
    systemPrompt: string | null;
    userPrompt: string;
  } {
    let systemPrompt: string | null = null;
    const parts: string[] = [];

    for (const msg of messages) {
      const content = CursorSubprocessModel.messageContentToString(msg.content);

      switch (msg._getType()) {
        case "system":
          systemPrompt = content;
          break;
        case "human":
          parts.push(`User: ${content}`);
          break;
        case "ai": {
          if (content) parts.push(`Assistant: ${content}`);
          const aiMsg = msg as AIMessage;
          if (aiMsg.tool_calls?.length) {
            for (const tc of aiMsg.tool_calls) {
              parts.push(
                `Assistant called tool "${tc.name}" with arguments: ${JSON.stringify(tc.args)}`,
              );
            }
          }
          break;
        }
        case "tool":
          parts.push(
            `Tool result (${(msg as any).name || "unknown"}): ${content}`,
          );
          break;
        default:
          parts.push(content);
      }
    }

    return { systemPrompt, userPrompt: parts.join("\n\n") };
  }

  private buildSystemPrompt(existingSystemPrompt: string | null): string {
    const parts: string[] = [];

    if (existingSystemPrompt) {
      parts.push(existingSystemPrompt);
    }

    if (this.boundTools.length > 0) {
      parts.push("\n\nYou have access to the following tools:\n");
      for (const tool of this.boundTools) {
        parts.push(`- ${tool.name}: ${tool.description}`);
        if (tool.parameters) {
          parts.push(`  Parameters: ${JSON.stringify(tool.parameters)}`);
        }
      }
      parts.push(
        `\nWhen you need to call a tool, respond with ONLY a JSON object in this exact format (no other text):
{"tool_calls": [{"name": "tool_name", "arguments": {...}}]}

When you want to respond to the user with text, respond normally without JSON.
Do not wrap your response in markdown code blocks when calling tools.`,
      );
    }

    return parts.join("\n");
  }

  private parseToolCalls(
    output: string,
  ): Array<{
    name: string;
    args: Record<string, any>;
    id: string;
    type: "tool_call";
  }> {
    const trimmed = output.trim();

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
        return parsed.tool_calls.map((tc: any) => ({
          name: tc.name,
          args: tc.arguments || tc.args || {},
          id: randomUUID(),
          type: "tool_call" as const,
        }));
      }
    } catch {
      const match = trimmed.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
            return parsed.tool_calls.map((tc: any) => ({
              name: tc.name,
              args: tc.arguments || tc.args || {},
              id: randomUUID(),
              type: "tool_call" as const,
            }));
          }
        } catch {
          // Not parseable
        }
      }
    }

    return [];
  }

  private runAgent(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (this.apiKey) {
        env.CURSOR_API_KEY = this.apiKey;
      }
      const proc = spawn(this.command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        env,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code: number | null) => {
        if (code !== 0) {
          reject(
            new Error(`Cursor agent exited with code ${code}: ${stderr}`),
          );
        } else {
          resolve(stdout.trim());
        }
      });
      proc.on("error", (err: Error) => reject(err));
    });
  }
}
