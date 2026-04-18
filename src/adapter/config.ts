import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";

const subprocessConfigSchema = z.object({
  command: z.string().default("claude"),
  model: z.string().optional(),
  apiKey: z.string().optional(),
});

const cursorConfigSchema = z.object({
  command: z.string().default("agent"),
  model: z.string().optional(),
  apiKey: z.string().optional(),
});

const configSchema = z.object({
  providerMode: z
    .enum(["copilot-extension", "subprocess", "cursor-subprocess"])
    .default("copilot-extension"),
  model: z.string().default("openai:gpt-5.2"),
  subprocess: subprocessConfigSchema.optional(),
  cursor: cursorConfigSchema.optional(),
});

export type Config = z.infer<typeof configSchema>;

/** Loads `inspector.config.json` from cwd, or `INSPECTOR_CONFIG_PATH` when set. */
export function loadConfig(): Config {
  const configPath = process.env.INSPECTOR_CONFIG_PATH?.trim()
    ? resolve(process.env.INSPECTOR_CONFIG_PATH.trim())
    : resolve(process.cwd(), "inspector.config.json");
  if (existsSync(configPath)) {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    return configSchema.parse(raw);
  }
  return configSchema.parse({});
}
