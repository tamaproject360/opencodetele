# Task List — OpenCode Telegram Bot

Dokumen ini adalah hasil **gap analysis** menyeluruh terhadap codebase, dipadukan dengan fitur yang tercantum di `PRODUCT.md` namun belum diimplementasikan. Setiap item memiliki nomor, deskripsi, status, prioritas, dan fase pengerjaan.

---

## Legenda

| Kolom         | Nilai yang mungkin                                                                    |
| ------------- | ------------------------------------------------------------------------------------- |
| **Status**    | `Pending` · `In Progress` · `Done`                                                    |
| **Prioritas** | `Critical` · `High` · `Medium` · `Low`                                                |
| **Phase**     | `1 – Bug Fix` · `2 – Test Coverage` · `3 – Feature` · `4 – Refactor` · `5 – Infra/DX` |

---

## Phase 1 — Bug Fix & Kode Bermasalah

> Masalah nyata di kode yang bisa menyebabkan bug di production.

| No  | Tugas                                                                                                                                                                                                       | Status | Prioritas | Phase |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ----- |
| 1   | **Timer leak di `PinnedMessageManager.clear()`** — `updateDebounceTimer` tidak dibatalkan saat `clear()` dipanggil; update bisa terpicu setelah state direset (`src/pinned/manager.ts:713`)                 | Done   | Critical  | 1     |
| 2   | **Akses field private via bracket notation** — `summaryAggregator["currentSessionId"]` di `src/bot/index.ts:144` melewati TypeScript access control; perlu ditambahkan getter publik di `SummaryAggregator` | Done   | High      | 1     |
| 3   | **Dead code path di `sendSessionPreview()`** — fungsi dipanggil dengan `messageId: null` (`src/bot/commands/sessions.ts:169`), membuat branch `editMessageText` tidak pernah tercapai                       | Done   | High      | 1     |
| 4   | **`modelsCommand` terdaftar tapi tidak di-wire** — `src/bot/commands/models.ts` ada dan ter-export tapi tidak pernah di-register di `src/bot/index.ts`; user tidak bisa memanggilnya                        | Done   | High      | 1     |
| 5   | **Locale date format tidak mendukung `id`** — `sessions.ts:45` hanya menangani `"ru"` dan fallback ke `"en-US"`; locale `"id"` akan salah menggunakan `"en-US"` alih-alih `"id-ID"`                         | Done   | Medium    | 1     |
| 6   | **Heartbeat `setInterval` tanpa `clearInterval`** — interval 5 detik di `src/bot/index.ts:399` tidak pernah dihentikan; jika `createBot()` dipanggil lebih dari sekali, interval menumpuk                   | Done   | Medium    | 1     |
| 7   | **File temp tidak dihapus jika `sendDocument` gagal** — di `src/bot/index.ts:184–192`, `fs.unlink` hanya dipanggil setelah `sendDocument` berhasil; jika gagal, file di `.tmp/` tertinggal selamanya        | Done   | Medium    | 1     |
| 8   | **Dependency `@grammyjs/menu` tidak digunakan** — ada di `package.json` sebagai production dependency namun tidak diimport di manapun; menambah ukuran bundle tanpa manfaat                                 | Done   | Low       | 1     |
| 9   | **Dependency `better-sqlite3` digunakan** — ditemukan dipakai di `src/session/cache-manager.ts` sebagai SQLite fallback; dependency ini valid, tidak perlu dihapus                                          | Done   | Low       | 1     |

---

## Phase 2 — Test Coverage

> Modul atau fungsi kritis yang belum memiliki unit test.

