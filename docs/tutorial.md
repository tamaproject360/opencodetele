# Tutorial: Menjalankan & Menguji opencode-telegram-bot

Panduan ini menjelaskan cara menjalankan bot dari source code (mode development) maupun dari npm (mode production), serta cara menguji fitur pemilihan model yang baru diperbaiki.

---

## Dua Cara Menjalankan

### Cara A — Dari source code (untuk development / testing perubahan)

Digunakan saat Anda sedang mengembangkan atau menguji perubahan kode secara langsung. **Tidak perlu publish ke npm.**

### Cara B — Dari npm (untuk penggunaan sehari-hari / production)

Digunakan jika hanya ingin memakai bot tanpa mengedit kode. Package sudah tersedia di npm registry.

---

## Prasyarat (berlaku untuk kedua cara)

1. **Node.js 20+** — cek dengan `node -v`
2. **OpenCode** — install dari [opencode.ai](https://opencode.ai) dan pastikan perintah `opencode` tersedia
3. **Akun Telegram** dan akses ke [@BotFather](https://t.me/BotFather)

---

## Langkah 1 — Buat Telegram Bot

1. Buka [@BotFather](https://t.me/BotFather) di Telegram, kirim `/newbot`
2. Ikuti instruksi: masukkan nama bot, lalu username bot (harus diakhiri `bot`)
3. Salin **bot token** yang diberikan, contoh: `7123456789:AAF-xxxxxxxxxxxxxxxxxxxx`

Untuk mendapatkan **Telegram User ID** Anda:

- Kirim pesan apa saja ke [@userinfobot](https://t.me/userinfobot)
- Salin angka ID yang ditampilkan, contoh: `123456789`

---

## Langkah 2 — Jalankan OpenCode Server

Di terminal, masuk ke direktori project yang ingin dikerjakan, lalu jalankan:

```bash
opencode serve
```

Server akan berjalan di `http://localhost:4096` secara default. Biarkan terminal ini tetap berjalan.

> Jika port berbeda, catat URL-nya — akan digunakan di konfigurasi nanti.

---

## Cara A — Menjalankan dari Source Code

### A1. Clone dan install dependensi

```bash
git clone https://github.com/grinev/opencode-telegram-bot.git
cd opencode-telegram-bot
npm install
```

### A2. Buat file konfigurasi `.env`

```bash
cp .env.example .env
```

Edit file `.env` dengan teks editor, isi nilai berikut:

```env
TELEGRAM_BOT_TOKEN=7123456789:AAF-xxxxxxxxxxxxxxxxxxxx
TELEGRAM_ALLOWED_USER_ID=123456789

OPENCODE_MODEL_PROVIDER=opencode
OPENCODE_MODEL_ID=big-pickle
```

Nilai opsional yang berguna saat development:

```env
LOG_LEVEL=debug
# OPENCODE_API_URL=http://localhost:4096
```

### A3. Build dan jalankan

```bash
npm run dev
```

Perintah ini akan compile TypeScript lalu menjalankan bot. Jika berhasil, Anda akan melihat log seperti:

```
[INFO] [Bot] Bot started
[INFO] [Bot] Commands initialized for authorized user
```

> Setiap kali ada perubahan kode, hentikan bot (Ctrl+C) lalu jalankan ulang `npm run dev`.

---

## Cara B — Menjalankan dari npm (tanpa clone repo)

### B1. Jalankan langsung dengan npx (paling cepat)

```bash
npx @grinev/opencode-telegram-bot
```

Saat pertama kali, wizard konfigurasi interaktif akan muncul dan menanyakan:

- Bot token
- Telegram User ID
- OpenCode API URL

Konfigurasi disimpan secara otomatis di:

- **Windows:** `%APPDATA%\opencode-telegram-bot\.env`
- **macOS:** `~/Library/Application Support/opencode-telegram-bot/.env`
- **Linux:** `~/.config/opencode-telegram-bot/.env`

### B2. Atau install secara global

```bash
npm install -g @grinev/opencode-telegram-bot
opencode-telegram start
```

Untuk mengubah konfigurasi di kemudian hari:

```bash
opencode-telegram config
```

> **Catatan penting:** Cara B menggunakan versi yang sudah dipublish ke npm. Perubahan kode lokal (seperti perbaikan model selection) **tidak akan aktif** sampai versi baru dipublish. Gunakan Cara A untuk menguji perubahan kode.

---

## Langkah 3 — Verifikasi Bot Berjalan

1. Buka bot Anda di Telegram (cari berdasarkan username yang dibuat tadi)
2. Kirim `/start` — bot harus merespons dengan pesan selamat datang
3. Kirim `/status` — harus menampilkan status koneksi OpenCode

---

## Menguji Fitur Pemilihan Model (yang baru diperbaiki)

Sebelum perbaikan, `/model` hanya menampilkan satu model (dari file favorites lokal OpenCode). Sekarang bot mengambil **semua model** langsung dari API OpenCode.

### Langkah pengujian:

**1. Pastikan OpenCode server berjalan**

```bash
opencode serve
```

**2. Kirim perintah `/model` ke bot**

Bot akan menampilkan inline keyboard berisi semua model yang tersedia, dikelompokkan per provider:

```
Current model: opencode / big-pickle

Select model:
┌─────────────────────────────┐
│     — opencode —            │
├─────────────────────────────┤
│ ✅ big-pickle               │
├─────────────────────────────┤
│     — anthropic —           │
├─────────────────────────────┤
│ claude-opus-4-5             │
│ claude-sonnet-4-5           │
├─────────────────────────────┤
│     — openai —              │
├─────────────────────────────┤
│ gpt-4o                      │
│ ...                         │
└─────────────────────────────┘
```

**3. Verifikasi yang diharapkan:**

- Semua model dari semua provider yang dikonfigurasi di OpenCode tampil
- Model aktif saat ini ditandai dengan ✅
- Tap salah satu model → bot mengonfirmasi pergantian model
- Kirim prompt biasa → OpenCode menggunakan model yang dipilih

**4. Jika model tidak muncul:**

- Cek apakah `opencode serve` sudah berjalan
- Jalankan `/status` untuk melihat koneksi ke server
- Cek log bot — jika `LOG_LEVEL=debug`, akan terlihat apakah API berhasil dipanggil atau jatuh ke fallback

### Fallback behavior

| Kondisi                  | Yang terjadi                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------ |
| API berhasil             | Semua model dari semua provider ditampilkan                                          |
| API gagal / server mati  | Bot membaca file `~/.local/state/opencode/model.json` (favorites OpenCode)           |
| File favorites tidak ada | Bot menggunakan model dari `OPENCODE_MODEL_PROVIDER` + `OPENCODE_MODEL_ID` di `.env` |

---

## Menguji Fitur Lainnya

| Fitur                   | Cara uji                                     |
| ----------------------- | -------------------------------------------- |
| Kirim task              | Ketik teks biasa (bukan command) dan kirim   |
| Buat session baru       | `/new`                                       |
| Lihat sessions          | `/sessions` lalu tap session yang diinginkan |
| Ganti project           | `/projects`                                  |
| Ganti agent mode        | `/agent` (Plan / Build)                      |
| Stop task berjalan      | `/stop`                                      |
| Restart OpenCode server | `/opencode_start` atau `/opencode_stop`      |

---

## Troubleshooting

**Bot tidak merespons sama sekali**

- Pastikan `TELEGRAM_ALLOWED_USER_ID` benar (cek via [@userinfobot](https://t.me/userinfobot))
- Pastikan bot token valid
- Jika menggunakan proxy, pastikan `TELEGRAM_PROXY_URL` dikonfigurasi dengan benar

**"OpenCode server is not available"**

- Jalankan `opencode serve` di terminal terpisah
- Pastikan `OPENCODE_API_URL` mengarah ke alamat yang benar (default: `http://localhost:4096`)

**`/model` menampilkan pesan "No available models"**

- Pastikan `opencode serve` berjalan
- Cek log dengan `LOG_LEVEL=debug` untuk melihat detail error API

**Perubahan kode tidak berlaku (Cara A)**

- Hentikan bot dengan Ctrl+C
- Jalankan ulang `npm run dev`

**Error saat build: TypeScript error**

- Jalankan `npm run build` untuk melihat error spesifik
- Pastikan versi Node.js `>= 20` dengan `node -v`
