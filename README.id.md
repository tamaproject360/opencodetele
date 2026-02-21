# OpenCode Telegram Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

[English](README.md) | Bahasa Indonesia

Kendalikan workflow coding [OpenCode](https://opencode.ai) lokal Anda lewat Telegram. Anda bisa kirim prompt, ganti sesi/proyek/model, menjawab pertanyaan interaktif, dan memantau progres langsung dari ponsel.

Bot ini dibuat untuk operasi single-user, local-first:

- Tidak butuh inbound public port
- API OpenCode tetap lokal secara default (`127.0.0.1`)
- Akses Telegram dibatasi ketat oleh allowed user ID

<p align="center">
  <img src="assets/Screenshot-1.png" width="32%" alt="Mengirim tugas coding dan menerima hasil edit file" />
  <img src="assets/Screenshot-2.png" width="32%" alt="Status sesi langsung dengan penggunaan konteks dan file yang berubah" />
  <img src="assets/Screenshot-3.png" width="32%" alt="Mengganti model dari chat" />
</p>

## Status Saat Ini

Fungsi inti sudah stabil dan aktif digunakan.

- [x] Kontrol server OpenCode (`/status`, `/opencode_start`, `/opencode_stop`)
- [x] Manajemen proyek/sesi dari Telegram
- [x] Eksekusi prompt berbasis SSE event stream
- [x] Penanganan pertanyaan + permission interaktif (tombol dan jawaban teks)
- [x] Pinned live status (proyek, model, konteks, file berubah)
- [x] Kontrol model/agent/variant
- [x] Upload file dari Telegram sebagai konteks prompt
- [x] Lokalisasi (`en`, `ru`, `id`) + ganti bahasa runtime (`/language`)

Daftar improvement berikutnya ada di `PRODUCT.id.md`.

## Fitur Utama

- Prompt jarak jauh: pesan teks biasa langsung jadi prompt coding
- Kontinuitas sesi: lanjutkan sesi lama atau buat sesi baru
- Alat proyek: list proyek, buka direktori custom, list file, tree view
- Interaksi inline: jawab pertanyaan OpenCode dan permission request di chat
- Observability operasional: log, health check, pinned status update
- Default aman: otorisasi single-user dan API lokal

## Prasyarat

- Node.js `>=20`
- OpenCode CLI terpasang dan berjalan (`opencode --version`)
- Token bot Telegram dari [@BotFather](https://t.me/BotFather)
- Telegram numeric user ID Anda dari [@userinfobot](https://t.me/userinfobot)

## Quick Start

### 1) Buat Bot Telegram

1. Buka [@BotFather](https://t.me/BotFather)
2. Jalankan `/newbot`
3. Simpan token bot

### 2) Jalankan OpenCode Server

Di workspace proyek Anda:

```bash
opencode serve
```

URL API default yang dipakai bot: `http://localhost:4096`

### 3) Jalankan Bot Ini (dari repository ini)

```bash
npm install
npm run dev
```

Pada run pertama, wizard setup akan meminta token, allowed user ID, dan URL API.

Alternatif instal global dari source lokal:

```bash
npm install -g .
opencode-telegram start
```

Jika fork ini nanti dipublikasikan ke npm, gunakan nama package `@tamaproject360/opencode-telegram-bot`.

Jalankan ulang setup kapan saja:

```bash
opencode-telegram config
```

## Perintah Bot

| Perintah             | Deskripsi                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| `/status`            | Menampilkan health server, proyek, sesi, model, dan detail runtime             |
| `/new`               | Membuat sesi baru                                                              |
| `/stop`              | Menghentikan task yang sedang berjalan                                         |
| `/sessions`          | Menampilkan dan pindah sesi                                                    |
| `/projects`          | Menampilkan dan pindah proyek                                                  |
| `/newproject <path>` | Membuka direktori sebagai proyek OpenCode aktif                                |
| `/ls [path]`         | Menampilkan daftar file di proyek aktif (disarankan path relatif)              |
| `/tree [path]`       | Menampilkan struktur direktori (depth terbatas)                                |
| `/model`             | Memilih model dari favorites                                                   |
| `/agent`             | Memilih mode kerja/agent (umumnya Plan/Build, tergantung konfigurasi OpenCode) |
| `/language`          | Mengganti bahasa UI bot (`en` / `ru` / `id`)                                   |
| `/rename`            | Mengubah nama sesi aktif                                                       |
| `/opencode_start`    | Menjalankan server OpenCode lokal                                              |
| `/opencode_stop`     | Menghentikan server OpenCode lokal                                             |
| `/help`              | Menampilkan bantuan                                                            |

Semua teks non-command diproses sebagai prompt.

## Konfigurasi

### Variabel Environment

| Variabel                   | Deskripsi                                          | Wajib | Default                 |
| -------------------------- | -------------------------------------------------- | :---: | ----------------------- |
| `TELEGRAM_BOT_TOKEN`       | Token bot Telegram                                 |  Ya   | -                       |
| `TELEGRAM_ALLOWED_USER_ID` | User ID Telegram yang diizinkan                    |  Ya   | -                       |
| `TELEGRAM_PROXY_URL`       | Proxy Telegram API (`socks5://` atau `http(s)://`) | Tidak | -                       |
| `OPENCODE_API_URL`         | Base URL OpenCode API                              | Tidak | `http://localhost:4096` |
| `OPENCODE_SERVER_USERNAME` | Username auth OpenCode                             | Tidak | `opencode`              |
| `OPENCODE_SERVER_PASSWORD` | Password auth OpenCode                             | Tidak | kosong                  |
| `OPENCODE_MODEL_PROVIDER`  | Provider default                                   |  Ya   | -                       |
| `OPENCODE_MODEL_ID`        | ID model default                                   |  Ya   | -                       |
| `BOT_LOCALE`               | Locale awal (`en`, `ru`, `id`)                     | Tidak | `en`                    |
| `SESSIONS_LIST_LIMIT`      | Jumlah maksimum sesi di `/sessions`                | Tidak | `10`                    |
| `CODE_FILE_MAX_SIZE_KB`    | Batas ukuran file ke Telegram                      | Tidak | `100`                   |
| `SHOW_THINKING`            | Tampilkan indikator "thinking" di chat             | Tidak | `true`                  |
| `SHOW_TOOL_EVENTS`         | Tampilkan notifikasi tool call                     | Tidak | `true`                  |
| `LOG_LEVEL`                | `debug`, `info`, `warn`, `error`                   | Tidak | `info`                  |

### Lokasi File Konfigurasi

Saat diinstal via npm, file runtime disimpan di app-data path sesuai platform.

- macOS: `~/Library/Application Support/opencode-telegram-bot/`
- Windows: `%APPDATA%\opencode-telegram-bot\`
- Linux: `~/.config/opencode-telegram-bot/`

File penting:

- `.env`: secret dan konfigurasi runtime
- `settings.json`: state persisten bot (proyek/sesi/model/agent/locale)

## Mode Agent dan Best Practice

- Pakai mode `Plan` untuk analisis/diskusi/non-edit workflow.
- Pakai mode `Build` saat ingin bot melakukan perubahan kode.
- Daftar agent mengikuti konfigurasi server OpenCode Anda; jika custom agent belum muncul, definisikan dulu di sisi OpenCode.
- Jaga versi OpenCode server dan bot ini tetap terbaru agar tidak terjadi mismatch API/agent.

## Pengembangan

### Menjalankan dari Source

```bash
git clone https://github.com/tamaproject360/opencode-telegram-bot.git
cd opencode-telegram-bot
npm install
cp .env.example .env
```

Lalu build dan jalankan:

```bash
npm run dev
```

### Scripts

| Script                          | Fungsi                        |
| ------------------------------- | ----------------------------- |
| `npm run dev`                   | Build + start                 |
| `npm run build`                 | Kompilasi TypeScript          |
| `npm start`                     | Menjalankan app hasil compile |
| `npm run lint`                  | ESLint (tanpa warning)        |
| `npm run format`                | Format kode via Prettier      |
| `npm test`                      | Menjalankan Vitest            |
| `npm run test:coverage`         | Test + coverage               |
| `npm run release:notes:preview` | Preview release notes         |

Quality gate yang disarankan sebelum rilis:

```bash
npm run build && npm run lint && npm test
```

## Operasional dan Keamanan

- Jangan commit `.env` atau file berisi kredensial.
- Rotasi token Telegram jika dicurigai bocor.
- Batasi `TELEGRAM_ALLOWED_USER_ID` ke satu akun owner.
- Jalankan server OpenCode di localhost kecuali memang butuh akses remote.
- Gunakan `LOG_LEVEL=debug` saat investigasi issue callback/SSE.

## Troubleshooting

### Bot tidak merespons

- Pastikan `TELEGRAM_ALLOWED_USER_ID` sesuai akun Telegram Anda
- Pastikan token bot valid
- Cek log proses bot untuk auth rejection

### `fetch failed` / server unavailable

- Pastikan `opencode serve` berjalan
- Verifikasi `OPENCODE_API_URL`
- Jika OpenCode pakai auth, cek username/password env

### `/ls` atau `/tree` kosong

- Cek proyek aktif lewat `/status` dan `/projects`
- Gunakan path relatif (contoh `/ls src`, `/tree src`)
- Pastikan proyek aktif sama dengan workspace tempat OpenCode server berjalan

### Daftar `/agent` tidak lengkap

- Daftar agent dikontrol dari konfigurasi OpenCode server
- Jika butuh custom agent, tambahkan dulu di sisi OpenCode

### `/model` tidak menampilkan model

- Tambahkan model ke favorites di OpenCode TUI
- Buka ulang menu `/model` setelah update favorites

## Kontribusi

Ikuti konvensi di `CONTRIBUTING.md` dan `AGENTS.md`.

## Lisensi

[MIT](LICENSE)
