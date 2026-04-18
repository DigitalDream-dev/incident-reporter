import { END, START, StateGraph } from "@langchain/langgraph";
import { createExtractAgent, createExtractNode } from "./agents/extract-agent.js";
import { createCreateRecordAgent, createCreateRecordNode } from "./agents/create-record-agent.js";
import { createOrchestratorNode, routeAfterOrchestrator, } from "./orchestrator/orchestrator-node.js";
import { finishRejectedNode } from "./orchestrator/finish-rejected.js";
import { IncidentWorkflowStateAnnotation } from "./state.js";
export function buildIncidentWorkflow(llm, tools) {
    const extractAgent = createExtractAgent(llm, tools);
    const createRecordAgent = createCreateRecordAgent(llm, tools);
    const agent1Extract = createExtractNode(extractAgent);
    const orchestrator = createOrchestratorNode(llm);
    const createRecord = createCreateRecordNode(createRecordAgent);
    const graph = new StateGraph(IncidentWorkflowStateAnnotation)
        .addNode("agent1Extract", agent1Extract)
        .addNode("orchestrator", orchestrator)
        .addNode("createRecord", createRecord)
        .addNode("finishRejected", finishRejectedNode)
        .addEdge(START, "agent1Extract")
        .addEdge("agent1Extract", "orchestrator")
        .addConditionalEdges("orchestrator", routeAfterOrchestrator, [
        "createRecord",
        "finishRejected",
    ])
        .addEdge("createRecord", END)
        .addEdge("finishRejected", END);
    return graph.compile();
}
