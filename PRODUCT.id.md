# OpenCode Telegram Bridge

Bot klien Telegram untuk OpenCode yang memungkinkan Anda menjalankan dan memantau tugas coding di mesin lokal Anda dari Telegram.

## Konsep

Aplikasi bekerja sebagai jembatan antara Telegram dan server OpenCode yang berjalan secara lokal:

- Anda mengirim prompt dari Telegram
- Bot meneruskannya ke OpenCode
- Aplikasi mendengarkan event SSE OpenCode
- Hasilnya diagregasi dan dikirim kembali dalam format yang ramah Telegram

Tidak diperlukan port inbound publik untuk penggunaan normal.

## Skenario Penggunaan Target

1. Pengguna mengerjakan proyek secara lokal dengan OpenCode (Desktop/TUI).
2. Mereka mengakhiri sesi lokal dan meninggalkan komputer.
3. Kemudian, saat jauh, mereka menjalankan layanan bridge ini dan terhubung via Telegram.
4. Mereka memilih sesi yang ada atau membuat yang baru.
5. Mereka mengirim tugas coding dan menerima pembaruan kemajuan secara berkala.
6. Mereka menerima respons asisten yang sudah selesai di chat dan melanjutkan alur kerja secara asinkron.

## Persyaratan Fungsional

### Manajemen server OpenCode

- Periksa status server OpenCode (berjalan / tidak berjalan)
- Mulai server OpenCode dari aplikasi (`opencode serve`)
- Hentikan server OpenCode dari aplikasi

### Manajemen proyek

- Ambil proyek yang tersedia dari OpenCode API (nama + path)
- Pilih dan ganti proyek
- Simpan proyek yang dipilih antar restart (`settings.json`)

### Manajemen sesi

- Ambil N sesi terakhir (nama + tanggal)
- Pilih dan sambungkan ke sesi yang ada
- Buat sesi baru
- Gunakan judul sesi yang dihasilkan OpenCode (berdasarkan percakapan)

### Penanganan tugas

- Kirim prompt teks ke OpenCode
- Hentikan tugas saat ini (setara ESC)
- Tangani pertanyaan OpenCode dengan opsi inline dan jawaban teks kustom
- Kirim jawaban yang dipilih/kustom kembali ke OpenCode (`question.reply`)
- Tangani permintaan izin secara interaktif (`izinkan sekali` / `selalu` / `tolak`)

### Pengiriman hasil

- Kirim setiap respons asisten yang selesai setelah sinyal selesai dari SSE
- Jangan tampilkan chain-of-thought mentah; kirim indikator thinking yang ringan sebagai gantinya
- Pisah respons panjang menjadi beberapa pesan Telegram
- Kirim pembaruan kode sebagai file (dengan batas ukuran)

### Status sesi di chat

- Pertahankan pesan status yang disematkan di chat
- Tampilkan judul sesi, proyek, model, penggunaan konteks, dan file yang berubah
- Perbarui status secara otomatis dari SSE dan event tool
- Simpan ID pesan yang disematkan antar restart bot

### Keamanan

- Whitelist berdasarkan Telegram user ID (mode pengguna tunggal)
- Abaikan pesan dari pengguna yang tidak diotorisasi

### Konfigurasi

- Token bot Telegram
- Telegram user ID yang diizinkan
- Provider model default dan ID model
- Proyek yang dipilih disimpan di `settings.json`
- Ukuran daftar sesi yang dapat dikonfigurasi (default: 10)
- Locale bot yang dapat dikonfigurasi
- Ukuran file kode maks dalam KB yang dapat dikonfigurasi (default: 100)

## Cakupan Produk Saat Ini

### Perintah bot

Set perintah saat ini:

- [x] `/status` - status server, proyek, dan sesi
- [x] `/new` - buat sesi baru
- [x] `/stop` - hentikan tugas saat ini
- [x] `/sessions` - tampilkan dan ganti sesi terbaru
- [x] `/projects` - tampilkan dan ganti proyek
- [x] `/model` - pilih model
- [x] `/agent` - pilih mode agen
- [x] `/rename` - ubah nama sesi saat ini
- [x] `/opencode_start` - mulai server OpenCode lokal
- [x] `/opencode_stop` - hentikan server OpenCode lokal
- [x] `/help` - tampilkan bantuan perintah

Pesan teks (bukan perintah) diperlakukan sebagai prompt untuk OpenCode, kecuali saat pertanyaan aktif mengharapkan jawaban teks kustom.

### Fitur utama yang sudah diimplementasikan

- [x] Kontrol server OpenCode dan pemeriksaan kesehatan via perintah bot
- [x] Manajemen proyek (daftar/ganti) dengan menu inline
- [x] Manajemen sesi (daftar/ganti/buat) dengan menu inline
- [x] Eksekusi prompt melalui OpenCode dengan penanganan event berbasis SSE
- [x] Alur pertanyaan dan izin interaktif (tombol + jawaban teks kustom)
- [x] Pembaruan status yang disematkan (sesi, proyek, model, penggunaan konteks, file yang berubah)
- [x] Pemilihan model dan agen dari Telegram
- [x] Kontrol konteks/varian dari keyboard Telegram
- [x] Mengirim blok kode sebagai file saat diperlukan
- [x] Model keamanan pengguna tunggal (Telegram user ID yang diizinkan)
- [x] Pengaturan bot persisten (`settings.json`) antar restart
- [x] Struktur lokalisasi EN/RU/ID via file i18n khusus

## Daftar Tugas Saat Ini

Tugas terbuka untuk iterasi mendatang:

- [ ] Tampilkan server MCP, formatter, dan plugin di status/detail bot
- [ ] Konfigurasi tingkat visibilitas untuk thinking dan langkah perantara
- [ ] Tambahkan notifikasi crash server di Telegram
- [ ] Tambahkan pemeriksaan kesehatan berkala dan auto-restart opsional untuk server OpenCode
- [ ] Perbaiki format pesan yang kompatibel dengan Telegram untuk output yang lebih kaya
- [ ] Dukung pengiriman file dari Telegram ke OpenCode (screenshot, dokumen)
- [ ] Sediakan image Docker dan panduan deployment container dasar

## Kemungkinan Peningkatan

Peningkatan opsional atau jangka panjang:

- [ ] Buat proyek OpenCode baru langsung dari Telegram
- [ ] Tambahkan helper penjelajahan file proyek (misalnya, alur `ls` dan `open`)
- [ ] Tingkatkan dukungan untuk alur kerja berbasis git worktree
