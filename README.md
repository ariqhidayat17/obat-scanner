# ObatScan (Med Scanner)

Aplikasi mobile React Native berbasis Expo untuk memindai label obat, mendeteksi detail obat (komposisi, dosis, indikasi, dll), serta menganalisis interaksi antar obat menggunakan kecerdasan buatan.

Aplikasi ini menggunakan **Hybrid 2-Stage OCR Pipeline**:
1. **Stage 1 (PaddleOCR):** Mengekstrak teks mentah secara lokal di server. Unggul dalam membaca teks kecil, padat, dan miring di kemasan fisik obat.
2. **Stage 2 (Gemini LLM):** Menerjemahkan, merapikan, dan memformat teks mentah menjadi data JSON terstruktur bahasa Indonesia yang mudah dipahami pasien awam.

---

## 🚀 Fitur Utama & Tech Stack

- **Frontend:** React Native (Expo), NativeWind (Tailwind CSS), Expo Router, Expo Camera
- **Backend:** Express, tRPC (Type-safe API communication), Drizzle ORM (MySQL)
- **OCR Engine:** PaddlePaddle & PaddleOCR (Python FastAPI Sidecar Service)
- **AI Processing:** Google Gemini API (Multimodal Parser & Interaction Checker)
- **Language:** TypeScript & Python

---

## 🛡️ Robustness & Fallback Resilience
Aplikasi backend dilengkapi mekanisme **Automated Fallback**:
- Jika Python OCR service offline atau mengalami kegagalan, server backend secara otomatis melakukan fallback dengan langsung mengirim foto ke Google Gemini Vision untuk diproses secara direct. Sistem dijamin robust dan tidak akan crash di sisi user.

---

## 🛠️ Langkah Instalasi & Setup

### 1. Persiapan Backend Node.js
Pastikan Anda menggunakan Node.js (v18 atau lebih baru). Di root direktori project, jalankan:
```bash
npm install
```

### 2. Setup Environment Variables
Buat file `.env` di root direktori project dan isi API key Gemini Anda:
```env
# Google Gemini API Key (Dapatkan di https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIzaSyDmIE78Okam...

# URL sidecar server PaddleOCR
PADDLE_OCR_URL=http://localhost:8001
```

### 3. Setup Python OCR Service (PaddleOCR)
Lakukan pembuatan Virtual Environment Python agar dependensi terisolasi dengan aman. 

> **PENTING (macOS):** PaddlePaddle memerlukan OpenMP runtime. Pastikan Anda menginstal `libomp` menggunakan Homebrew agar python tidak crash:
> ```bash
> brew install libomp
> ```

Langkah pembuatan virtual environment:
```bash
# Membuat virtualenv .venv di dalam direktori ocr-service
python3 -m venv ocr-service/.venv

# Mengaktifkan virtualenv
source ocr-service/.venv/bin/activate

# Menginstall library yang diperlukan (FastAPI, Uvicorn, PaddleOCR, Pillow)
pip install -r ocr-service/requirements.txt
```

Untuk detail lengkap tentang setup, konfigurasi C++ Build Tools Windows, integrasi API, dan panduan troubleshooting mendalam, silakan baca [Dokumentasi Lengkap PaddleOCR Sidecar Service (ocr-service/README.md)](ocr-service/README.md).

---

## 📡 Cara Menjalankan Server (Lokal)

Anda perlu menjalankan dua service ini secara bersamaan. Ada dua cara:

### Cara Praktis: Jalankan Semua Sekaligus
Anda dapat menjalankan backend Node.js, Metro Bundler, dan Python OCR Service secara otomatis dalam satu terminal dengan script helper:
```bash
./start-all-local.sh
```

### Cara Manual (Terminal Terpisah)

#### Terminal 1: Jalankan Python OCR Service
Mengaktifkan OCR engine lokal yang berjalan di port `8001`.
* **Untuk Pengujian Emulator:**
  ```bash
  source ocr-service/.venv/bin/activate
  python ocr-service/main.py
  ```
* **Untuk Pengujian HP Fisik (Menggunakan ngrok):**
  Layanan lokal tidak bisa diakses dari HP fisik di jaringan seluler/Wi-Fi berbeda secara langsung. Gunakan script ngrok untuk membuat tunnel HTTPS:
  ```bash
  cd ocr-service
  chmod +x start-with-ngrok.sh
  ./start-with-ngrok.sh
  ```
  Salin URL HTTPS ngrok yang dihasilkan dan pasang di `.env` sebagai `PADDLE_OCR_URL`.

*(Pada run pertama, server akan otomatis mendownload model deteksi teks resmi dari server Paddle Paddle. Proses download hanya terjadi satu kali).*

#### Terminal 2: Jalankan Backend Node.js & Metro Bundler
Mengaktifkan backend API utama (port `8080`) dan Metro bundler React Native (port `8081`).
```bash
npm run dev
```

---


### Opsi A: Install Langsung ke HP Fisik (Paling Praktis)
1. Sambungkan HP Android Anda ke komputer via kabel USB.
2. Pastikan **Developer Options** dan **USB Debugging** di HP Anda sudah aktif.
3. Kirim file `app-release.apk` ke HP (via share link/kabel), lalu klik file tersebut di HP untuk menginstall.
4. Atau, jika Anda memiliki Android SDK tool (`adb`) terinstall di terminal, jalankan:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

### Opsi B: Install ke Android Emulator
1. Nyalakan emulator Android Anda (via Android Studio).
2. Drag and drop file `app-release.apk` dari Finder/Explorer langsung ke dalam layar emulator.
3. Aplikasi akan terinstall otomatis dan ikon **ObatScan** akan muncul di app drawer emulator.

---

## 📜 Tersedia Perintah Script Lainnya (Node.js)

- `npm run dev`: Menjalankan frontend Metro dan backend API secara bersamaan.
- `npm run test`: Menjalankan unit tests dengan Vitest.
- `npm run format`: Merapikan format penulisan kode menggunakan Prettier.
- `npm run lint`: Memeriksa adanya error/warning penulisan kode dengan ESLint.