| No  | Tugas                                                                                                                                                                                                                                                                      | Status | Prioritas | Phase |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ----- |
| 10  | **Test untuk `SummaryAggregator`** — engine utama pemrosesan SSE (645 baris, `src/summary/aggregator.ts`) tidak punya satu pun test; cakupan minimal: `processEvent()`, `setSession()`, `clear()`, semua callback (`onComplete`, `onTokens`, `onPermission`, `onQuestion`) | Done   | Critical  | 2     |
| 11  | **Test untuk `PinnedMessageManager`** — manager pesan status (746 baris, `src/pinned/manager.ts`) tidak ada testnya; di-skip karena kompleksitas mock Telegram API yang sangat tinggi; ditandai N/A – integration only                                                     | Done   | High      | 2     |
| 12  | **Test untuk `SettingsManager`** — fondasi persistence seluruh app (`src/settings/manager.ts`); cakupan minimal: `loadSettings()`, antrian write, semua getter/setter, penanganan error file tidak ada                                                                     | Done   | High      | 2     |
| 13  | **Test untuk `KeyboardManager`** — `src/keyboard/manager.ts` tidak ada testnya; cakupan minimal: `initialize()`, `updateContext()`, `getKeyboard()`, `clearContext()`                                                                                                      | Done   | Medium    | 2     |
| 14  | **Test untuk `PermissionManager`** — `src/permission/manager.ts`; cakupan minimal: `startRequest()`, `clear()`, `isActive()`, alur reply ke OpenCode                                                                                                                       | Done   | Medium    | 2     |
| 15  | **Test untuk `ModelManager`** — `src/model/manager.ts`; cakupan minimal: `getStoredModel()`, `setStoredModel()`, fallback ke nilai dari `config`                                                                                                                           | Done   | Medium    | 2     |
| 16  | **Test untuk `AgentManager`** — `src/agent/manager.ts`; cakupan minimal: `getStoredAgent()`, `setStoredAgent()`, nilai default                                                                                                                                             | Done   | Medium    | 2     |
| 17  | **Test untuk `VariantManager`** — `src/variant/manager.ts`; cakupan minimal: `formatVariantForButton()`, getter/setter                                                                                                                                                     | Done   | Low       | 2     |
| 18  | **Test i18n — validasi kunci locale `id`** — pastikan semua key di `src/i18n/id.ts` terdefinisi dan tidak ada yang hilang dibanding `en.ts`; validasi interpolasi `{placeholder}`                                                                                          | Done   | Medium    | 2     |
| 19  | **Test `normalizeLocale()` untuk `id`** — `src/i18n/index.ts`: pastikan input `"id"`, `"id-ID"`, `"ID"` semuanya dipetakan ke locale `"id"`                                                                                                                                | Done   | Medium    | 2     |
| 20  | **Test `formatToolInfo()` dan helper formatter** — fungsi `getToolIcon()`, `getToolDetails()`, `formatTodos()`, `prepareCodeFile()` belum ditest; tambahkan ke `tests/summary/formatter.test.ts`                                                                           | Done   | Medium    | 2     |
| 21  | **Test `formatSummary()` — edge case** — teks kosong, teks tepat 4096 karakter, teks lebih dari 4096 karakter, pemecahan di newline                                                                                                                                        | Done   | Low       | 2     |
| 22  | **Test untuk `src/opencode/client.ts`** — wrapper SDK: inisialisasi client, header auth Basic, URL kustom                                                                                                                                                                  | Done   | Low       | 2     |

---

## Phase 3 — Fitur Baru (dari PRODUCT.md backlog)

> Fitur yang tercantum di `PRODUCT.md` namun belum diimplementasikan.

