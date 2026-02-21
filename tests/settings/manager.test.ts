import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock runtime paths so no real file system is touched
vi.mock("../../src/runtime/paths.js", () => ({
  getRuntimePaths: vi.fn(() => ({
    settingsFilePath: "/tmp/test-settings.json",
  })),
}));

// We mock fs/promises to intercept reads/writes
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockMkdir = vi.fn().mockResolvedValue(undefined);

vi.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}));

import {
  loadSettings,
  getCurrentProject,
  setCurrentProject,
  clearProject,
  getCurrentSession,
  setCurrentSession,
  clearSession,
  getCurrentAgent,
  setCurrentAgent,
  clearCurrentAgent,
  getCurrentModel,
  setCurrentModel,
  clearCurrentModel,
  getPinnedMessageId,
  setPinnedMessageId,
  clearPinnedMessageId,
  getServerProcess,
  setServerProcess,
  clearServerProcess,
  __resetSettingsForTests,
} from "../../src/settings/manager.js";

describe("SettingsManager", () => {
  beforeEach(() => {
    __resetSettingsForTests();
    mockReadFile.mockReset();
    mockWriteFile.mockReset().mockResolvedValue(undefined);
    mockMkdir.mockReset().mockResolvedValue(undefined);
  });

  // --- loadSettings ---

  it("loadSettings reads settings from file and populates state", async () => {
    const stored = {
      currentProject: { id: "p1", worktree: "/repo", name: "repo" },
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(stored));

    await loadSettings();

    expect(getCurrentProject()).toEqual(stored.currentProject);
  });

  it("loadSettings returns empty settings when file does not exist (ENOENT)", async () => {
    const err = Object.assign(new Error("not found"), { code: "ENOENT" });
    mockReadFile.mockRejectedValueOnce(err);

    await loadSettings();

    expect(getCurrentProject()).toBeUndefined();
  });

  it("loadSettings returns empty settings on parse error", async () => {
    mockReadFile.mockResolvedValueOnce("not-json{{{");

    await loadSettings();

    expect(getCurrentProject()).toBeUndefined();
  });

  // --- Project ---

  it("getCurrentProject returns undefined by default", () => {
    expect(getCurrentProject()).toBeUndefined();
  });

  it("setCurrentProject stores project and triggers write", () => {
    setCurrentProject({ id: "p1", worktree: "/repo", name: "repo" });
    expect(getCurrentProject()).toEqual({ id: "p1", worktree: "/repo", name: "repo" });
  });

  it("clearProject removes project and triggers write", () => {
    setCurrentProject({ id: "p1", worktree: "/repo" });
    clearProject();
    expect(getCurrentProject()).toBeUndefined();
  });

  // --- Session ---

  it("setCurrentSession stores session", () => {
    setCurrentSession({ id: "s1", title: "My session", directory: "/repo" });
    expect(getCurrentSession()).toEqual({ id: "s1", title: "My session", directory: "/repo" });
  });

  it("clearSession removes session", () => {
    setCurrentSession({ id: "s1", title: "sess", directory: "/repo" });
    clearSession();
    expect(getCurrentSession()).toBeUndefined();
  });

  // --- Agent ---

  it("setCurrentAgent stores agent name", () => {
    setCurrentAgent("code");
    expect(getCurrentAgent()).toBe("code");
  });

  it("clearCurrentAgent removes agent", () => {
    setCurrentAgent("code");
    clearCurrentAgent();
    expect(getCurrentAgent()).toBeUndefined();
  });

  // --- Model ---

  it("setCurrentModel stores model info", () => {
    const model = { providerID: "openai", modelID: "gpt-4o", variant: "default" };
    setCurrentModel(model);
    expect(getCurrentModel()).toEqual(model);
  });

  it("clearCurrentModel removes model", () => {
    setCurrentModel({ providerID: "openai", modelID: "gpt-4o" });
    clearCurrentModel();
    expect(getCurrentModel()).toBeUndefined();
  });

  // --- PinnedMessageId ---

  it("setPinnedMessageId stores message id", () => {
    setPinnedMessageId(42);
    expect(getPinnedMessageId()).toBe(42);
  });

  it("clearPinnedMessageId removes message id", () => {
    setPinnedMessageId(42);
    clearPinnedMessageId();
    expect(getPinnedMessageId()).toBeUndefined();
  });

  // --- ServerProcess ---

  it("setServerProcess stores process info", () => {
    const info = { pid: 1234, startTime: "2024-01-01T00:00:00Z" };
    setServerProcess(info);
    expect(getServerProcess()).toEqual(info);
  });

  it("clearServerProcess removes process info", () => {
    setServerProcess({ pid: 1234, startTime: "2024-01-01T00:00:00Z" });
    clearServerProcess();
    expect(getServerProcess()).toBeUndefined();
  });

  // --- Write queue fires ---

  it("setCurrentProject triggers a write to file", async () => {
    setCurrentProject({ id: "p2", worktree: "/other" });
    // Wait for write queue
    await new Promise((r) => setTimeout(r, 10));
    expect(mockWriteFile).toHaveBeenCalled();
    const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(written.currentProject?.id).toBe("p2");
  });
});
