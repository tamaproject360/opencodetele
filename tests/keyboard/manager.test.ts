import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/agent/manager.js", () => ({
  getStoredAgent: vi.fn(() => "build"),
}));

vi.mock("../../src/model/manager.js", () => ({
  getStoredModel: vi.fn(() => ({
    providerID: "test-provider",
    modelID: "test-model",
    variant: "default",
  })),
}));

vi.mock("../../src/variant/manager.js", () => ({
  formatVariantForButton: vi.fn((v: string) => `💡 ${v}`),
}));

vi.mock("../../src/bot/utils/keyboard.js", () => ({
  createMainKeyboard: vi.fn(() => ({ keyboard: [["mock-btn"]] })),
}));

vi.mock("../../src/i18n/index.js", () => ({
  t: vi.fn((key: string) => key),
}));

import { keyboardManager } from "../../src/keyboard/manager.js";
import { createMainKeyboard } from "../../src/bot/utils/keyboard.js";

const mockCreateMainKeyboard = vi.mocked(createMainKeyboard);

// Minimal stub for grammy Api
function makeApi() {
  return {
    sendMessage: vi.fn().mockResolvedValue({}),
  } as unknown as import("grammy").Api;
}

describe("KeyboardManager", () => {
  beforeEach(() => {
    // Reset via global setup.ts → resetSingletonState clears keyboard state
    mockCreateMainKeyboard.mockClear();
  });

  it("isInitialized returns false before initialize()", () => {
    expect(keyboardManager.isInitialized()).toBe(false);
  });

  it("initialize sets up the manager with agent, model, variant", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);

    expect(keyboardManager.isInitialized()).toBe(true);
    const state = keyboardManager.getState();
    expect(state?.currentAgent).toBe("build");
    expect(state?.currentModel?.providerID).toBe("test-provider");
  });

  it("initialize called twice only inits once (re-uses state)", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);
    const state1 = keyboardManager.getState();

    keyboardManager.initialize(api, 456);
    const state2 = keyboardManager.getState();

    // State object reference should be the same (no re-init)
    expect(state1?.currentAgent).toBe(state2?.currentAgent);
  });

  it("updateAgent changes the stored agent", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);

    keyboardManager.updateAgent("research");
    expect(keyboardManager.getState()?.currentAgent).toBe("research");
  });

  it("updateAgent logs warning if not initialized", () => {
    // Manager is cleared by global setup before each test
    keyboardManager.updateAgent("code"); // should not throw
  });

  it("updateModel changes the stored model", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);

    keyboardManager.updateModel({ providerID: "anthropic", modelID: "claude-3", variant: "low" });
    expect(keyboardManager.getState()?.currentModel?.providerID).toBe("anthropic");
    expect(keyboardManager.getState()?.currentModel?.modelID).toBe("claude-3");
  });

  it("updateContext stores context info", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);

    keyboardManager.updateContext(5000, 100000);
    expect(keyboardManager.getContextInfo()).toEqual({ tokensUsed: 5000, tokensLimit: 100000 });
  });

  it("clearContext removes context info", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);

    keyboardManager.updateContext(5000, 100000);
    keyboardManager.clearContext();
    expect(keyboardManager.getContextInfo()).toBeNull();
  });

  it("getKeyboard returns undefined if not initialized", () => {
    expect(keyboardManager.getKeyboard()).toBeUndefined();
  });

  it("getKeyboard calls createMainKeyboard with current state when initialized", () => {
    const api = makeApi();
    keyboardManager.initialize(api, 123);

    const kb = keyboardManager.getKeyboard();
    expect(kb).toBeDefined();
    expect(mockCreateMainKeyboard).toHaveBeenCalled();
  });
});