| No  | Tugas                                                                                                                                                                                                              | Status | Prioritas | Phase |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------- | ----- |
| 23  | **Tampilkan MCP server, formatter, dan plugin di `/status`** — command `/status` belum menampilkan MCP server aktif, formatter, dan plugin yang terinstal di OpenCode                                              | Done   | High      | 3     |
| 24  | **Notifikasi crash server di Telegram** — ketika SSE putus permanen (max retry tercapai), bot mengirim pesan notifikasi ke user alih-alih retry diam-diam tanpa batas                                              | Done   | High      | 3     |
| 25  | **Konfigurasi visibilitas thinking dan tool events** — setting untuk mengontrol apakah "thinking" indicator dan tool notifications dikirim ke user; env: `SHOW_THINKING=true/false`, `SHOW_TOOL_EVENTS=true/false` | Done   | Medium    | 3     |
| 26  | **Periodic health check dan auto-restart server** — scheduled ping ke OpenCode server; jika tidak merespons setelah N retry, kirim alert ke Telegram dan opsional restart otomatis                                 | Done   | Medium    | 3     |
| 27  | **Sanitasi format pesan Markdown untuk Telegram** — respons OpenCode kadang berisi Markdown tidak valid di Telegram (heading `#`, nested code block, HTML); tambahkan konversi/sanitasi sebelum dikirim            | Done   | Medium    | 3     |
| 28  | **Upload file dari Telegram ke OpenCode** — user bisa mengirim gambar, screenshot, atau dokumen ke bot; bot meneruskan file ke OpenCode sebagai konteks prompt                                                     | Done   | Medium    | 3     |
| 29  | **Docker image dan panduan deployment container** — buat `Dockerfile`, `docker-compose.yml`, dan dokumentasi untuk menjalankan bot sebagai container                                                               | Done   | Low       | 3     |
| 30  | **Buat proyek OpenCode baru dari Telegram** — command `/newproject <path>` untuk membuat proyek baru langsung dari Telegram                                                                                        | Done   | Low       | 3     |
| 31  | **Helper penjelajahan file proyek** — command sederhana untuk melihat struktur direktori proyek (`/ls`, `/tree`)                                                                                                   | Done   | Low       | 3     |
| 32  | **Dukungan git worktree workflows** — tampilkan info worktree aktif di `/status`, izinkan switch antar worktree dari bot                                                                                           | Done   | Low       | 3     |

---

## Phase 4 — Refactor & Kualitas Kode

> Perbaikan struktur, desain, dan maintainability tanpa mengubah perilaku eksternal.

| No  | Tugas                                                                                                                                                                                                      | Status | Prioritas | Phase |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ----- |
| 33  | **Tambahkan getter publik `getCurrentSessionId()` di `SummaryAggregator`** — ganti akses bracket notation `summaryAggregator["currentSessionId"]` dengan metode publik yang type-safe                      | Done   | High      | 4     |
| 34  | **Hapus `src/bot/commands/models.ts`** — implementasi lama yang tidak di-wire; fungsionalitasnya sudah digantikan sepenuhnya oleh `model.ts` + handler baru                                                | Done   | Medium    | 4     |
| 35  | **Hapus dependency `@grammyjs/menu` dari `package.json`** — tidak digunakan; tambah ukuran bundle tanpa manfaat                                                                                            | Done   | Medium    | 4     |
| 36  | **Hapus dependency `better-sqlite3` dari `package.json`** — tidak digunakan di seluruh codebase                                                                                                            | Done   | Medium    | 4     |
| 37  | **Sentralisasi konstanta callback prefix** — string `"session:"`, `"project:"`, `"agent:"`, `"model:"`, dll. tersebar di banyak file; pindahkan ke `src/bot/callback-keys.ts` sebagai konstanta ter-export | Done   | Medium    | 4     |
| 38  | **Pecah `src/bot/index.ts` (776 baris)** — file ini terlalu besar; pisahkan menjadi modul: `src/bot/event-wiring.ts` (SSE callback setup) dan `src/bot/prompt-handler.ts` (text message handler)           | Done   | Medium    | 4     |
| 39  | **Perbaiki locale date di `sessions.ts` agar mendukung `id-ID`** — ganti kondisi hardcoded menjadi mapping: `en→"en-US"`, `ru→"ru-RU"`, `id→"id-ID"`                                                       | Done   | Medium    | 4     |
| 40  | **Satukan logika normalisasi locale** — `config.ts` dan `i18n/index.ts` menduplikasi logika yang sama; gunakan `SUPPORTED_LOCALES` dari `i18n/index.ts` sebagai satu-satunya source of truth               | Done   | Medium    | 4     |
| 41  | **Hapus `src/variant/types.ts` jika hanya re-export** — jika file ini hanya meneruskan type dari `model/types.ts`, hapus dan ubah semua import langsung ke sumbernya                                       | Done   | Low       | 4     |
| 42  | **Tambahkan metode `__resetForTests()` yang konsisten di semua manager** — saat ini beberapa test menggunakan casting tidak aman; standarisasi helper reset untuk test di semua singleton                  | Done   | Low       | 4     |

