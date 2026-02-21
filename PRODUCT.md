# OpenCode Telegram Bridge

Telegram bot client for OpenCode that lets you run and monitor coding tasks on your local machine from Telegram.

## Concept

The app works as a bridge between Telegram and a locally running OpenCode server:

- You send prompts from Telegram
- The bot forwards them to OpenCode
- The app listens to OpenCode SSE events
- Results are aggregated and sent back in Telegram-friendly format

No public inbound ports are required for normal usage.

## Architecture Snapshot

The product is organized into clear layers and managers:

- **Bot Layer** (`src/bot/*`): grammY commands, callback handlers, keyboard interactions
- **OpenCode Client Layer** (`src/opencode/*`): SDK wrapper + SSE event subscription
- **State Managers** (`src/*/manager.ts`): session/project/model/agent/variant/permission/question/pinned/keyboard/process/settings
- **Summary Pipeline** (`src/summary/*`): event aggregation and Telegram-safe formatting
- **Health Monitor** (`src/health/monitor.ts`): periodic server checks and outage/recovery alerts
- **I18n Layer** (`src/i18n/*`): EN/RU/ID dictionaries with runtime language selection

Detailed architecture is documented in `docs/ARCHITECTURE.md`.

## Target Usage Scenario

1. The user works on a project locally with OpenCode (Desktop/TUI).
2. They finish the local session and leave the computer.
3. Later, while away, they run this bridge service and connect via Telegram.
4. They choose an existing session or create a new one.
5. They send coding tasks and receive periodic progress updates.
6. They receive completed assistant responses in chat and continue the workflow asynchronously.

## Functional Requirements

### OpenCode server management

- Check OpenCode server status (running / not running)
- Start OpenCode server from the app (`opencode serve`)
- Stop OpenCode server from the app

### Project management

- Fetch available projects from OpenCode API (name + path)
- Select and switch projects
- Persist selected project between restarts (`settings.json`)

### Session management

- Fetch last N sessions (name + date)
- Select and attach to an existing session
- Create a new session
- Use OpenCode-generated session title (based on conversation)

### Task handling

- Send text prompts to OpenCode
- Interrupt current task (ESC equivalent)
- Handle OpenCode questions with inline options and custom text answers
- Send selected/custom answers back to OpenCode (`question.reply`)
- Handle permission requests interactively (`allow once` / `always` / `reject`)

### Result delivery

- Send each completed assistant response after completion signal from SSE
- Do not expose raw chain-of-thought; send a lightweight thinking indicator instead
- Split long responses into multiple Telegram messages
- Send code updates as files (size-limited)

### Session status in chat

- Keep a pinned status message in the chat
- Show session title, project, model, context usage, and changed files
- Auto-update status from SSE and tool events
- Preserve pinned message ID across bot restarts

### Security

- Whitelist by Telegram user ID (single-user mode)
- Ignore messages from non-authorized users

### Configuration

- Telegram bot token
- Allowed Telegram user ID
- Default model provider and model ID
- Selected project persisted in `settings.json`
- Configurable sessions list size (default: 10)
- Configurable bot locale
- Configurable max code file size in KB (default: 100)

## Current Product Scope

### Bot commands

Current command set:

- [x] `/status` - server, project, and session status
- [x] `/new` - create a new session
- [x] `/stop` - stop the current task
- [x] `/sessions` - show and switch recent sessions
- [x] `/projects` - show and switch projects
- [x] `/newproject` - open a custom directory as current project
- [x] `/ls` - list files in the current project
- [x] `/tree` - show project directory tree
- [x] `/model` - select model
- [x] `/agent` - select agent mode
- [x] `/language` - switch bot language at runtime
- [x] `/rename` - rename current session
- [x] `/opencode_start` - start local OpenCode server
- [x] `/opencode_stop` - stop local OpenCode server
- [x] `/help` - show command help

Text messages (non-commands) are treated as prompts for OpenCode, except when an active question expects a custom text answer.

### Main features already implemented

- [x] OpenCode server control and health checks via bot commands
- [x] Project management (list/switch) with inline menus
- [x] Session management (list/switch/create) with inline menus
- [x] Prompt execution through OpenCode with SSE-based event handling
- [x] Interactive question and permission flows (buttons + custom text answers)
- [x] Pinned status updates (session, project, model, context usage, changed files)
- [x] Model and agent selection from Telegram
- [x] Context/variant controls from Telegram keyboard
- [x] Sending code blocks as files when needed
- [x] Receiving files/photos from Telegram and attaching them to next prompt
- [x] Single-user security model (allowed Telegram user ID)
- [x] Persistent bot settings (`settings.json`) between restarts
- [x] EN/RU/ID localization with runtime language switching
- [x] Health monitor with outage and recovery alerts in Telegram

## Current Task List

Open tasks for upcoming iterations:

- [ ] Display plugins in bot status/details
- [ ] Configure visibility level for thinking and intermediate steps
- [ ] Add optional auto-restart policy for OpenCode server after repeated health-check failures
- [ ] Improve Telegram-compatible message formatting for richer outputs
- [ ] Provide a Docker image and basic container deployment guide

## Possible Improvements

Optional or longer-term enhancements:

- [ ] Create new OpenCode projects directly from Telegram
- [ ] Add richer project file browsing helpers (for example, `open` or preview flows)
- [ ] Improve support for git worktree-based workflows
