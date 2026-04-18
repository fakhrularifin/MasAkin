# 🍳 MasAkin — Asisten Dapur Cerdasmu

MasAkin adalah chatbot AI berbasis web yang membantu pengguna menemukan resep masakan berdasarkan bahan-bahan yang tersedia di dapur, tanpa perlu belanja dulu. Ditenagai oleh **Google Gemini 2.5 Flash Lite** dan dibangun dengan **Node.js + Express**.

---

## Fitur

- **Rekomendasi Resep dari Bahan yang Ada** — Sebutkan bahan di kulkasmu, MasAkin akan menyarankan 2–3 resep beserta langkah memasaknya
- **Efek Mengetik (Typewriter)** — Respons AI ditampilkan secara animasi karakter per karakter layaknya bot sedang mengetik
- **Simpan Resep** — Tombol bookmark muncul di setiap judul resep; resep tersimpan di `localStorage` browser dan bisa dilihat kapan saja dari panel Resep Tersimpan
- **Panel Resep Tersimpan** — Drawer panel yang memuat daftar semua resep yang sudah disimpan, lengkap dengan tombol Lihat (full markdown) dan Hapus
- **Input Bahan Baru** — Tombol reset percakapan tanpa menghapus resep yang sudah tersimpan
- **Quick Reply Chips** — Preset bahan populer untuk langsung mencoba chatbot
- **Shift+Enter = Baris Baru** — Input area mendukung multi-baris; tekan `Shift+Enter` untuk newline, `Enter` untuk mengirim
- **Desain Responsif** — Tampilan penuh di mobile (≤480px)

---

## Tech Stack

| Layer    | Teknologi                                      |
| -------- | ---------------------------------------------- |
| Backend  | Node.js, Express 5                             |
| AI Model | Google Gemini 2.5 Flash Lite (`@google/genai`) |
| Frontend | Vanilla JS, HTML, CSS                          |
| Markdown | `marked.js` (CDN)                              |
| Icons    | Font Awesome 6                                 |
| Font     | Fraunces + Nunito (Google Fonts)               |
| Storage  | `localStorage` (resep tersimpan)               |

---

## Struktur Proyek

```
MasAkin/
├── index.js          # Express server + Gemini API proxy
├── package.json
├── .env              # GEMINI_API_KEY (tidak di-commit)
└── public/
    ├── index.html    # Antarmuka chat
    ├── script.js     # Logika frontend (chat, simpan resep, reset)
    ├── style.css     # Styling & animasi
    └── favicon.ico   # Ikon browser
```

---

## Cara Menjalankan

### 1. Clone & Install

```bash
git clone <repo-url>
cd MasAkin
npm install
```

### 2. Buat file `.env`

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Dapatkan API key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Jalankan Server

```bash
node index.js
```

Atau dengan auto-reload saat development:

```bash
npx nodemon index.js
```

### 4. Buka di Browser

```
http://localhost:3000
```

---

## Cara Pakai

1. Ketik bahan-bahan yang ada di dapur kamu (contoh: _"ada telur, nasi sisa, dan sosis"_)
2. Tekan **Enter** atau klik tombol kirim
3. MasAkin akan membalas dengan rekomendasi resep beserta langkah-langkahnya
4. Klik ikon **bookmark** di judul resep untuk menyimpannya
5. Klik ikon **bookmark** di header untuk membuka panel Resep Tersimpan
6. Gunakan tombol **↺** di header untuk reset percakapan dan input bahan baru

---

## Environment Variables

| Variable         | Keterangan                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `GEMINI_API_KEY` | API key Google Gemini (wajib)                                     |
| `CORS_ORIGIN`    | Origin yang diizinkan untuk CORS (opsional, default: same-origin) |
