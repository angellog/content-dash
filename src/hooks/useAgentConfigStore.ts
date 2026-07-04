import { create } from "zustand";

interface AgentConfigState {
  agentFramework: string;
  setAgentFramework: (framework: string) => void;
  fetchAgentFramework: () => Promise<void>;
}

export const useAgentConfigStore = create<AgentConfigState>((set) => ({
  agentFramework: "openclaw",
  setAgentFramework: (agentFramework) => set({ agentFramework }),
  fetchAgentFramework: async () => {
    try {
      const res = await fetch("/api/agent/config");
      if (res.ok) {
        const data = await res.json();
        set({ agentFramework: data.agentFramework ?? "openclaw" });
      }
    } catch {
      // keep current value
    }
  },
}));
