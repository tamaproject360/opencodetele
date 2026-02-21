import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/opencode/client.js", () => ({
  opencodeClient: {
    config: {
      providers: vi.fn(),
    },
  },
}));

vi.mock("../../src/settings/manager.js", () => ({
  getCurrentModel: vi.fn(),
  setCurrentModel: vi.fn(),
}));

// Mock config with a fixed shape; we'll mutate via the imported reference in tests
vi.mock("../../src/config.js", () => ({
  config: {
    opencode: {
      apiUrl: "http://localhost:4096",
      username: "opencode",
      password: "",
      model: { provider: "test-provider", modelId: "test-model" },
    },
    server: { logLevel: "error" },
    files: { maxFileSizeKb: 100 },
    telegram: { token: "test", allowedUserId: 1, proxyUrl: "" },
    bot: { sessionsListLimit: 10, locale: "en" },
  },
}));

import { getStoredModel, selectModel } from "../../src/model/manager.js";
import { getCurrentModel, setCurrentModel } from "../../src/settings/manager.js";
import { config } from "../../src/config.js";

const mockGetCurrentModel = vi.mocked(getCurrentModel);
const mockSetCurrentModel = vi.mocked(setCurrentModel);

describe("ModelManager", () => {
  beforeEach(() => {
    mockGetCurrentModel.mockReset();
    mockSetCurrentModel.mockReset();
    // Restore config model defaults
    config.opencode.model.provider = "test-provider";
    config.opencode.model.modelId = "test-model";
  });

  describe("getStoredModel", () => {
    it("returns stored model from settings when available", () => {
      mockGetCurrentModel.mockReturnValue({
        providerID: "openai",
        modelID: "gpt-4o",
        variant: "default",
      });

      const model = getStoredModel();
      expect(model.providerID).toBe("openai");
      expect(model.modelID).toBe("gpt-4o");
      expect(model.variant).toBe("default");
    });

    it("adds default variant if stored model is missing variant", () => {
      mockGetCurrentModel.mockReturnValue({
        providerID: "openai",
        modelID: "gpt-4o",
        // no variant field
      });

      const model = getStoredModel();
      expect(model.variant).toBe("default");
    });

    it("falls back to config when no model in settings", () => {
      mockGetCurrentModel.mockReturnValue(undefined);

      const model = getStoredModel();
      expect(model.providerID).toBe("test-provider");
      expect(model.modelID).toBe("test-model");
      expect(model.variant).toBe("default");
    });

    it("returns empty model when settings and config model are both empty strings", () => {
      mockGetCurrentModel.mockReturnValue(undefined);
      config.opencode.model.provider = "";
      config.opencode.model.modelId = "";

      const model = getStoredModel();
      expect(model.providerID).toBe("");
      expect(model.modelID).toBe("");
    });
  });

  describe("selectModel", () => {
    it("calls setCurrentModel with given model info", () => {
      const model = { providerID: "anthropic", modelID: "claude-3-5-sonnet", variant: "default" };
      selectModel(model);
      expect(mockSetCurrentModel).toHaveBeenCalledWith(model);
    });
  });
});
