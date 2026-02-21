interface ProcessManagerPrivateState {
  state: {
    process: null;
    pid: null;
    startTime: null;
    isRunning: boolean;
  };
}

export async function resetSingletonState(): Promise<void> {
  const [
    { questionManager },
    { permissionManager },
    { summaryAggregator },
    { keyboardManager },
    { pinnedMessageManager },
    { processManager },
    { stopEventListening },
    { __resetSessionDirectoryCacheForTests },
  ] = await Promise.all([
    import("../../src/question/manager.js"),
    import("../../src/permission/manager.js"),
    import("../../src/summary/aggregator.js"),
    import("../../src/keyboard/manager.js"),
    import("../../src/pinned/manager.js"),
    import("../../src/process/manager.js"),
    import("../../src/opencode/events.js"),
    import("../../src/session/cache-manager.js"),
  ]);

  stopEventListening();

  // Use official reset methods
  questionManager.__resetForTests();
  permissionManager.__resetForTests();
  summaryAggregator.__resetForTests();
  keyboardManager.__resetForTests();
  pinnedMessageManager.__resetForTests();

  // ProcessManager does not have a public reset method yet — use casting
  const process = processManager as unknown as ProcessManagerPrivateState;
  process.state = {
    process: null,
    pid: null,
    startTime: null,
    isRunning: false,
  };

  __resetSessionDirectoryCacheForTests();
}