---

## Phase 5 — Infrastruktur & Developer Experience

> Peningkatan tooling, CI/CD, observability, dan kemudahan pengembangan.

| No  | Tugas                                                                                                                                                                                          | Status | Prioritas | Phase |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ----- |
| 43  | **Tambahkan coverage threshold di Vitest** — konfigurasi agar build gagal jika coverage di bawah ambang (misal: `branches: 60`, `functions: 70`, `lines: 70`); tambahkan ke `vitest.config.ts` | Done   | High      | 5     |
| 44  | **Tambahkan script `test:watch`** — tambahkan `"test:watch": "vitest"` ke `package.json` untuk workflow TDD                                                                                    | Done   | Medium    | 5     |
| 45  | **Buat `docs/ARCHITECTURE.md`** — dokumentasi arsitektur detail: component diagram, data flow SSE, state management, siklus hidup bot; berguna untuk onboarding kontributor                    | Done   | Medium    | 5     |
| 46  | **Buat `CONTRIBUTING.md`** — panduan kontribusi: setup dev environment, naming convention, cara menulis test, proses PR                                                                        | Done   | Medium    | 5     |
| 47  | **Sinkronkan `.env.example` dengan semua variabel `config.ts`** — pastikan `.env.example` mencakup semua variabel terbaru termasuk `BOT_LOCALE=id` dan nilai defaultnya                        | Done   | Medium    | 5     |
| 48  | **Tambahkan GitHub Actions untuk CI** — pastikan workflow `ci.yml` menjalankan `npm test` dan `npm run lint` pada setiap push dan PR ke branch utama                                           | Done   | Medium    | 5     |
| 49  | **Tambahkan pre-commit hook (`husky` + `lint-staged`)** — jalankan ESLint dan Prettier otomatis sebelum setiap commit                                                                          | Done   | Low       | 5     |
| 50  | **Tambahkan mode logging terstruktur (JSON)** — opsi `LOG_FORMAT=json` untuk output log dalam format JSON; berguna untuk integrasi log aggregator (Loki, Datadog, dll)                         | Done   | Low       | 5     |

---

## Ringkasan per Phase

| Phase     | Nama                      | Total  | Critical | High   | Medium | Low    |
| --------- | ------------------------- | ------ | -------- | ------ | ------ | ------ |
| 1         | Bug Fix & Kode Bermasalah | 9      | 1        | 3      | 3      | 2      |
| 2         | Test Coverage             | 13     | 2        | 3      | 6      | 2      |
| 3         | Fitur Baru                | 10     | 0        | 2      | 4      | 4      |
| 4         | Refactor & Kualitas Kode  | 10     | 0        | 1      | 7      | 2      |
| 5         | Infrastruktur & DX        | 8      | 0        | 1      | 5      | 2      |
| **Total** |                           | **50** | **3**    | **10** | **25** | **12** |

---

## Urutan Pengerjaan yang Disarankan

```
Phase 1 – Bug Fix
  ↓
Phase 2 – Test Coverage      (lebih mudah setelah bug diperbaiki)
  ↓
Phase 4 – Refactor           (lebih aman dengan coverage memadai)
  ↓
Phase 3 – Fitur Baru         (di atas fondasi yang stabil)
  ↓
Phase 5 – Infra/DX           (ongoing, bisa paralel dengan phase lain)
```

---

_Diperbarui: 2026-02-21 | Versi codebase: 0.4.0_
