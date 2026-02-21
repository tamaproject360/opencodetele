import type { I18nDictionary } from "./en.js";

export const id: I18nDictionary = {
  "cmd.description.status": "Status server dan sesi",
  "cmd.description.new": "Buat sesi baru",
  "cmd.description.stop": "Hentikan tindakan saat ini",
  "cmd.description.sessions": "Daftar sesi",
  "cmd.description.projects": "Daftar proyek",
  "cmd.description.model": "Pilih model",
  "cmd.description.agent": "Pilih mode kerja",
  "cmd.description.language": "Ganti bahasa",
  "cmd.description.opencode_start": "Mulai server OpenCode",
  "cmd.description.opencode_stop": "Hentikan server OpenCode",
  "cmd.description.help": "Bantuan",

  "callback.unknown_command": "Perintah tidak dikenal",
  "callback.processing_error": "Terjadi kesalahan saat memproses",

  "error.load_agents": "❌ Gagal memuat daftar agen",
  "error.load_models": "❌ Gagal memuat daftar model",
  "error.load_variants": "❌ Gagal memuat daftar varian",
  "error.context_button": "❌ Gagal memproses tombol konteks",
  "error.generic": "🔴 Terjadi kesalahan.",

  "common.unknown": "tidak diketahui",
  "common.unknown_error": "kesalahan tidak diketahui",

  "start.welcome":
    "👋 Selamat datang di OpenCode Telegram Bot!\n\nGunakan perintah:\n/projects — pilih proyek\n/sessions — daftar sesi\n/new — sesi baru\n/agent — ganti mode\n/model — pilih model\n/status — status\n/help — bantuan",
  "help.text":
    "📖 **Bantuan**\n\n/status - Periksa status server\n/sessions - Daftar sesi\n/new - Buat sesi baru\n/help - Bantuan",

  "bot.thinking": "💭 Sedang berpikir...",
  "bot.event_stream_disconnected":
    "⚠️ Koneksi ke server OpenCode terputus.\\n\\nGagal menyambung kembali ke event stream. Gunakan /status untuk memeriksa server atau /opencode_start untuk memulai ulang.",

  "health.server_unreachable":
    "🔴 Server OpenCode tidak merespons.\\n\\nPemeriksaan kesehatan gagal beberapa kali. Gunakan /status untuk diagnosis atau /opencode_start untuk memulai ulang server.",
  "health.server_recovered": "✅ Server OpenCode kembali online.",
  "bot.project_not_selected":
    "🏗 Proyek belum dipilih.\n\nPilih proyek terlebih dahulu dengan /projects.",
  "bot.creating_session": "🔄 Membuat sesi baru...",
  "bot.create_session_error":
    "🔴 Gagal membuat sesi. Coba /new atau periksa status server dengan /status.",
  "bot.session_created": "✅ Sesi dibuat: {title}",
  "bot.session_busy":
    "⏳ Agen sedang menjalankan tugas. Tunggu sampai selesai atau gunakan /stop untuk menghentikan.",
  "bot.session_reset_project_mismatch":
    "⚠️ Sesi aktif tidak cocok dengan proyek yang dipilih, sehingga sesi direset. Gunakan /sessions untuk memilih atau /new untuk membuat sesi baru.",
  "bot.prompt_send_error_detailed": "🔴 Gagal mengirim permintaan.\n\nDetail: {details}",
  "bot.prompt_send_error": "🔴 Terjadi kesalahan saat mengirim permintaan ke OpenCode.",

  "status.header_running": "🟢 **Server OpenCode berjalan**",
  "status.health.healthy": "Sehat",
  "status.health.unhealthy": "Tidak Sehat",
  "status.line.health": "Status: {health}",
  "status.line.version": "Versi: {version}",
  "status.line.managed_yes": "Dikelola oleh bot: Ya",
  "status.line.managed_no": "Dikelola oleh bot: Tidak",
  "status.line.pid": "PID: {pid}",
  "status.line.uptime_sec": "Uptime: {seconds} detik",
  "status.line.mode": "Mode: {mode}",
  "status.line.model": "Model: {model}",
  "status.agent_not_set": "belum diatur",
  "status.project_selected": "🏗 Proyek: {project}",
  "status.project_not_selected": "🏗 Proyek: belum dipilih",
  "status.project_hint": "Gunakan /projects untuk memilih proyek",
  "status.session_selected": "📋 Sesi saat ini: {title}",
  "status.session_not_selected": "📋 Sesi saat ini: belum dipilih",
  "status.session_hint": "Gunakan /sessions untuk memilih atau /new untuk membuat baru",
  "status.server_unavailable":
    "🔴 Server OpenCode tidak tersedia\\n\\nGunakan /opencode_start untuk memulai server.",

  "status.mcp.section": "Server MCP ({count}):",
  "status.mcp.item_connected": "  ✅ {name}",
  "status.mcp.item_disabled": "  ⏸ {name} (dinonaktifkan)",
  "status.mcp.item_needs_auth": "  🔑 {name} (perlu autentikasi)",
  "status.mcp.item_failed": "  ❌ {name}: {error}",
  "status.mcp.none": "Server MCP: tidak ada",
  "status.formatters.section": "Formatter ({count}):",
  "status.formatters.item": "  • {name} ({extensions})",
  "status.formatters.none": "Formatter: tidak ada",

  "projects.empty":
    "📭 Tidak ada proyek ditemukan.\n\nBuka direktori di OpenCode dan buat setidaknya satu sesi, kemudian akan muncul di sini.",
  "projects.select": "Pilih proyek:",
  "projects.select_with_current": "Pilih proyek:\n\nSaat ini: 🏗 {project}",
  "projects.fetch_error":
    "🔴 Server OpenCode tidak tersedia atau terjadi kesalahan saat memuat proyek.",
  "projects.selected":
    "✅ Proyek dipilih: {project}\n\n📋 Sesi direset. Gunakan /sessions atau /new untuk proyek ini.",
  "projects.select_error": "🔴 Gagal memilih proyek.",

  "sessions.project_not_selected":
    "🏗 Proyek belum dipilih.\n\nPilih proyek terlebih dahulu dengan /projects.",
  "sessions.empty": "📭 Tidak ada sesi ditemukan.\n\nBuat sesi baru dengan /new.",
  "sessions.select": "Pilih sesi:",
  "sessions.fetch_error":
    "🔴 Server OpenCode tidak tersedia atau terjadi kesalahan saat memuat sesi.",
  "sessions.select_project_first": "🔴 Proyek belum dipilih. Gunakan /projects.",
  "sessions.loading_context": "⏳ Memuat konteks dan pesan terbaru...",
  "sessions.selected": "✅ Sesi dipilih: {title}",
  "sessions.select_error": "🔴 Gagal memilih sesi.",
  "sessions.preview.empty": "Tidak ada pesan terbaru.",
  "sessions.preview.title": "Pesan terbaru:",
  "sessions.preview.you": "Anda:",
  "sessions.preview.agent": "Agen:",

  "new.project_not_selected":
    "🏗 Proyek belum dipilih.\n\nPilih proyek terlebih dahulu dengan /projects.",
  "new.created": "✅ Sesi baru dibuat: {title}",
  "new.create_error": "🔴 Server OpenCode tidak tersedia atau terjadi kesalahan saat membuat sesi.",

  "stop.no_active_session":
    "🛑 Agen belum dijalankan\n\nBuat sesi dengan /new atau pilih satu via /sessions.",
  "stop.in_progress":
    "🛑 Aliran event dihentikan, mengirim sinyal abort...\n\nMenunggu agen berhenti.",
  "stop.warn_unconfirmed":
    "⚠️ Aliran event dihentikan, tetapi server tidak mengonfirmasi abort.\n\nPeriksa /status dan coba /stop lagi dalam beberapa detik.",
  "stop.warn_maybe_finished": "⚠️ Aliran event dihentikan, tetapi agen mungkin sudah selesai.",
  "stop.success": "✅ Tindakan agen dihentikan. Tidak ada pesan lagi dari sesi ini.",
  "stop.warn_still_busy":
    "⚠️ Sinyal terkirim, tetapi agen masih sibuk.\n\nAliran event sudah dinonaktifkan, sehingga tidak ada pesan perantara yang dikirim.",
  "stop.warn_timeout":
    "⚠️ Timeout permintaan abort.\n\nAliran event sudah dinonaktifkan, coba /stop lagi dalam beberapa detik.",
  "stop.warn_local_only":
    "⚠️ Aliran event dihentikan secara lokal, tetapi abort di sisi server gagal.",
  "stop.error": "🔴 Gagal menghentikan tindakan.\n\nAliran event dihentikan, coba /stop lagi.",

  "opencode_start.already_running_managed":
    "⚠️ Server OpenCode sudah berjalan\n\nPID: {pid}\nUptime: {seconds} detik",
  "opencode_start.already_running_external":
    "✅ Server OpenCode sudah berjalan sebagai proses eksternal\n\nVersi: {version}\n\nServer ini tidak dijalankan oleh bot, sehingga /opencode_stop tidak dapat menghentikannya.",
  "opencode_start.starting": "🔄 Memulai Server OpenCode...",
  "opencode_start.start_error":
    "🔴 Gagal memulai Server OpenCode\n\nKesalahan: {error}\n\nPastikan OpenCode CLI terinstal dan tersedia di PATH:\n`opencode --version`\n`npm install -g @opencode-ai/cli`",
  "opencode_start.started_not_ready":
    "⚠️ Server OpenCode dimulai, tetapi tidak merespons\n\nPID: {pid}\n\nServer mungkin masih dalam proses start. Coba /status dalam beberapa detik.",
  "opencode_start.success": "✅ Server OpenCode berhasil dimulai\n\nPID: {pid}\nVersi: {version}",
  "opencode_start.error":
    "🔴 Terjadi kesalahan saat memulai server.\n\nPeriksa log aplikasi untuk detail.",
  "opencode_stop.external_running":
    "⚠️ Server OpenCode berjalan sebagai proses eksternal\n\nServer ini tidak dijalankan via /opencode_start.\nHentikan secara manual atau gunakan /status untuk memeriksa status.",
  "opencode_stop.not_running": "⚠️ Server OpenCode tidak berjalan",
  "opencode_stop.stopping": "🛑 Menghentikan Server OpenCode...\n\nPID: {pid}",
  "opencode_stop.stop_error": "🔴 Gagal menghentikan Server OpenCode\n\nKesalahan: {error}",
  "opencode_stop.success": "✅ Server OpenCode berhasil dihentikan",
  "opencode_stop.error":
    "🔴 Terjadi kesalahan saat menghentikan server.\n\nPeriksa log aplikasi untuk detail.",

  "agent.changed_callback": "Mode diubah: {name}",
  "agent.changed_message": "✅ Mode diubah menjadi: {name}",
  "agent.change_error_callback": "Gagal mengubah mode",
  "agent.menu.current": "Mode saat ini: {name}\n\nPilih mode:",
  "agent.menu.select": "Pilih mode kerja:",

  "language.menu.current": "Bahasa saat ini: {name}\n\nPilih bahasa:",
  "language.menu.error": "🔴 Gagal memuat menu bahasa",
  "language.changed_callback": "Bahasa diubah: {name}",
  "language.changed_message": "✅ Bahasa diubah menjadi: {name}",

  "model.changed_callback": "Model diubah: {name}",
  "model.changed_message": "✅ Model diubah menjadi: {name}",
  "model.change_error_callback": "Gagal mengubah model",
  "model.menu.empty": "⚠️ Tidak ada model yang tersedia",
  "model.menu.current": "Model saat ini: {name}\n\nPilih model:",
  "model.menu.error": "🔴 Gagal mendapatkan daftar model",

  "variant.model_not_selected_callback": "Kesalahan: model belum dipilih",
  "variant.changed_callback": "Varian diubah: {name}",
  "variant.changed_message": "✅ Varian diubah menjadi: {name}",
  "variant.change_error_callback": "Gagal mengubah varian",
  "variant.select_model_first": "⚠️ Pilih model terlebih dahulu",
  "variant.menu.empty": "⚠️ Tidak ada varian yang tersedia",
  "variant.menu.current": "Varian saat ini: {name}\n\nPilih varian:",
  "variant.menu.error": "🔴 Gagal mendapatkan daftar varian",

  "context.button.confirm": "✅ Ya, kompres konteks",
  "context.button.cancel": "❌ Batal",
  "context.no_active_session": "⚠️ Tidak ada sesi aktif. Buat sesi dengan /new",
  "context.confirm_text":
    '📊 Kompresi konteks untuk sesi "{title}"\n\nIni akan mengurangi penggunaan konteks dengan menghapus pesan lama dari riwayat. Tugas saat ini tidak akan terganggu.\n\nLanjutkan?',
  "context.callback_session_not_found": "Sesi tidak ditemukan",
  "context.callback_compacting": "Mengompres konteks...",
  "context.progress": "⏳ Mengompres konteks...",
  "context.error": "❌ Kompresi konteks gagal",
  "context.success": "✅ Konteks berhasil dikompres",
  "context.callback_cancelled": "Dibatalkan",

  "permission.inactive_callback": "Permintaan izin tidak aktif",
  "permission.processing_error_callback": "Kesalahan saat memproses",
  "permission.no_active_request_callback": "Kesalahan: tidak ada permintaan aktif",
  "permission.reply.once": "Diizinkan sekali",
  "permission.reply.always": "Selalu diizinkan",
  "permission.reply.reject": "Ditolak",
  "permission.send_reply_error": "❌ Gagal mengirim balasan izin",
  "permission.header": "{emoji} **Permintaan izin: {name}**\n\n",
  "permission.button.allow": "✅ Izinkan",
  "permission.button.always": "🔓 Selalu",
  "permission.button.reject": "❌ Tolak",
  "permission.name.bash": "Bash",
  "permission.name.edit": "Edit",
  "permission.name.write": "Tulis",
  "permission.name.read": "Baca",
  "permission.name.webfetch": "Ambil Web",
  "permission.name.websearch": "Cari Web",
  "permission.name.glob": "Cari File",
  "permission.name.grep": "Cari Konten",
  "permission.name.list": "Daftar Direktori",
  "permission.name.task": "Tugas",
  "permission.name.lsp": "LSP",

  "question.inactive_callback": "Polling tidak aktif",
  "question.processing_error_callback": "Kesalahan saat memproses",
  "question.select_one_required_callback": "Pilih setidaknya satu opsi",
  "question.enter_custom_callback": "Kirim jawaban kustom Anda sebagai pesan",
  "question.cancelled": "❌ Polling dibatalkan",
  "question.answer_already_received": "Jawaban sudah diterima, harap tunggu...",
  "question.completed_no_answers": "✅ Polling selesai (tanpa jawaban)",
  "question.no_active_project": "❌ Tidak ada proyek aktif",
  "question.no_active_request": "❌ Tidak ada permintaan aktif",
  "question.send_answers_error": "❌ Gagal mengirim jawaban ke agen",
  "question.multi_hint": "\n*Anda dapat memilih beberapa opsi*",
  "question.button.submit": "✅ Selesai",
  "question.button.custom": "🔤 Jawaban kustom",
  "question.button.cancel": "❌ Batal",
  "question.summary.title": "✅ Polling selesai!\n\n",
  "question.summary.question": "Pertanyaan {index}:\n{question}\n\n",
  "question.summary.answer": "Jawaban:\n{answer}\n\n",

  "keyboard.agent_mode": "{emoji} Mode {name}",
  "keyboard.context": "📊 {used} / {limit} ({percent}%)",
  "keyboard.context_empty": "📊 0",
  "keyboard.variant": "💭 {name}",
  "keyboard.variant_default": "💡 Default",
  "keyboard.updated": "⌨️ Keyboard diperbarui",

  "pinned.default_session_title": "sesi baru",
  "pinned.unknown": "Tidak diketahui",
  "pinned.line.project": "Proyek: {project}",
  "pinned.line.model": "Model: {model}",
  "pinned.line.context": "Konteks: {used} / {limit} ({percent}%)",
  "pinned.files.title": "File ({count}):",
  "pinned.files.item": "  {path}{diff}",
  "pinned.files.more": "  ... dan {count} lainnya",

  "tool.todo.overflow": "*({count} tugas lagi)*",
  "tool.file_header.write":
    "Tulis File/Path: {path}\n============================================================\n\n",
  "tool.file_header.edit":
    "Edit File/Path: {path}\n============================================================\n\n",

  "runtime.wizard.ask_token": "Masukkan token bot Telegram (dapatkan dari @BotFather).\n> ",
  "runtime.wizard.token_required": "Token wajib diisi. Silakan coba lagi.\n",
  "runtime.wizard.token_invalid":
    "Token terlihat tidak valid (format yang diharapkan <id>:<secret>). Silakan coba lagi.\n",
  "runtime.wizard.ask_user_id":
    "Masukkan Telegram User ID Anda (bisa didapat dari @userinfobot).\n> ",
  "runtime.wizard.user_id_invalid": "Masukkan bilangan bulat positif (> 0).\n",
  "runtime.wizard.ask_api_url":
    "Masukkan URL OpenCode API (opsional).\nTekan Enter untuk menggunakan default: {defaultUrl}\n> ",
  "runtime.wizard.api_url_invalid":
    "Masukkan URL yang valid (http/https) atau tekan Enter untuk default.\n",
  "runtime.wizard.start": "Memulai wizard pengaturan pertama untuk OpenCode Telegram Bot.\n",
  "runtime.wizard.saved": "Konfigurasi tersimpan:\n- {envPath}\n- {settingsPath}\n",
  "runtime.wizard.not_configured_starting": "Aplikasi belum dikonfigurasi. Memulai wizard...\n",
  "runtime.wizard.tty_required":
    "Wizard interaktif membutuhkan terminal TTY. Jalankan `opencode-telegram config` di shell interaktif.",

  "rename.no_session": "⚠️ Tidak ada sesi aktif. Buat atau pilih sesi terlebih dahulu.",
  "rename.prompt": "📝 Masukkan judul baru untuk sesi:\n\nSaat ini: {title}",
  "rename.empty_title": "⚠️ Judul tidak boleh kosong.",
  "rename.success": "✅ Sesi diubah namanya menjadi: {title}",
  "rename.error": "🔴 Gagal mengubah nama sesi.",
  "rename.cancelled": "❌ Pengubahan nama dibatalkan.",
  "rename.button.cancel": "❌ Batal",

  "file_upload.queued":
    "📎 File antri: {filename}\\n\\nKirim pesanmu dan saya akan menyertakannya sebagai konteks untuk OpenCode.",
  "file_upload.download_error": "❌ Gagal mengunduh file. Silakan coba lagi.",

  "cmd.description.rename": "Ubah nama sesi saat ini",

  "cli.usage":
    "Penggunaan:\n  opencode-telegram [start] [--mode sources|installed]\n  opencode-telegram status\n  opencode-telegram stop\n  opencode-telegram config\n\nCatatan:\n  - Tanpa perintah, default ke `start`\n  - `--mode` saat ini hanya didukung untuk `start`",
  "cli.placeholder.status":
    "Perintah `status` saat ini adalah placeholder. Pemeriksaan status nyata akan ditambahkan di lapisan service (Fase 5).",
  "cli.placeholder.stop":
    "Perintah `stop` saat ini adalah placeholder. Penghentian proses latar belakang nyata akan ditambahkan di lapisan service (Fase 5).",
  "cli.placeholder.unavailable": "Perintah tidak tersedia.",
  "cli.error.prefix": "CLI error: {message}",
  "cli.args.unknown_command": "Perintah tidak dikenal: {value}",
  "cli.args.mode_requires_value": "Opsi --mode membutuhkan nilai: sources|installed",
  "cli.args.invalid_mode": "Nilai --mode tidak valid: {value}. Yang diharapkan: sources|installed",
  "cli.args.unknown_option": "Opsi tidak dikenal: {value}",
  "cli.args.mode_only_start": "Opsi --mode hanya didukung untuk perintah start",

  "legacy.models.fetch_error":
    "🔴 Gagal mendapatkan daftar model. Periksa status server dengan /status.",
  "legacy.models.empty": "📋 Tidak ada model yang tersedia. Konfigurasi provider di OpenCode.",
  "legacy.models.header": "📋 **Model yang tersedia:**\n\n",
  "legacy.models.no_provider_models": "  ⚠️ Tidak ada model yang tersedia\n",
  "legacy.models.env_hint": "💡 Untuk menggunakan model di .env:\n",
  "legacy.models.error": "🔴 Terjadi kesalahan saat memuat daftar model.",

  "cmd.description.newproject": "Buka direktori sebagai proyek",
  "cmd.description.ls": "Daftar file di direktori proyek",
  "cmd.description.tree": "Tampilkan pohon direktori proyek",

  "newproject.usage":
    "Penggunaan: /newproject <path>\n\nContoh:\n`/newproject /home/user/my-project`\n\nMembuka direktori sebagai proyek OpenCode dan menjadikannya proyek aktif.",
  "newproject.checking": "🔄 Membuka proyek di: `{path}`...",
  "newproject.success":
    "✅ Proyek dibuka: **{project}**\n\nSesi direset. Gunakan /sessions atau /new untuk proyek ini.",
  "newproject.error":
    "🔴 Gagal membuka proyek di: `{path}`\n\nPastikan path ada dan server OpenCode berjalan.",

  "ls.project_not_selected":
    "🏗 Proyek belum dipilih.\n\nPilih proyek terlebih dahulu dengan /projects.",
  "ls.empty": "📭 Tidak ada file di: `{path}`",
  "ls.header": "📂 **`{path}`**\n\n",
  "ls.item_dir": "📁 {name}/",
  "ls.item_file": "📄 {name}",
  "ls.item_ignored": "  _(diabaikan)_",
  "ls.more": "\n_...dan {count} item lainnya_",
  "ls.error": "🔴 Gagal mendaftar file.\n\nPastikan path ada.",
  "ls.not_found": "🔴 Path tidak ditemukan: `{path}`",

  "tree.project_not_selected":
    "🏗 Proyek belum dipilih.\n\nPilih proyek terlebih dahulu dengan /projects.",
  "tree.header": "🌲 **Pohon: `{path}`**\n\n",
  "tree.empty": "📭 Tidak ada file di: `{path}`",
  "tree.error": "🔴 Gagal mendapatkan pohon direktori.\n\nPastikan path ada.",

  "status.worktrees.section": "Worktrees ({count}):",
  "status.worktrees.item": "  🌿 {name} — `{branch}` (`{directory}`)",
  "status.worktrees.none": "Worktrees: tidak ada",
  "status.vcs.branch": "Branch: `{branch}`",
};
