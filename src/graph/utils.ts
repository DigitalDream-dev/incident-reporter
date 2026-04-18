import type { BaseMessage } from "@langchain/core/messages";

export function lastMessageText(messages: BaseMessage[]): string {
  const last = messages[messages.length - 1];
  if (!last) {
    return "";
  }
  const c = last.content;
  if (typeof c === "string") {
    return c;
  }
  return JSON.stringify(c);
}
