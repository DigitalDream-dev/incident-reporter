import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { END, START, StateGraph } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { incidentPendingTag } from "../config.js";
import { createExtractAgent, createExtractNode } from "./agents/extract-agent.js";
import {
  createAzureDevOpsContextAgent,
  createAzureDevOpsContextNode,
} from "./agents/azure-devops-context-agent.js";
import {
  createOrchestratorNode,
  routeAfterOrchestrator,
} from "./orchestrator/orchestrator-node.js";
import { createRecordNode } from "./orchestrator/create-record.js";
import { finishRejectedNode } from "./orchestrator/finish-rejected.js";
import { IncidentWorkflowStateAnnotation } from "./state.js";

export type { IncidentWorkflowState } from "./state.js";

export function buildIncidentWorkflow(
  llm: BaseChatModel,
  notionTools: DynamicStructuredTool[],
  adoTools: DynamicStructuredTool[],
  compileOptions?: { checkpointer?: BaseCheckpointSaver },
) {
  const extractAgent = createExtractAgent(llm, notionTools);
  const pendingTag = incidentPendingTag();
  const adoAgent = createAzureDevOpsContextAgent(llm, adoTools, pendingTag);

  const agent1Extract = createExtractNode(extractAgent);
  const azureDevOpsContext = createAzureDevOpsContextNode(adoAgent, pendingTag);
  const orchestrator = createOrchestratorNode(llm);

  const graph = new StateGraph(IncidentWorkflowStateAnnotation)
    .addNode("agent1Extract", agent1Extract)
    .addNode("azureDevOpsContext", azureDevOpsContext)
    .addNode("orchestrator", orchestrator)
    .addNode("createRecord", createRecordNode)
    .addNode("finishRejected", finishRejectedNode)
    .addEdge(START, "agent1Extract")
    .addEdge("agent1Extract", "azureDevOpsContext")
    .addEdge("azureDevOpsContext", "orchestrator")
    .addConditionalEdges("orchestrator", routeAfterOrchestrator, [
      "agent1Extract",
      "createRecord",
      "finishRejected",
    ])
    .addEdge("createRecord", END)
    .addEdge("finishRejected", END);

  return graph.compile(
    compileOptions?.checkpointer ? { checkpointer: compileOptions.checkpointer } : {},
  );
}
