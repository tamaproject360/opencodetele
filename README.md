# OpenCode Telegram Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

English | [Bahasa Indonesia](README.id.md)

Control your local [OpenCode](https://opencode.ai) coding workflows from Telegram. Send prompts, switch sessions/projects/models, answer interactive questions, and monitor progress from your phone.

This bot is designed for single-user, local-first operation:

- No inbound public ports required
- OpenCode API stays local by default (`127.0.0.1`)
- Telegram access is restricted by a strict allowed user ID

<p align="center">
  <img src="assets/Screenshot-1.png" width="32%" alt="Sending a coding task and receiving file edit results" />
  <img src="assets/Screenshot-2.png" width="32%" alt="Live session status with context usage and changed files" />
  <img src="assets/Screenshot-3.png" width="32%" alt="Switching between models from chat" />
</p>

## Current Status

Core functionality is stable and actively used.

- [x] OpenCode server control (`/status`, `/opencode_start`, `/opencode_stop`)
- [x] Project/session management from Telegram
- [x] Prompt execution with SSE event streaming
- [x] Interactive question + permission handling (buttons and text answers)
- [x] Pinned live status (project, model, context, changed files)
- [x] Model/agent/variant controls
- [x] File upload from Telegram as prompt context
- [x] Localization (`en`, `ru`, `id`) with runtime switch (`/language`)

Planned improvements are tracked in `PRODUCT.md`.

## Key Features

- Remote prompting: send normal chat messages as coding prompts
- Session continuity: continue old sessions or create new ones
- Project tools: list projects, open custom directory, list files, tree view
- Inline interactions: resolve OpenCode questions and permission prompts in chat
- Operational observability: logs, health checks, pinned status updates
- Safe defaults: single-user authorization gate and local API usage

## Requirements

- Node.js `>=20`
- OpenCode CLI installed and working (`opencode --version`)
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram numeric user ID from [@userinfobot](https://t.me/userinfobot)

## Quick Start

### 1) Create Telegram Bot

1. Open [@BotFather](https://t.me/BotFather)
2. Run `/newbot`
3. Save the bot token

### 2) Start OpenCode Server

In your project workspace:

```bash
opencode serve
```

Default API URL used by this bot: `http://localhost:4096`

### 3) Run This Bot (from this repository)

```bash
npm install
npm run dev
```

On first run, the setup wizard asks for token, allowed user ID, and API URL.

Optional global install from local source:

```bash
npm install -g .
opencode-telegram start
```

If you publish this fork to npm, use package name `@tamaproject360/opencode-telegram-bot`.

Re-run setup anytime:

```bash
opencode-telegram config
```

## Bot Commands

| Command              | Description                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| `/status`            | Show server health, project, session, model, and runtime details          |
| `/new`               | Create a new session                                                      |
| `/stop`              | Stop current running task                                                 |
| `/sessions`          | List and switch sessions                                                  |
| `/projects`          | List and switch projects                                                  |
| `/newproject <path>` | Open a directory as current OpenCode project                              |
| `/ls [path]`         | List files in current project (relative path recommended)                 |
| `/tree [path]`       | Show directory tree (depth-limited)                                       |
| `/model`             | Select model from available favorites                                     |
| `/agent`             | Select work mode/agent (typically Plan/Build, depends on OpenCode config) |
| `/language`          | Change bot UI language (`en` / `ru` / `id`)                               |
| `/rename`            | Rename current session                                                    |
| `/opencode_start`    | Start local OpenCode server                                               |
| `/opencode_stop`     | Stop local OpenCode server                                                |
| `/help`              | Show help                                                                 |

Any non-command text is treated as a prompt.

## Configuration

### Environment Variables

| Variable                   | Description                                      | Required | Default                 |
| -------------------------- | ------------------------------------------------ | :------: | ----------------------- |
| `TELEGRAM_BOT_TOKEN`       | Telegram bot token                               |   Yes    | -                       |
| `TELEGRAM_ALLOWED_USER_ID` | Authorized Telegram user ID                      |   Yes    | -                       |
| `TELEGRAM_PROXY_URL`       | Telegram API proxy (`socks5://` or `http(s)://`) |    No    | -                       |
| `OPENCODE_API_URL`         | OpenCode API base URL                            |    No    | `http://localhost:4096` |
| `OPENCODE_SERVER_USERNAME` | OpenCode auth username                           |    No    | `opencode`              |
| `OPENCODE_SERVER_PASSWORD` | OpenCode auth password                           |    No    | empty                   |
| `OPENCODE_MODEL_PROVIDER`  | Default provider                                 |   Yes    | -                       |
| `OPENCODE_MODEL_ID`        | Default model ID                                 |   Yes    | -                       |
| `BOT_LOCALE`               | Startup locale (`en`, `ru`, `id`)                |    No    | `en`                    |
| `SESSIONS_LIST_LIMIT`      | Max sessions shown in `/sessions`                |    No    | `10`                    |
| `CODE_FILE_MAX_SIZE_KB`    | Max file size sent to Telegram                   |    No    | `100`                   |
| `SHOW_THINKING`            | Show "thinking" indicator in chat                |    No    | `true`                  |
| `SHOW_TOOL_EVENTS`         | Show tool call notifications                     |    No    | `true`                  |
| `LOG_LEVEL`                | `debug`, `info`, `warn`, `error`                 |    No    | `info`                  |

### Config File Locations

When installed from npm, runtime files are created under platform app-data paths.

- macOS: `~/Library/Application Support/opencode-telegram-bot/`
- Windows: `%APPDATA%\opencode-telegram-bot\`
- Linux: `~/.config/opencode-telegram-bot/`

Important files:

- `.env`: secrets and runtime config
- `settings.json`: persisted bot state (selected project/session/model/agent/locale)

## Agent Modes and Best Practices

- Use `Plan` mode for analysis/discussion and non-edit workflows.
- Use `Build` mode when you want code changes applied.
- Available agent names come from your OpenCode server config; if a custom agent is missing, define it in OpenCode first.
- Keep OpenCode and this bot on compatible latest versions to avoid API/agent mismatch issues.

## Development

### Run from Source

```bash
git clone https://github.com/tamaproject360/opencode-telegram-bot.git
cd opencode-telegram-bot
npm install
cp .env.example .env
```

Then build and run:

```bash
npm run dev
```

### Scripts

| Script                          | Purpose                         |
| ------------------------------- | ------------------------------- |
| `npm run dev`                   | Build + start                   |
| `npm run build`                 | Compile TypeScript              |
| `npm start`                     | Run compiled app                |
| `npm run lint`                  | ESLint (no warnings allowed)    |
| `npm run format`                | Prettier formatting             |
| `npm test`                      | Run Vitest                      |
| `npm run test:coverage`         | Run tests with coverage         |
| `npm run release:notes:preview` | Preview generated release notes |

Recommended local quality gate before release:

```bash
npm run build && npm run lint && npm test
```

## Operations and Security

- Do not commit `.env` or any credential file.
- Rotate Telegram bot token if leakage is suspected.
- Keep `TELEGRAM_ALLOWED_USER_ID` scoped to one owner account.
- Run OpenCode server on localhost unless you intentionally need remote access.
- Review logs (`LOG_LEVEL=debug`) when diagnosing callback or SSE issues.

## Troubleshooting

### Bot not responding

- Confirm `TELEGRAM_ALLOWED_USER_ID` matches your Telegram account
- Confirm the token is valid
- Check bot process logs for auth rejections

### `fetch failed` / server unavailable

- Ensure `opencode serve` is running
- Verify `OPENCODE_API_URL`
- If auth is enabled on OpenCode, verify username/password variables

### `/ls` or `/tree` shows empty

- Confirm current project with `/status` and `/projects`
- Use relative paths (for example `/ls src`, `/tree src`)
- Ensure the selected project matches the workspace where OpenCode server is running

### `/agent` list is incomplete

- Agent list is controlled by OpenCode server configuration
- If a custom agent is needed, add/configure it in OpenCode first

### No models in `/model`

- Add models to favorites in OpenCode TUI
- Re-open `/model` menu after favorites update

## Contributing

Please follow conventions in `CONTRIBUTING.md` and `AGENTS.md`.

## License

[MIT](LICENSE)
