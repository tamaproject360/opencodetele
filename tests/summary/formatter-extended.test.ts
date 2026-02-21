import { describe, it, expect, vi } from "vitest";

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

import { formatSummary, formatToolInfo, prepareCodeFile } from "../../src/summary/formatter.js";

describe("formatSummary — edge cases (#21)", () => {
  it("returns [] for empty string", () => {
    expect(formatSummary("")).toEqual([]);
  });

  it("returns [] for whitespace-only string", () => {
    expect(formatSummary("   \n\t  ")).toEqual([]);
  });

  it("returns single part without code fence for text under limit", () => {
    const parts = formatSummary("Hello, world!");
    expect(parts).toEqual(["Hello, world!"]);
  });

  it("returns single trimmed part (no fence) for text exactly at limit", () => {
    const text = "a".repeat(4096);
    const parts = formatSummary(text);
    expect(parts).toHaveLength(1);
    expect(parts[0]).not.toMatch(/^```/); // no fence for single part
  });

  it("splits text longer than 4096 chars into multiple fenced parts", () => {
    const text = "a".repeat(4500);
    const parts = formatSummary(text);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(part.startsWith("```\n")).toBe(true);
      expect(part.endsWith("\n```")).toBe(true);
    }
  });

  it("prefers splitting on newline boundary when possible", () => {
    // Build text that forces a split, with newline at known position
    const line = "x".repeat(100) + "\n";
    const repetitions = Math.ceil(4100 / line.length);
    const text = line.repeat(repetitions);

    const parts = formatSummary(text);
    expect(parts.length).toBeGreaterThan(1);
    // Each fenced part should be trimmed
    for (const part of parts) {
      const inner = part.slice(4, -4); // strip "```\n" and "\n```"
      expect(inner.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("formatToolInfo — helpers (#20)", () => {
  it("getToolIcon — known tools return correct emoji", () => {
    const cases: Array<[string, string]> = [
      ["read", "📖"],
      ["write", "✍️"],
      ["edit", "✏️"],
      ["bash", "💻"],
      ["glob", "📁"],
      ["grep", "🔍"],
      ["task", "🤖"],
      ["question", "❓"],
      ["todoread", "📋"],
      ["todowrite", "📝"],
      ["webfetch", "🌐"],
      ["skill", "🎓"],
    ];

    for (const [tool, expected] of cases) {
      const result = formatToolInfo({
        messageId: "m1",
        callId: "c1",
        tool,
        state: { status: "completed" } as never,
      });
      expect(result).toContain(expected);
    }
  });

  it("getToolIcon — unknown tool returns 🛠️", () => {
    const result = formatToolInfo({
      messageId: "m1",
      callId: "c1",
      tool: "some_mcp_tool",
      state: { status: "completed" } as never,
    });
    expect(result).toContain("🛠️");
  });

  it("getToolDetails — read uses filePath or path field", () => {
    const withFilePath = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "read",
      state: { status: "completed" } as never,
      input: { filePath: "src/main.ts" },
    });
    expect(withFilePath).toContain("src/main.ts");

    const withPath = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "read",
      state: { status: "completed" } as never,
      input: { path: "src/utils.ts" },
    });
    expect(withPath).toContain("src/utils.ts");
  });

  it("getToolDetails — bash uses command field", () => {
    const result = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "bash",
      state: { status: "completed" } as never,
      input: { command: "git status" },
    });
    expect(result).toContain("git status");
  });

  it("getToolDetails — grep/glob uses pattern field", () => {
    const grep = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "grep",
      state: { status: "completed" } as never,
      input: { pattern: "TODO" },
    });
    expect(grep).toContain("TODO");
  });

  it("getToolDetails — generic tool uses query/url/name field", () => {
    const result = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "some_mcp_tool",
      state: { status: "completed" } as never,
      input: { query: "latest news" },
    });
    expect(result).toContain("latest news");
  });

  it("formatTodos — overflow message appears when > 20 todos", () => {
    const todos = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      content: `Task ${i}`,
      status: "pending",
    }));

    const result = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "todowrite",
      state: { status: "completed" } as never,
      metadata: { todos },
    });

    expect(result).toContain("📝 todowrite (25)");
    // Only 20 shown, 5 in overflow
    const lines = result!.split("\n");
    // 1 header + 20 todos + 1 overflow line = 22
    expect(lines.length).toBe(22);
  });

  it("description field is included as separate line before tool name", () => {
    const result = formatToolInfo({
      messageId: "m",
      callId: "c",
      tool: "bash",
      state: { status: "completed" } as never,
      input: { description: "Run linter", command: "npm run lint" },
    });
    expect(result).toContain("Run linter\n");
    expect(result).toContain("npm run lint");
  });
});

describe("prepareCodeFile (#20)", () => {
  it("returns null for oversized content", () => {
    const big = "a".repeat(101 * 1024);
    expect(prepareCodeFile(big, "large.ts", "write")).toBeNull();
  });

  it("write operation produces correct filename and header", () => {
    const file = prepareCodeFile("const x = 1;", "src/foo.ts", "write");
    expect(file).not.toBeNull();
    expect(file!.filename).toBe("write_foo.ts.txt");
    expect(file!.buffer.toString()).toContain("Write File/Path: src/foo.ts");
  });

  it("edit operation strips diff metadata lines", () => {
    const diff = [
      "@@ -1,3 +1,3 @@",
      "--- a/file.ts",
      "+++ b/file.ts",
      " unchanged line",
      "-removed line",
      "+added line",
      "\\ No newline at end of file",
    ].join("\n");

    const file = prepareCodeFile(diff, "file.ts", "edit");
    expect(file).not.toBeNull();
    const content = file!.buffer.toString();
    expect(content).not.toContain("@@");
    expect(content).not.toContain("--- a/");
    expect(content).toContain("- removed line");
    expect(content).toContain("+ added line");
    expect(content).toContain(" unchanged line");
  });
});
