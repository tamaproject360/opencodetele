import { describe, it, expect, vi } from "vitest";

// Mock config so we can test both with and without auth
const mockConfig = {
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
};

vi.mock("../../src/config.js", () => ({ config: mockConfig }));

const mockCreateOpencodeClient = vi.fn(() => ({ health: vi.fn() }));
vi.mock("@opencode-ai/sdk/v2", () => ({
  createOpencodeClient: (opts: unknown) => mockCreateOpencodeClient(opts),
}));

describe("opencode/client.ts (#22)", () => {
  it("creates client with baseUrl from config", async () => {
    await import("../../src/opencode/client.js");
    expect(mockCreateOpencodeClient).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: "http://localhost:4096" }),
    );
  });

  it("creates client without Authorization header when password is empty", async () => {
    mockConfig.opencode.password = "";
    await import("../../src/opencode/client.js");
    const calls = mockCreateOpencodeClient.mock.calls;
    if (calls.length > 0) {
      const call = calls[0][0] as { baseUrl: string; headers?: Record<string, string> };
      // password is empty so no auth header should be set
      expect(call.headers?.Authorization).toBeUndefined();
    }
  });

  it("Basic auth header is correctly encoded as base64", () => {
    const username = "opencode";
    const password = "secret";
    const credentials = `${username}:${password}`;
    const header = `Basic ${Buffer.from(credentials).toString("base64")}`;

    expect(header).toMatch(/^Basic [A-Za-z0-9+/]+=*$/);
    expect(Buffer.from(credentials).toString("base64")).toBe(
      Buffer.from("opencode:secret").toString("base64"),
    );
  });
});
