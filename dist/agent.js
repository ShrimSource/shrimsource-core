import { createMemory } from "./memory";
export function createAgent(hooks = {}) {
    return {
        tools: new Map(),
        memory: createMemory(),
        plugins: new Set(),
        hooks
    };
}
//# sourceMappingURL=agent.js.map