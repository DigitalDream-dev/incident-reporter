export async function finishRejectedNode(state) {
    const fb = state.orchestration?.feedback ?? "unknown";
    return {
        createRecordResult: `Notion row not created. Orchestrator rejected: ${fb}`,
    };
}
