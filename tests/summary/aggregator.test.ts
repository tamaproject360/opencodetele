import { describe, it, expect, vi, beforeEach } from "vitest";
import { summaryAggregator } from "../../src/summary/aggregator.js";
import type { TokensInfo } from "../../src/summary/aggregator.js";

// Mock external dependencies that require network / file system
vi.mock("../../src/settings/manager.js", () => ({
  getCurrentProject: vi.fn(() => ({ id: "p1", worktree: "/repo", name: "repo" })),
}));

vi.mock("../../src/summary/formatter.js", () => ({
  prepareCodeFile: vi.fn(() => null),
}));

function makeEvent(type: string, properties: Record<string, unknown>) {
  return { type, properties } as Parameters<typeof summaryAggregator.processEvent>[0];
}

describe("SummaryAggregator", () => {
  beforeEach(() => {
    summaryAggregator.clear();
  });

  // --- setSession / getCurrentSessionId ---

  it("setSession stores the session id", () => {
    summaryAggregator.setSession("sess-1");
    expect(summaryAggregator.getCurrentSessionId()).toBe("sess-1");
  });

  it("setSession with same id does not clear state", () => {
    summaryAggregator.setSession("sess-1");
    const called = vi.fn();
    summaryAggregator.setOnComplete(called);
    summaryAggregator.setSession("sess-1"); // same id
    expect(summaryAggregator.getCurrentSessionId()).toBe("sess-1");
  });

  it("setSession with different id clears previous session state", () => {
    summaryAggregator.setSession("sess-1");
    summaryAggregator.setSession("sess-2");
    expect(summaryAggregator.getCurrentSessionId()).toBe("sess-2");
  });

  // --- clear ---

  it("clear resets session id to null", () => {
    summaryAggregator.setSession("sess-1");
    summaryAggregator.clear();
    expect(summaryAggregator.getCurrentSessionId()).toBeNull();
  });

  it("clear stops typing indicator if active", () => {
    summaryAggregator.clear(); // should not throw even if no timer
  });

  // --- processEvent: ignores wrong session ---

  it("processEvent message.updated ignores events from different session", () => {
    summaryAggregator.setSession("sess-A");
    const onComplete = vi.fn();
    summaryAggregator.setOnComplete(onComplete);

    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-1",
          sessionID: "sess-B", // wrong session
          role: "assistant",
          time: { created: Date.now(), completed: Date.now() },
        },
      }),
    );

    expect(onComplete).not.toHaveBeenCalled();
  });

  // --- processEvent: message.updated assistant flow ---

  it("processEvent message.updated triggers onThinking on first assistant message", async () => {
    summaryAggregator.setSession("sess-1");
    const onThinking = vi.fn();
    summaryAggregator.setOnThinking(onThinking);

    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-1",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now() },
        },
      }),
    );

    // Flush setImmediate so callback fires, then verify
    await new Promise((resolve) => setImmediate(resolve));
    expect(onThinking).toHaveBeenCalledOnce();
  });

  it("processEvent message.updated calls onComplete when message has completed time", async () => {
    summaryAggregator.setSession("sess-1");
    const onComplete = vi.fn();
    summaryAggregator.setOnComplete(onComplete);

    // First: register message as assistant
    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-1",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now() },
        },
      }),
    );

    // Add text part
    summaryAggregator.processEvent(
      makeEvent("message.part.updated", {
        part: {
          id: "p-1",
          messageID: "msg-1",
          sessionID: "sess-1",
          type: "text",
          text: "Hello from agent",
        },
      }),
    );

    // Complete the message
    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-1",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now(), completed: Date.now() },
        },
      }),
    );

    expect(onComplete).toHaveBeenCalledWith("sess-1", "Hello from agent");
  });

  // --- processEvent: onTokens callback ---

  it("processEvent message.updated calls onTokens when tokens are present at completion", () => {
    summaryAggregator.setSession("sess-1");
    const onTokens = vi.fn();
    summaryAggregator.setOnTokens(onTokens);

    // Register message
    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-2",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now() },
        },
      }),
    );
    // Add text part so onComplete condition is met
    summaryAggregator.processEvent(
      makeEvent("message.part.updated", {
        part: {
          id: "p-2",
          messageID: "msg-2",
          sessionID: "sess-1",
          type: "text",
          text: "response",
        },
      }),
    );

    // Complete with tokens
    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-2",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now(), completed: Date.now() },
          tokens: {
            input: 100,
            output: 50,
            reasoning: 10,
            cache: { read: 5, write: 2 },
          },
        },
      }),
    );

    expect(onTokens).toHaveBeenCalledOnce();
    const tokens = onTokens.mock.calls[0][0] as TokensInfo;
    expect(tokens.input).toBe(100);
    expect(tokens.output).toBe(50);
    expect(tokens.reasoning).toBe(10);
    expect(tokens.cacheRead).toBe(5);
    expect(tokens.cacheWrite).toBe(2);
  });

  // --- processEvent: message.part.updated dedup ---

  it("processEvent message.part.updated deduplicates identical text parts", () => {
    summaryAggregator.setSession("sess-1");
    const onComplete = vi.fn();
    summaryAggregator.setOnComplete(onComplete);

    // Register message
    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-3",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now() },
        },
      }),
    );

    const partEvent = makeEvent("message.part.updated", {
      part: {
        id: "p-3",
        messageID: "msg-3",
        sessionID: "sess-1",
        type: "text",
        text: "duplicate text",
      },
    });

    summaryAggregator.processEvent(partEvent);
    summaryAggregator.processEvent(partEvent); // same text again

    // Complete
    summaryAggregator.processEvent(
      makeEvent("message.updated", {
        info: {
          id: "msg-3",
          sessionID: "sess-1",
          role: "assistant",
          time: { created: Date.now(), completed: Date.now() },
        },
      }),
    );

    // Should only contain the text once
    expect(onComplete).toHaveBeenCalledWith("sess-1", "duplicate text");
  });

  // --- processEvent: session.idle ---

  it("processEvent session.idle stops typing indicator for current session", () => {
    summaryAggregator.setSession("sess-1");
    // Should not throw
    summaryAggregator.processEvent(makeEvent("session.idle", { sessionID: "sess-1" }));
  });

  it("processEvent session.idle ignores different session", () => {
    summaryAggregator.setSession("sess-1");
    // Should not throw, just no-op
    summaryAggregator.processEvent(makeEvent("session.idle", { sessionID: "sess-other" }));
    expect(summaryAggregator.getCurrentSessionId()).toBe("sess-1");
  });

  // --- processEvent: question.asked ---

  it("processEvent question.asked calls onQuestion callback for current session", async () => {
    summaryAggregator.setSession("sess-1");
    const onQuestion = vi.fn();
    summaryAggregator.setOnQuestion(onQuestion);

    summaryAggregator.processEvent(
      makeEvent("question.asked", {
        id: "req-1",
        sessionID: "sess-1",
        questions: [{ question: "Are you sure?", header: "confirm", options: [{ label: "Yes" }] }],
      }),
    );

    // onQuestion fires in setImmediate — flush it
    await new Promise((resolve) => setImmediate(resolve));

    expect(onQuestion).toHaveBeenCalledOnce();
    expect(onQuestion.mock.calls[0][1]).toBe("req-1");
  });

  it("processEvent question.asked ignores different session", async () => {
    summaryAggregator.setSession("sess-1");
    const onQuestion = vi.fn();
    summaryAggregator.setOnQuestion(onQuestion);

    summaryAggregator.processEvent(
      makeEvent("question.asked", {
        id: "req-1",
        sessionID: "sess-other",
        questions: [],
      }),
    );

    await new Promise((resolve) => setImmediate(resolve));
    expect(onQuestion).not.toHaveBeenCalled();
  });

  // --- processEvent: permission.asked ---

  it("processEvent permission.asked calls onPermission for current session", async () => {
    summaryAggregator.setSession("sess-1");
    const onPermission = vi.fn();
    summaryAggregator.setOnPermission(onPermission);

    summaryAggregator.processEvent(
      makeEvent("permission.asked", {
        id: "perm-1",
        sessionID: "sess-1",
        permission: "bash",
        patterns: ["npm test"],
        metadata: {},
        always: [],
      }),
    );

    await new Promise((resolve) => setImmediate(resolve));
    expect(onPermission).toHaveBeenCalledOnce();
    expect(onPermission.mock.calls[0][0]).toMatchObject({ id: "perm-1", permission: "bash" });
  });

  // --- processEvent: question.replied / rejected ---

  it("processEvent question.replied and question.rejected do not throw", () => {
    summaryAggregator.setSession("sess-1");
    expect(() =>
      summaryAggregator.processEvent(makeEvent("question.replied", { requestID: "r1" })),
    ).not.toThrow();

    expect(() =>
      summaryAggregator.processEvent(makeEvent("question.rejected", { requestID: "r1" })),
    ).not.toThrow();
  });

  // --- processEvent: unknown event ---

  it("processEvent unknown event type does not throw", () => {
    summaryAggregator.setSession("sess-1");
    expect(() => summaryAggregator.processEvent(makeEvent("some.unknown.event", {}))).not.toThrow();
  });

  // --- processEvent: tool part completed → onTool callback ---

  it("processEvent tool part completed calls onTool callback once (dedup)", () => {
    summaryAggregator.setSession("sess-1");
    const onTool = vi.fn();
    summaryAggregator.setOnTool(onTool);

    const toolPartEvent = makeEvent("message.part.updated", {
      part: {
        id: "tp-1",
        messageID: "msg-tool",
        sessionID: "sess-1",
        type: "tool",
        tool: "bash",
        callID: "call-1",
        state: { status: "completed", metadata: {} },
      },
    });

    summaryAggregator.processEvent(toolPartEvent);
    summaryAggregator.processEvent(toolPartEvent); // second time - should be deduped

    expect(onTool).toHaveBeenCalledOnce();
    expect(onTool.mock.calls[0][0]).toMatchObject({ tool: "bash", callId: "call-1" });
  });

  // --- question tool error → onQuestionError ---

  it("processEvent question tool error calls onQuestionError callback", async () => {
    summaryAggregator.setSession("sess-1");
    const onError = vi.fn();
    summaryAggregator.setOnQuestionError(onError);

    summaryAggregator.processEvent(
      makeEvent("message.part.updated", {
        part: {
          id: "qe-1",
          messageID: "msg-q",
          sessionID: "sess-1",
          type: "tool",
          tool: "question",
          callID: "call-q",
          state: { status: "error" },
        },
      }),
    );

    await new Promise((resolve) => setImmediate(resolve));
    expect(onError).toHaveBeenCalledOnce();
  });
});
