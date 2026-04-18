import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { lastMessageText } from "../utils.js";
export function createCreateRecordAgent(llm, tools) {
    return createReactAgent({
        llm,
        tools,
        prompt: `You are Agent 1 (write-back). The orchestrator already approved the incident template.
When asked, use the Notion tools to create a row in the incidents database with the same fields.
Your final assistant message should briefly confirm success or report the tool error.`,
    });
}
export function createCreateRecordNode(createRecordAgent) {
    return async (state) => {
        const t = state.filledTemplate;
        if (!t) {
            return { createRecordResult: "Missing template." };
        }
        const out = await createRecordAgent.invoke({
            messages: [
                new HumanMessage(`Orchestrator approved. Create the Notion database record using this template:\n${JSON.stringify(t, null, 2)}`),
            ],
        });
        return { createRecordResult: lastMessageText(out.messages) };
    };
}
