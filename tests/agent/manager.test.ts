import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/opencode/client.js", () => ({
  opencodeClient: {
    app: { agents: vi.fn() },
    session: { messages: vi.fn() },
  },
}));

vi.mock("../../src/settings/manager.js", () => ({
  getCurrentProject: vi.fn(),
  getCurrentAgent: vi.fn(),
  setCurrentAgent: vi.fn(),
}));

vi.mock("../../src/session/manager.js", () => ({
  getCurrentSession: vi.fn(),
}));

import { getStoredAgent, selectAgent } from "../../src/agent/manager.js";
import { getCurrentAgent, setCurrentAgent } from "../../src/settings/manager.js";

const mockGetCurrentAgent = vi.mocked(getCurrentAgent);
const mockSetCurrentAgent = vi.mocked(setCurrentAgent);

describe("AgentManager", () => {
  beforeEach(() => {
    mockGetCurrentAgent.mockReset();
    mockSetCurrentAgent.mockReset();
  });

  describe("getStoredAgent", () => {
    it("returns stored agent from settings when available", () => {
      mockGetCurrentAgent.mockReturnValue("code");
      expect(getStoredAgent()).toBe("code");
    });

    it('returns default "build" when no agent is stored', () => {
      mockGetCurrentAgent.mockReturnValue(undefined);
      expect(getStoredAgent()).toBe("build");
    });
  });

  describe("selectAgent", () => {
    it("calls setCurrentAgent with given agent name", () => {
      selectAgent("research");
      expect(mockSetCurrentAgent).toHaveBeenCalledWith("research");
    });
  });
});
