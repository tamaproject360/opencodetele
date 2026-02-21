# Contributing

Thanks for contributing to OpenCode Telegram Bot.

## Prerequisites

- **Node.js** 20 or later
- **npm** (comes with Node.js)
- A **Telegram bot token** from [@BotFather](https://t.me/BotFather)
- Your **Telegram user ID** (from [@userinfobot](https://t.me/userinfobot))
- A running [OpenCode](https://opencode.ai) instance (for manual testing)

## Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/grinev/opencode-telegram-bot.git
cd opencode-telegram-bot

# 2. Install dependencies
npm install

# 3. Copy and fill in the environment file
cp .env.example .env
# Edit .env: set TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWED_USER_ID, and model settings

# 4. Build and start
npm run build
npm start
```

## Quality Checks

Before submitting a PR, all three checks must pass:

```bash
npm run lint     # ESLint — zero warnings allowed
npm run build    # TypeScript compiler — zero errors
npm test         # Vitest — all tests pass, coverage thresholds met
```

Watch mode for TDD:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

## Coding Conventions

- TypeScript strict mode — all types must be explicit.
- Prefer `const` over `let`. Never use `var`.
- Use `async/await` over `.then()` chains.
- Use `.js` extensions in all import paths (required for ESM).
- Never use `console.log` in feature code — use `src/utils/logger.ts` instead.
- Keep functions small and focused. Avoid side effects in constructors.

### Logging levels

| Level   | Use for                                                        |
| ------- | -------------------------------------------------------------- |
| `debug` | SSE internals, polling flow, keyboard builds, callback routing |
| `info`  | Session/task start/finish, status changes, server start/stop   |
| `warn`  | Timeouts, retries, unauthorized access attempts                |
| `error` | Unrecoverable failures that need attention                     |

## Writing Tests

Tests live in `tests/` and mirror the `src/` structure.

- Follow **Arrange → Act → Assert**.
- Use descriptive test names.
- Mock external dependencies with `vi.mock()`.
- Reset singleton state in `afterEach`:

```typescript
import { resetSingletonState } from "../helpers/reset-singleton-state.js";
afterEach(() => {
  resetSingletonState();
});
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for an overview of all components.

## Adding a Command

1. Create `src/bot/commands/your-command.ts`.
2. Add to `src/bot/commands/definitions.ts`: `{ command: "yourcommand", descriptionKey: "cmd.description.yourcommand" }`.
3. Add the description string to `src/i18n/en.ts`, `src/i18n/ru.ts`, and `src/i18n/id.ts`.
4. Register in `src/bot/index.ts`: `bot.command("yourcommand", yourCommandHandler)`.
5. Add callback prefix constants to `src/bot/callback-keys.ts` if using inline keyboards.

## Adding Translations

1. Add the key and English value to `src/i18n/en.ts` (canonical source).
2. Add the same key to `src/i18n/ru.ts` and `src/i18n/id.ts` — TypeScript will error if any key is missing.
3. Use `t("your.key", { placeholder: "value" })` in code.

## Commit Message Convention

This project uses Conventional Commits for release note automation.

Format:

`<type>(<scope>)?: <description>`

Optional major marker:

`feat(<scope>)!: <description>`

Examples:

- `feat(keyboard): add robot icon for model button`
- `fix(model): handle model IDs with colons`
- `docs(readme): clarify setup steps`
- `feat(ui)!: redesign keyboard layout`

## Branch Naming Convention

Use the following branch name format:

`<type>/<short-description>`

Examples:

- `feat/model-selector`
- `fix/session-timeout`
- `docs/contributing-branch-rules`

Rules:

- Use lowercase letters and kebab-case only.
- Use only `a-z`, `0-9`, and `-`.
- Keep `short-description` concise (2-6 words).
- Recommended `type` values: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`, `build`, `perf`, `hotfix`.

## Release Notes Mapping

Release notes are generated automatically from commit subjects.

Sections are shown only when they contain at least one item.

- `Major Changes`: `feat!` only
- `Changes`: `feat`, `perf`
- `Bug Fixes`: `fix`, `revert`
- `Technical`: `refactor`, `chore`, `ci`, `build`, `test`, `style`
- `Documentation`: `docs`
- `Other`: any subject that does not match the rules above

Additional rules:

- Merge commits are excluded.
- `chore(release): vX.Y.Z` commits are excluded.
- Notes use cleaned human-readable text (no commit hashes).

## Version Bump Checklist

This repository is currently in `0.x`, but version bumps still follow a strict SemVer-style policy:

- **Patch (`0.1.1 -> 0.1.2`)**
  - Bug fixes (`fix`)
  - Small UX polish that does not change expected behavior
  - Internal/release/docs/test/ci updates (`chore`, `refactor`, `docs`, `test`, `ci`, `build`, `style`)
  - No breaking changes

- **Minor (`0.1.1 -> 0.2.0`)**
  - New user-visible functionality (`feat`)
  - Meaningful behavior improvements users are expected to notice
  - Additive changes that remain backward-compatible

- **Major (`0.x -> 1.0.0` or `1.x -> 2.0.0`)**
  - Breaking changes that require migration
  - Contract/API changes that can break existing setups
  - Reserved for explicitly planned compatibility breaks

Quick decision rule:

- Mostly fixes/infra/docs -> patch
- At least one clear user-facing feature -> minor
- Any intentional breakage -> major

## Pull Requests

- Keep PRs focused and small when possible.
- Use clear titles that match the change intent.
- Ensure CI passes before requesting review.
