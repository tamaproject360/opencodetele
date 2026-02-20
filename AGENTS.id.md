# AGENTS.id.md

Instruksi untuk agen AI yang bekerja pada proyek ini.

## Tentang proyek

**opencode-telegram-bot** adalah bot Telegram yang berfungsi sebagai klien mobile untuk OpenCode.
Bot ini memungkinkan pengguna menjalankan dan memantau tugas coding di mesin lokal melalui Telegram.

Persyaratan fungsional, fitur, dan status pengembangan ada di [PRODUCT.id.md](./PRODUCT.id.md).

## Tumpukan teknologi

- **Bahasa:** TypeScript 5.x
- **Runtime:** Node.js 20+
- **Package manager:** npm
- **Konfigurasi:** variabel lingkungan (`.env`)
- **Logging:** logger kustom dengan level (`debug`, `info`, `warn`, `error`)

### Dependensi utama

- `grammy` - framework Telegram Bot API (https://grammy.dev/)
- `@grammyjs/menu` - keyboard inline dan menu
- `@opencode-ai/sdk` - SDK Server OpenCode resmi
- `dotenv` - pemuatan variabel lingkungan

### Dependensi test

- Vitest
- Mocks/stubs via `vi.mock()`

### Kualitas kode

- ESLint + Prettier
- TypeScript strict mode

## Struktur proyek

```text
opencode-telegram-bot/
|- src/
|  |- index.ts                 # Entry point mode sumber
|  |- cli.ts                   # Entry point CLI yang diinstal
|  |- config.ts                # Loader konfigurasi lingkungan
|  |- app/
|  |  \- start-bot-app.ts      # Bootstrap aplikasi
|  |- runtime/
|  |  |- mode.ts               # Resolusi mode runtime
|  |  |- paths.ts              # Path yang mengetahui runtime
|  |  \- bootstrap.ts          # Bootstrap CLI/wizard konfigurasi
|  |- bot/
|  |  |- index.ts              # Inisialisasi bot dan handler
|  |  |- commands/             # Handler perintah
|  |  |  \- definitions.ts     # Daftar perintah terpusat
|  |  |- handlers/             # Handler callback (question/permission/model/dll.)
|  |  |- middleware/
|  |  |  \- auth.ts            # Otorisasi pengguna
|  |  \- utils/
|  |     \- keyboard.ts        # Builder/helper keyboard
|  |- opencode/
|  |  |- client.ts             # Wrapper SDK
|  |  \- events.ts             # Langganan SSE dan penanganan event
|  |- session/manager.ts       # State sesi saat ini
|  |- project/manager.ts       # Manajemen proyek
|  |- settings/manager.ts      # Load/save settings.json
|  |- summary/
|  |  |- aggregator.ts         # Agregasi event
|  |  \- formatter.ts          # Pemformatan Telegram
|  |- question/manager.ts      # State tool pertanyaan
|  |- permission/manager.ts    # State tool izin
|  |- model/manager.ts         # State pemilihan model
|  |- agent/manager.ts         # State mode agen
|  |- variant/manager.ts       # State pemilihan varian
|  |- keyboard/manager.ts      # State keyboard bawah
|  |- pinned/manager.ts        # State pesan status yang disematkan
|  |- process/manager.ts       # Siklus hidup proses OpenCode
|  |- i18n/                    # String yang dilokalisasi (en, ru, id)
|  \- utils/
|     |- logger.ts             # Utilitas logging
|     \- safe-background-task.ts
|- tests/
|- scripts/
|- package.json
|- PRODUCT.md
|- README.md
|- AGENTS.md
```

## Arsitektur

### Komponen utama

1. **Bot Layer** - setup grammY, middleware, perintah, handler callback
2. **OpenCode Client Layer** - wrapper SDK dan langganan event SSE
3. **State Managers** - session/project/settings/question/permission/model/agent/variant/keyboard/pinned
4. **Summary Pipeline** - agregasi event dan pemformatan ramah Telegram
5. **Process Manager** - start/stop/status proses server OpenCode lokal
6. **Runtime/CLI Layer** - mode runtime, bootstrap konfigurasi, perintah CLI
7. **I18n Layer** - string bot dan CLI yang dilokalisasi (`en`, `ru`, `id`)

### Aliran data

```text
Pengguna Telegram
  -> Bot Telegram (grammY)
  -> Managers + OpenCodeClient
  -> Server OpenCode

Server OpenCode
  -> Event SSE
  -> Event Listener
  -> Summary Aggregator / Tool Managers
  -> Bot Telegram
  -> Pengguna Telegram
```

### Manajemen state

- State persisten disimpan di `settings.json`.
- State runtime aktif disimpan di manager in-memory khusus.
- Konteks sesi/proyek/model/agen disinkronkan melalui panggilan OpenCode API.
- Aplikasi saat ini dirancang untuk pengguna tunggal.

## Aturan perilaku agen AI

### Komunikasi

- **Bahasa respons:** Balas dalam bahasa yang sama yang digunakan pengguna dalam pertanyaan mereka.
- **Klarifikasi:** Jika konfirmasi rencana diperlukan, gunakan tool `question`. Jangan membuat keputusan besar (perubahan arsitektur, penghapusan massal, perubahan berisiko) tanpa konfirmasi eksplisit.

### Git

- **Commit:** Jangan pernah membuat commit secara otomatis. Commit hanya ketika pengguna secara eksplisit meminta.

### Windows / PowerShell

- Ingat bahwa lingkungan runtime adalah Windows.
- Hindari one-liner yang rapuh yang dapat rusak di PowerShell.
- Gunakan path absolut saat bekerja dengan tool file (`read`, `write`, `edit`).

## Aturan coding

### Gaya kode

- Gunakan TypeScript strict mode.
- Gunakan ESLint + Prettier.
- Lebih suka `const` daripada `let`.
- Gunakan nama yang jelas dan hindari singkatan yang tidak perlu.
- Jaga fungsi tetap kecil dan terfokus.
- Lebih suka `async/await` daripada chained `.then()`.

### Penanganan error

- Gunakan `try/catch` di sekitar operasi async.
- Log error dengan konteks (session ID, tipe operasi, dll.).
- Kirim pesan error yang dapat dipahami kepada pengguna.
- Jangan pernah mengekspos stack trace kepada pengguna.

### Perintah bot

Daftar perintah terpusat di `src/bot/commands/definitions.ts`.

```typescript
const COMMAND_DEFINITIONS: BotCommandI18nDefinition[] = [
  { command: "status", descriptionKey: "cmd.description.status" },
  { command: "new", descriptionKey: "cmd.description.new" },
  { command: "stop", descriptionKey: "cmd.description.stop" },
  { command: "sessions", descriptionKey: "cmd.description.sessions" },
  { command: "projects", descriptionKey: "cmd.description.projects" },
  { command: "model", descriptionKey: "cmd.description.model" },
  { command: "agent", descriptionKey: "cmd.description.agent" },
  { command: "opencode_start", descriptionKey: "cmd.description.opencode_start" },
  { command: "opencode_stop", descriptionKey: "cmd.description.opencode_stop" },
  { command: "help", descriptionKey: "cmd.description.help" },
];
```

Penting:

- Saat menambahkan perintah, update hanya `definitions.ts`.
- Sumber yang sama digunakan untuk `setMyCommands` Telegram dan bantuan/dokumentasi.
- Jangan duplikasi daftar perintah di tempat lain.

### Logging

Proyek menggunakan `src/utils/logger.ts` dengan logging berbasis level.

Level:

- **DEBUG** - diagnostik terperinci (callback, build keyboard, SSE internal, alur polling)
- **INFO** - event siklus hidup utama (start/finish sesi/tugas, perubahan status)
- **WARN** - masalah yang dapat dipulihkan (timeout, retry, percobaan tidak sah)
- **ERROR** - kegagalan kritis yang membutuhkan perhatian

Gunakan:

```typescript
import { logger } from "../utils/logger.js";

logger.debug("[Component] Operasi terperinci", details);
logger.info("[Component] Event penting terjadi");
logger.warn("[Component] Masalah yang dapat dipulihkan", error);
logger.error("[Component] Kegagalan kritis", error);
```

Penting:

- Jangan gunakan `console.log` / `console.error` mentah secara langsung di kode fitur; gunakan `logger`.
- Taruh diagnostik internal di `debug`.
- Jaga event operasional penting di `info`.
- Level default adalah `info`.

## Testing

### Apa yang perlu ditest

- Unit test untuk business logic, formatter, manager, helper runtime
- Test gaya integrasi seputar interaksi OpenCode SDK menggunakan mock
- Fokus pada jalur kritis; hindari over-testing kode yang sepele

### Struktur test

- Test berada di `tests/` (diorganisir per modul)
- Gunakan nama test yang deskriptif
- Ikuti Arrange-Act-Assert
- Gunakan `vi.mock()` untuk dependensi eksternal

## Konfigurasi

### Variabel lingkungan (`.env`)

```bash
# Telegram (wajib)
TELEGRAM_BOT_TOKEN=token_bot_dari_botfather
TELEGRAM_ALLOWED_USER_ID=123456789

# OpenCode API (opsional)
# OPENCODE_API_URL=http://localhost:4096

# Auth server OpenCode (opsional)
# OPENCODE_SERVER_USERNAME=opencode
# OPENCODE_SERVER_PASSWORD=

# Model default (wajib)
OPENCODE_MODEL_PROVIDER=opencode
OPENCODE_MODEL_ID=big-pickle

# Logging (opsional)
# LOG_LEVEL=info  # debug, info, warn, error

# Opsi bot (opsional)
# SESSIONS_LIST_LIMIT=10
# BOT_LOCALE=id    # en, ru, atau id

# Opsi output file (opsional)
# CODE_FILE_MAX_SIZE_KB=100
```

### Referensi variabel lingkungan

| Variabel                   | Deskripsi                          | Wajib | Default                 |
| -------------------------- | ---------------------------------- | ----- | ----------------------- |
| `TELEGRAM_BOT_TOKEN`       | Token bot dari @BotFather          | Ya    | -                       |
| `TELEGRAM_ALLOWED_USER_ID` | Telegram user ID yang diizinkan    | Ya    | -                       |
| `TELEGRAM_PROXY_URL`       | URL Proxy untuk Telegram API       | Tidak | -                       |
| `OPENCODE_MODEL_PROVIDER`  | Provider model default             | Ya    | -                       |
| `OPENCODE_MODEL_ID`        | ID model default                   | Ya    | -                       |
| `OPENCODE_API_URL`         | URL OpenCode API                   | Tidak | `http://localhost:4096` |
| `OPENCODE_SERVER_USERNAME` | Username auth OpenCode             | Tidak | `opencode`              |
| `OPENCODE_SERVER_PASSWORD` | Password auth OpenCode             | Tidak | kosong                  |
| `LOG_LEVEL`                | Level logging                      | Tidak | `info`                  |
| `SESSIONS_LIST_LIMIT`      | Maks sesi di `/sessions`           | Tidak | `10`                    |
| `BOT_LOCALE`               | Locale bot (`en`, `ru`, atau `id`) | Tidak | `en`                    |
| `CODE_FILE_MAX_SIZE_KB`    | Ukuran file kode maks              | Tidak | `100`                   |

## Referensi cepat OpenCode SDK

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({ baseUrl: "http://localhost:4096" });

await client.global.health();

await client.project.list();
await client.project.current();

await client.session.list();
await client.session.create({ body: { title: "Sesi saya" } });
await client.session.prompt({
  path: { id: "session-id" },
  body: { parts: [{ type: "text", text: "Implementasikan fitur X" }] },
});
await client.session.abort({ path: { id: "session-id" } });

const events = await client.event.subscribe();
for await (const event of events.stream) {
  // tangani event SSE
}
```

Dokumentasi lengkap: https://opencode.ai/docs/sdk

## Alur kerja

1. Baca [PRODUCT.id.md](./PRODUCT.id.md) untuk memahami cakupan dan status.
2. Inspeksi kode yang ada sebelum menambah atau mengubah komponen.
3. Selaraskan perubahan arsitektur besar (termasuk dependensi baru) dengan pengguna terlebih dahulu.
4. Tambahkan atau update test untuk fungsionalitas baru.
5. Setelah perubahan kode, jalankan pemeriksaan kualitas: `npm run build`, `npm run lint`, dan `npm test`.
6. Update checkbox di `PRODUCT.id.md` saat tugas yang relevan selesai.
7. Jaga kode tetap bersih, konsisten, dan mudah dipelihara.
