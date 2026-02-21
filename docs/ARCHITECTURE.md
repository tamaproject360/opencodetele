# Architecture — OpenCode Telegram Bot

This document describes the internal architecture of the bot: component responsibilities, data flows, and module dependencies.

---

## Table of Contents

1. [Overview](#overview)
2. [Component Map](#component-map)
3. [Layer Breakdown](#layer-breakdown)
   - [Entry Points](#entry-points)
   - [Bot Layer](#bot-layer)
   - [State Managers](#state-managers)
   - [OpenCode Client Layer](#opencode-client-layer)
   - [Summary Pipeline](#summary-pipeline)
   - [Process Manager](#process-manager)
   - [Session Cache](#session-cache)
   - [I18n Layer](#i18n-layer)
4. [Data Flows](#data-flows)
   - [User Message → OpenCode Prompt](#user-message--opencode-prompt)
   - [SSE Event → Telegram Message](#sse-event--telegram-message)
5. [Module Dependency Graph](#module-dependency-graph)
6. [Key Design Decisions](#key-design-decisions)

---

## Overview

The bot acts as a Telegram frontend for a locally-running OpenCode server. The user sends messages via Telegram; the bot forwards them as prompts to the OpenCode API and streams responses back as Telegram messages.

```
Telegram User
    │  (sends text)
    ▼
Telegram Bot (grammY)
    │  (calls REST API)
    ▼
OpenCode Server (http://localhost:4096)
    │  (streams SSE events)
    ▼
Event Listener → Summary Pipeline → Telegram User
```

The app is **single-user by design**: one allowed `TELEGRAM_ALLOWED_USER_ID` is enforced by auth middleware on every update.

---

## Component Map

```
src/
├── app/start-bot-app.ts        App bootstrap: creates bot, initializes all managers
├── cli.ts                      CLI entry point (installed as `opencode-telegram`)
├── index.ts                    Source-mode entry point
├── config.ts                   Environment variable loader
│
├── bot/
│   ├── index.ts                Bot factory, middleware stack, command/callback wiring
│   ├── event-wiring.ts         wireEvents(): registers SSE→Telegram callbacks
│   ├── callback-keys.ts        CB constants for all callback_query prefixes
│   ├── middleware/auth.ts      User authorization middleware
│   ├── commands/               Command handlers (/start, /status, /sessions, etc.)
│   ├── handlers/               Callback handlers (agent, model, variant, question, permission)
│   └── utils/keyboard.ts       Reply keyboard builder (createMainKeyboard)
│
├── opencode/
│   ├── client.ts               SDK wrapper, creates the opencode client singleton
│   └── events.ts               SSE subscription loop with reconnect logic
│
├── summary/
│   ├── aggregator.ts           Assembles streaming SSE parts into complete messages
│   └── formatter.ts            Formats messages/tools into Telegram-safe text
│
├── session/
│   ├── manager.ts              Thin facade: current session getters/setters
│   └── cache-manager.ts        Historical project discovery (SQLite + file scan + API)
│
├── settings/manager.ts         Persistent state (settings.json) with async write queue
├── project/manager.ts          Merges live API projects with cache for /projects list
├── process/manager.ts          Manages local `opencode serve` child process lifecycle
├── pinned/manager.ts           Manages the pinned status message in Telegram
├── keyboard/manager.ts         Manages the Reply Keyboard (bottom keyboard) state
├── question/manager.ts         Question poll state machine
├── permission/manager.ts       Permission request state machine
├── agent/manager.ts            Agent (coding mode) selection
├── model/manager.ts            AI model selection with three-tier fallback
├── variant/manager.ts          Model variant (thinking budget) selection
├── rename/manager.ts           Session rename flow state
│
├── runtime/
│   ├── mode.ts                 Detects installed vs. source-mode runtime
│   ├── paths.ts                Resolves config/data file paths by runtime mode
│   └── bootstrap.ts            First-run config wizard (CLI)
│
├── i18n/
│   ├── index.ts                t() translation function, normalizeLocale()
│   ├── en.ts                   English strings (canonical dictionary)
│   ├── ru.ts                   Russian translations
│   └── id.ts                   Indonesian translations
│
└── utils/
    ├── logger.ts               Level-based logger (debug/info/warn/error)
    ├── error-format.ts         Error message formatting helpers
    └── safe-background-task.ts Fire-and-forget wrapper with error logging
```

---

## Layer Breakdown

### Entry Points

**`src/app/start-bot-app.ts`** is the shared bootstrap called by both `index.ts` (source mode) and `cli.ts` (installed mode). It:

1. Loads settings from `settings.json`
2. Initializes `processManager` (checks if a previously-started `opencode serve` is still running)
3. Warms up the session directory cache (`warmupSessionDirectoryCache()`)
4. Creates the grammY bot via `createBot()`
5. Starts bot polling

### Bot Layer

**`src/bot/index.ts`** is the central hub. It creates the grammY `Bot` instance and configures the full middleware stack and all handlers. Key responsibilities:

- **Proxy setup**: Wraps the HTTP client with `SocksProxyAgent` / `HttpsProxyAgent` if `TELEGRAM_PROXY_URL` is set
- **Heartbeat**: `setInterval` every 5 seconds to confirm the event loop is not blocked
- **Middleware stack** (in order):
  1. API call logger (debug level)
  2. Update logger (debug level)
  3. `authMiddleware` — drops all updates from non-allowed users
  4. `ensureCommandsInitialized` — one-shot: sets commands scoped to the authorized chat on first message
- **Command handlers**: registered via `bot.command()` for all 12 commands
- **Callback dispatcher**: `bot.on("callback_query:data")` iterates handlers in order; each returns a boolean
- **Reply keyboard listeners**: `bot.hears()` patterns for agent/model/variant/context buttons
- **Core text handler**: the main prompt logic (see [Data Flows](#data-flows))

**`src/bot/event-wiring.ts`** — `wireEvents(bot, chatId, directory)` is called before every prompt to ensure SSE callbacks are registered. It:

1. Registers all callbacks on `summaryAggregator` (completion, tool, question, permission, thinking, tokens, compacted, diff, file change)
2. Starts the SSE subscription via `subscribeToEvents(directory, callback)`

**`src/bot/callback-keys.ts`** — the `CB` object holds all callback prefix constants (`CB.SESSION`, `CB.PROJECT`, `CB.AGENT`, `CB.MODEL`, etc.) to prevent typos and duplication.

### State Managers

All managers are singletons. Persistent state flows through `settings/manager.ts`; transient state is in-memory only.

| Manager                 | Persistent?         | Responsibility                                                     |
| ----------------------- | ------------------- | ------------------------------------------------------------------ |
| `settings/manager.ts`   | Yes (settings.json) | Single source of truth for all persistent state; async write queue |
| `session/manager.ts`    | Via settings        | Current session getters/setters (thin facade)                      |
| `project/manager.ts`    | Via cache           | Merges live API + cache for project list                           |
| `keyboard/manager.ts`   | No                  | Reply Keyboard state; debounced send (2s)                          |
| `pinned/manager.ts`     | Pinned msg ID       | Pinned status message; debounced file changes (500ms)              |
| `question/manager.ts`   | No                  | Question poll state machine                                        |
| `permission/manager.ts` | No                  | Single active permission request                                   |
| `agent/manager.ts`      | Via settings        | Current agent; API fetch with settings fallback                    |
| `model/manager.ts`      | Via settings        | Current model; three-tier fallback (settings → env → empty)        |
| `variant/manager.ts`    | Via settings        | Model variant (thinking budget)                                    |
| `rename/manager.ts`     | No                  | Rename flow state                                                  |
| `process/manager.ts`    | PID via settings    | Child process lifecycle                                            |

### OpenCode Client Layer

**`src/opencode/client.ts`** — a thin wrapper around `@opencode-ai/sdk` that creates and exports the `opencodeClient` singleton. Adds Basic Auth headers if `OPENCODE_SERVER_USERNAME` / `OPENCODE_SERVER_PASSWORD` are configured.

**`src/opencode/events.ts`** — manages a single global SSE subscription. Key behaviors:

- **Module-level state**: `eventStream`, `eventCallback`, `isListening`, `activeDirectory`, `streamAbortController`
- **Reconnect with exponential backoff**: base 1s, max 15s (`min(1000 * 2^(attempt-1), 15000)`)
- **Event loop yielding**: `await new Promise(resolve => setImmediate(resolve))` before every event, plus `setImmediate(() => callback(event))` after — ensures grammY can process `getUpdates` between events
- **Directory switch**: if `subscribeToEvents()` is called for a different directory, the old stream is aborted and a new one started

### Summary Pipeline

**`src/summary/aggregator.ts`** — the core event processing engine. It receives raw SSE events, assembles streamed text parts into complete messages, and fires typed callbacks.

Internal deduplication mechanisms:

- `partHashes` — `Map<messageId, Set<string>>` prevents duplicate streaming text parts
- `pendingParts` — buffers text parts that arrive before the message role is known
- `processedToolStates` — `Set<"notified-{callId}" | "file-{callId}">` prevents double-sending tools

Callbacks (set via `setOn*` methods):

| Callback             | Fired When                                              |
| -------------------- | ------------------------------------------------------- |
| `onComplete`         | Assistant message completed (`time.completed` set)      |
| `onTool`             | Tool call completed (once per call ID)                  |
| `onToolFile`         | `write`/`edit` tool completed with file content         |
| `onQuestion`         | `question.asked` SSE event                              |
| `onQuestionError`    | Question tool part reached `status="error"`             |
| `onThinking`         | First `message.updated` for a new assistant message     |
| `onTokens`           | Called synchronously before `onComplete` (token counts) |
| `onPermission`       | `permission.asked` SSE event                            |
| `onSessionCompacted` | `session.compacted` SSE event                           |
| `onSessionDiff`      | `session.diff` SSE event                                |
| `onFileChange`       | Per-file change from write/edit tool                    |

**`src/summary/formatter.ts`** — formats aggregated data into Telegram-safe Markdown strings. Key functions: `formatSummary()` (splits messages at 4096 chars on newline boundaries), `formatToolInfo()`, `getToolIcon()`, `prepareCodeFile()`.

### Process Manager

**`src/process/manager.ts`** — manages the local `opencode serve` child process.

- **Start**: `spawn("cmd.exe", ["/c", "opencode", "serve"])` on Windows; `spawn("opencode", ["serve"])` on Unix. Persists PID + startTime to settings.
- **Stop** (Windows): `taskkill /F /T /PID {pid}` to kill the entire process tree.
- **Stop** (Unix): `SIGINT` → wait up to 5s → `SIGKILL`.
- **Recovery**: on app restart, reads PID from settings and checks liveness via `process.kill(pid, 0)`.

### Session Cache

**`src/session/cache-manager.ts`** — maintains a local cache of up to 10 project directories inferred from session history. This is needed because `opencodeClient.project.list()` only returns currently-open projects, not historical ones.

Three warmup strategies (run in order at startup):

1. **API sync** (`syncSessionDirectoryCache`): `session.list()` with `updatedAt` watermark for incremental updates; 60-second cooldown.
2. **SQLite fallback** (`ingestFromSqliteSessionDatabase`): reads OpenCode's own `opencode.db` via `better-sqlite3`.
3. **File scan fallback** (`ingestFromGlobalSessionStorage`): scans `~/.local/share/opencode/storage/session/global/*.json`.

Cache is persisted in `settings.json` under `sessionDirectoryCache`.

### I18n Layer

**`src/i18n/`** — a simple dictionary-based translation system.

- `en.ts` is the canonical dictionary; its type defines all valid `I18nKey` values.
- `ru.ts` and `id.ts` must implement all keys (enforced by `I18nDictionary = Record<I18nKey, string>`).
- `t(key, params?, locale?)`: looks up key → falls back to `en` → falls back to raw key → interpolates `{placeholder}` patterns.
- `normalizeLocale(locale)`: strips BCP-47 subtags (`"ru-RU"` → `"ru"`), returns `"en" | "ru" | "id"`.
- Locale resolution order: `setRuntimeLocale()` override → `BOT_LOCALE` env var → `"en"`.

---

## Data Flows

### User Message → OpenCode Prompt

```
User types message in Telegram
    │
    ▼
grammY long-polling (bot.start())
    │
    ▼
Middleware stack:
  1. API call logger (debug)
  2. Update logger (debug)
  3. authMiddleware → drops if not allowedUserId
  4. ensureCommandsInitialized → one-shot setMyCommands
    │
    ▼ bot.hears() for keyboard button text patterns
  └─ If matches agent/model/variant/context button: handle, stop
    │
    ▼ bot.on("message:text") main handler
  ├─ If starts with "/": return (handled by bot.command routes)
  ├─ If questionManager.isActive(): handleQuestionTextAnswer → question.reply() API
  ├─ If renameManager.isWaitingForName(): handleRenameTextAnswer → session.update() API
  ├─ No current project: reply "select a project first"
  │
  ├─ Session mismatch (session.directory ≠ project.worktree):
  │    └─ resetMismatchedSessionContext() → clear all state
  │
  ├─ No current session:
  │    └─ opencodeClient.session.create({ directory })
  │    └─ pinnedMessageManager.onSessionChange()
  │
  ├─ ensureEventSubscription(directory)
  │    └─ wireEvents(bot, chatId, directory) — registers all callbacks
  │    └─ subscribeToEvents(directory, callback) — starts SSE loop
  │
  ├─ summaryAggregator.setSession(sessionId)
  │
  ├─ isSessionBusy() → opencodeClient.session.status() → reply if busy
  │
  └─ safeBackgroundTask("session.prompt",
         opencodeClient.session.prompt({
           sessionID, directory,
           parts: [{ type: "text", text: userMessage }],
           agent, model, variant
         })
     )
     ── FIRE AND FORGET: handler returns immediately ──
```

The prompt call is fire-and-forget so grammY continues processing `getUpdates` while OpenCode works.

### SSE Event → Telegram Message

```
OpenCode Server streams SSE events
    │
    ▼
src/opencode/events.ts — subscribeToEvents() loop
  ├─ await setImmediate() before each event (yields to grammY)
  └─ setImmediate(() => eventCallback(event)) after each event
    │
    ▼
wireEvents callback (src/bot/event-wiring.ts)
  ├─ session.created / session.updated → ingestSessionInfoForCache (background)
  └─ summaryAggregator.processEvent(event)
    │
    ▼ (by event type)
  ┌─ message.updated (role=assistant, no time.completed)
  │    ├─ Start typing indicator (sendChatAction every 4s)
  │    └─ onThinking → bot.api.sendMessage("💭 Thinking...")
  │
  ├─ message.part.updated (type=text)
  │    └─ Hash-dedup → append to currentMessageParts[messageId]
  │
  ├─ message.part.updated (type=tool, status=completed)
  │    ├─ onTool → formatToolInfo() → bot.api.sendMessage (one line)
  │    └─ For write/edit: onToolFile → write temp file → sendDocument → delete temp
  │                        onFileChange → pinnedMessageManager.addFileChange()
  │
  ├─ message.updated (role=assistant, time.completed set)
  │    ├─ onTokens (synchronous) → keyboardManager.updateContext()
  │    │                        → pinnedMessageManager.onMessageComplete()
  │    │                            → edit pinned message
  │    │                            → trigger keyboard update (debounced 2s)
  │    ├─ onComplete → formatSummary() → bot.api.sendMessage (with Reply Keyboard)
  │    └─ Stop typing indicator
  │
  ├─ session.idle → stop typing indicator
  ├─ session.compacted → pinnedMessageManager.onSessionCompacted()
  ├─ session.diff → pinnedMessageManager.onSessionDiff() (debounced 500ms)
  ├─ question.asked → questionManager.startQuestions() + showCurrentQuestion()
  └─ permission.asked → showPermissionRequest()
```

---

## Module Dependency Graph

```
src/app/start-bot-app.ts
  ├─ src/bot/index.ts
  │    ├─ src/bot/event-wiring.ts
  │    │    ├─ src/opencode/events.ts
  │    │    ├─ src/summary/aggregator.ts
  │    │    ├─ src/summary/formatter.ts
  │    │    ├─ src/question/manager.ts
  │    │    ├─ src/permission/manager.ts
  │    │    ├─ src/keyboard/manager.ts
  │    │    └─ src/pinned/manager.ts
  │    ├─ src/opencode/client.ts
  │    ├─ src/session/manager.ts     → src/settings/manager.ts
  │    ├─ src/session/cache-manager.ts
  │    ├─ src/project/manager.ts     → cache-manager + client
  │    ├─ src/agent/manager.ts       → settings + client
  │    ├─ src/model/manager.ts       → settings + client
  │    ├─ src/variant/manager.ts     → settings + client
  │    ├─ src/rename/manager.ts
  │    └─ src/i18n/index.ts
  ├─ src/process/manager.ts          → settings + client
  └─ src/session/cache-manager.ts    → settings + client
```

All managers ultimately depend on `src/settings/manager.ts` for persistence and `src/opencode/client.ts` for API calls. Neither of these two modules imports any other project module, keeping them at the bottom of the dependency tree.

---

## Key Design Decisions

### Fire-and-forget prompts

`opencodeClient.session.prompt()` is intentionally not awaited. The handler returns immediately so grammY's polling loop can continue receiving updates (button presses, `/stop`, etc.) while OpenCode processes the task. Responses arrive via SSE.

### Event loop yielding in SSE loop

Before and after processing each SSE event, `setImmediate()` yields to the Node.js event loop. This prevents the SSE stream from starving grammY's `getUpdates` processing under high event throughput.

### Synchronous `onTokens` callback

The `onTokens` callback is the one exception to the `setImmediate` pattern — it fires synchronously before `onComplete`. This ensures the keyboard context (token usage) is updated before the completion message is sent, so the Reply Keyboard always shows current values.

### Single-user, single-process

The app manages one active session, one active project, and one SSE subscription at a time. Multi-user support would require per-user state isolation across all managers.

### SQLite + file-scan session cache

`opencodeClient.project.list()` only returns projects currently open in OpenCode. To show historical projects, the bot maintains its own directory cache populated from three sources in priority order: API incremental sync → OpenCode's own SQLite DB → JSON file scan.

### Persistent state in settings.json

All persistent state (current project, session, model, agent, pinned message ID, server PID) is stored in a single `settings.json` file via a serialized async write queue. This avoids concurrent write corruption while keeping the implementation simple.
