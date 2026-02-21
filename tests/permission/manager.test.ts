import { describe, it, expect } from "vitest";
import { permissionManager } from "../../src/permission/manager.js";
import type { PermissionRequest } from "../../src/permission/types.js";

const MOCK_REQUEST: PermissionRequest = {
  id: "req-1",
  sessionID: "sess-1",
  permission: "bash",
  patterns: ["npm test", "npm run build"],
  metadata: {},
  always: [],
};

describe("PermissionManager", () => {
  // beforeEach is handled globally by setup.ts → resetSingletonState

  it("is not active by default", () => {
    expect(permissionManager.isActive()).toBe(false);
    expect(permissionManager.getRequest()).toBeNull();
    expect(permissionManager.getRequestID()).toBeNull();
    expect(permissionManager.getPermissionType()).toBeNull();
    expect(permissionManager.getPatterns()).toEqual([]);
    expect(permissionManager.getMessageId()).toBeNull();
  });

  it("startPermission activates the manager and stores request", () => {
    permissionManager.startPermission(MOCK_REQUEST);

    expect(permissionManager.isActive()).toBe(true);
    expect(permissionManager.getRequest()).toEqual(MOCK_REQUEST);
    expect(permissionManager.getRequestID()).toBe("req-1");
    expect(permissionManager.getPermissionType()).toBe("bash");
    expect(permissionManager.getPatterns()).toEqual(["npm test", "npm run build"]);
  });

  it("setMessageId stores Telegram message id", () => {
    permissionManager.startPermission(MOCK_REQUEST);
    permissionManager.setMessageId(999);
    expect(permissionManager.getMessageId()).toBe(999);
  });

  it("clear resets all state", () => {
    permissionManager.startPermission(MOCK_REQUEST);
    permissionManager.setMessageId(999);

    permissionManager.clear();

    expect(permissionManager.isActive()).toBe(false);
    expect(permissionManager.getRequest()).toBeNull();
    expect(permissionManager.getRequestID()).toBeNull();
    expect(permissionManager.getPermissionType()).toBeNull();
    expect(permissionManager.getPatterns()).toEqual([]);
    expect(permissionManager.getMessageId()).toBeNull();
  });

  it("starting a second request while active replaces the first", () => {
    permissionManager.startPermission(MOCK_REQUEST);

    const secondRequest: PermissionRequest = {
      id: "req-2",
      sessionID: "sess-1",
      permission: "edit",
      patterns: ["src/app.ts"],
      metadata: {},
      always: [],
    };

    permissionManager.startPermission(secondRequest);

    expect(permissionManager.getRequestID()).toBe("req-2");
    expect(permissionManager.getPermissionType()).toBe("edit");
    expect(permissionManager.isActive()).toBe(true);
  });

  it("getPatterns returns empty array when no request is active", () => {
    expect(permissionManager.getPatterns()).toEqual([]);
  });
});
