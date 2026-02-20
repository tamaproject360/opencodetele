# OpenCode Telegram Bot

[![npm version](https://img.shields.io/npm/v/@grinev/opencode-telegram-bot)](https://www.npmjs.com/package/@grinev/opencode-telegram-bot)
[![CI](https://github.com/grinev/opencode-telegram-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/grinev/opencode-telegram-bot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

Kendalikan agen coding [OpenCode](https://opencode.ai) Anda dari ponsel. Kirim tugas, ganti model, pantau kemajuan — semuanya melalui Telegram.

Tidak ada port terbuka, tidak ada API yang terekspos. Bot berjalan di mesin Anda bersama OpenCode dan berkomunikasi secara eksklusif melalui Telegram Bot API.

<p align="center">
  <img src="assets/Screenshot-1.png" width="32%" alt="Mengirim tugas coding dan menerima hasil edit file" />
  <img src="assets/Screenshot-2.png" width="32%" alt="Status sesi langsung dengan penggunaan konteks dan file yang berubah" />
  <img src="assets/Screenshot-3.png" width="32%" alt="Mengganti model AI dari favorit" />
</p>

## Fitur

- **Coding jarak jauh** — kirim prompt ke OpenCode dari mana saja, terima hasil lengkap dengan kode yang dikirim sebagai file
- **Manajemen sesi** — buat sesi baru atau lanjutkan yang sudah ada, seperti di TUI
- **Status langsung** — pesan yang disematkan dengan proyek saat ini, model, penggunaan konteks, dan daftar file yang berubah, diperbarui secara real time
- **Ganti model** — pilih model apa pun dari favorit OpenCode Anda langsung di chat
- **Mode agen** — beralih antara mode Plan dan Build dengan cepat
- **Tanya jawab interaktif** — jawab pertanyaan agen dan setujui izin melalui tombol inline
- **Kontrol konteks** — kompres konteks saat sudah terlalu besar, langsung dari chat
- **Keamanan** — whitelist user ID yang ketat; tidak ada orang lain yang dapat mengakses bot Anda, bahkan jika mereka menemukannya
- **Lokalisasi** — antarmuka Bahasa Inggris, Rusia, dan Indonesia (`BOT_LOCALE=en|ru|id`)

## Prasyarat

- **Node.js 20+** — [unduh](https://nodejs.org)
- **OpenCode** — instal dari [opencode.ai](https://opencode.ai) atau [GitHub](https://github.com/sst/opencode)
- **Bot Telegram** — Anda akan membuatnya saat setup (butuh 1 menit)

## Mulai Cepat

### 1. Buat Bot Telegram

1. Buka [@BotFather](https://t.me/BotFather) di Telegram dan kirim `/newbot`
2. Ikuti petunjuk untuk memilih nama dan username
3. Salin **token bot** yang Anda terima (misal `123456:ABC-DEF1234...`)

Anda juga membutuhkan **Telegram User ID** — kirim pesan apa pun ke [@userinfobot](https://t.me/userinfobot) dan ia akan membalas dengan ID numerik Anda.

### 2. Mulai Server OpenCode

Di direktori proyek Anda, mulai server OpenCode:

```bash
opencode serve
```

> Bot terhubung ke OpenCode API di `http://localhost:4096` secara default.

### 3. Instal & Jalankan

Cara tercepat — jalankan langsung dengan `npx`:

```bash
npx @grinev/opencode-telegram-bot
```

Pada peluncuran pertama, wizard interaktif akan memandu Anda melalui konfigurasi — akan meminta token bot, user ID, dan URL OpenCode API. Setelah itu, Anda siap. Buka bot di Telegram dan mulai kirim tugas.

#### Alternatif: Instalasi Global

```bash
npm install -g @grinev/opencode-telegram-bot
opencode-telegram start
```

Untuk mengkonfigurasi ulang kapan saja:

```bash
opencode-telegram config
```

## Platform yang Didukung

| Platform | Status                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS    | Didukung penuh                                                                                                                                    |
| Windows  | Didukung penuh                                                                                                                                    |
| Linux    | Eksperimental — seharusnya berfungsi, tetapi belum diuji secara menyeluruh. Anda mungkin perlu langkah tambahan seperti memberikan izin eksekusi. |

## Perintah Bot

| Perintah          | Deskripsi                                               |
| ----------------- | ------------------------------------------------------- |
| `/status`         | Kesehatan server, proyek saat ini, info sesi, dan model |
| `/new`            | Buat sesi baru                                          |
| `/stop`           | Hentikan tugas saat ini                                 |
| `/sessions`       | Jelajahi dan beralih antara sesi terbaru                |
| `/projects`       | Beralih antara proyek OpenCode                          |
| `/model`          | Pilih model dari favorit Anda                           |
| `/agent`          | Ganti mode agen (Plan / Build)                          |
| `/rename`         | Ubah nama sesi saat ini                                 |
| `/opencode_start` | Mulai server OpenCode dari jarak jauh                   |
| `/opencode_stop`  | Hentikan server OpenCode dari jarak jauh                |
| `/help`           | Tampilkan perintah yang tersedia                        |

Setiap pesan teks biasa dikirim sebagai prompt ke agen coding.

> `/opencode_start` dan `/opencode_stop` dimaksudkan sebagai perintah darurat — misalnya, jika Anda perlu memulai ulang server yang macet saat jauh dari komputer. Dalam penggunaan normal, mulai `opencode serve` sendiri sebelum menjalankan bot.

## Konfigurasi

### Variabel Lingkungan

Saat diinstal via npm, wizard konfigurasi menangani pengaturan awal. File `.env` disimpan di direktori data aplikasi platform Anda:

- **macOS:** `~/Library/Application Support/opencode-telegram-bot/.env`
- **Windows:** `%APPDATA%\opencode-telegram-bot\.env`
- **Linux:** `~/.config/opencode-telegram-bot/.env`

| Variabel                   | Deskripsi                                           | Wajib | Default                 |
| -------------------------- | --------------------------------------------------- | :---: | ----------------------- |
| `TELEGRAM_BOT_TOKEN`       | Token bot dari @BotFather                           |  Ya   | —                       |
| `TELEGRAM_ALLOWED_USER_ID` | User ID Telegram numerik Anda                       |  Ya   | —                       |
| `TELEGRAM_PROXY_URL`       | URL Proxy untuk Telegram API (SOCKS5/HTTP)          | Tidak | —                       |
| `OPENCODE_API_URL`         | URL server OpenCode                                 | Tidak | `http://localhost:4096` |
| `OPENCODE_SERVER_USERNAME` | Username autentikasi server                         | Tidak | `opencode`              |
| `OPENCODE_SERVER_PASSWORD` | Password autentikasi server                         | Tidak | —                       |
| `OPENCODE_MODEL_PROVIDER`  | Provider model default                              |  Ya   | `opencode`              |
| `OPENCODE_MODEL_ID`        | ID model default                                    |  Ya   | `big-pickle`            |
| `BOT_LOCALE`               | Bahasa antarmuka bot (`en`, `ru`, atau `id`)        | Tidak | `en`                    |
| `SESSIONS_LIST_LIMIT`      | Maks sesi yang ditampilkan di `/sessions`           | Tidak | `10`                    |
| `CODE_FILE_MAX_SIZE_KB`    | Ukuran file maks (KB) untuk dikirim sebagai dokumen | Tidak | `100`                   |
| `LOG_LEVEL`                | Level log (`debug`, `info`, `warn`, `error`)        | Tidak | `info`                  |

> **Jaga file `.env` Anda tetap privat.** File ini berisi token bot Anda. Jangan pernah commit ke version control.

### Konfigurasi Model

Bot mengambil **model favorit** Anda dari OpenCode. Untuk menambahkan model ke favorit:

1. Buka OpenCode TUI (`opencode`)
2. Pergi ke pemilihan model
3. Arahkan kursor ke model yang Anda inginkan dan tekan **Ctrl+F** untuk menambahkannya ke favorit

Favorit ini akan muncul di menu perintah `/model` di Telegram.

Model gratis (`opencode/big-pickle`) dikonfigurasi sebagai fallback default — jika Anda belum menyiapkan favorit apapun, bot akan menggunakannya secara otomatis.

## Keamanan

Bot menerapkan **whitelist user ID** yang ketat. Hanya pengguna Telegram yang ID numeriknya sesuai dengan `TELEGRAM_ALLOWED_USER_ID` yang dapat berinteraksi dengan bot. Pesan dari pengguna lain diabaikan secara diam-diam dan dicatat sebagai percobaan akses tidak sah.

Karena bot berjalan secara lokal di mesin Anda dan terhubung ke server OpenCode lokal Anda, tidak ada permukaan serangan eksternal di luar Telegram Bot API itu sendiri.

## Pengembangan

### Menjalankan dari Sumber

```bash
git clone https://github.com/grinev/opencode-telegram-bot.git
cd opencode-telegram-bot
npm install
cp .env.example .env
# Edit .env dengan token bot, user ID, dan pengaturan model Anda
```

Build dan jalankan:

```bash
npm run dev
```

### Script yang Tersedia

| Script                          | Deskripsi                                     |
| ------------------------------- | --------------------------------------------- |
| `npm run dev`                   | Build dan mulai (pengembangan)                |
| `npm run build`                 | Kompilasi TypeScript                          |
| `npm start`                     | Jalankan kode yang sudah dikompilasi          |
| `npm run release:notes:preview` | Pratinjau catatan rilis yang dibuat otomatis  |
| `npm run lint`                  | Pemeriksaan ESLint (kebijakan nol peringatan) |
| `npm run format`                | Format kode dengan Prettier                   |
| `npm test`                      | Jalankan tes (Vitest)                         |
| `npm run test:coverage`         | Tes dengan laporan cakupan                    |

> **Catatan:** Tidak ada file watcher atau auto-restart yang digunakan. Bot mempertahankan koneksi SSE dan long-polling yang persisten — restart otomatis akan memutusnya di tengah tugas. Setelah membuat perubahan, restart secara manual dengan `npm run dev`.

## Pemecahan Masalah

**Bot tidak merespons pesan**

- Pastikan `TELEGRAM_ALLOWED_USER_ID` sesuai dengan Telegram user ID Anda yang sebenarnya (periksa dengan [@userinfobot](https://t.me/userinfobot))
- Verifikasi token bot sudah benar

**"Server OpenCode tidak tersedia"**

- Pastikan `opencode serve` berjalan di direktori proyek Anda
- Periksa bahwa `OPENCODE_API_URL` mengarah ke alamat yang benar (default: `http://localhost:4096`)

**Tidak ada model di menu `/model`**

- Tambahkan model ke favorit OpenCode Anda: buka OpenCode TUI, pergi ke pemilihan model, tekan **Ctrl+F** pada model yang diinginkan

**Linux: kesalahan izin ditolak**

- Pastikan binary CLI memiliki izin eksekusi: `chmod +x $(which opencode-telegram)`
- Periksa bahwa direktori konfigurasi dapat ditulis: `~/.config/opencode-telegram-bot/`

## Kontribusi

Ikuti konvensi commit dan catatan rilis di [CONTRIBUTING.md](CONTRIBUTING.md).

## Lisensi

[MIT](LICENSE)
