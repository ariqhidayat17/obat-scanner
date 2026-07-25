# PaddleOCR Sidecar Service

Layanan ini adalah FastAPI sidecar service yang membungkus engine **PaddleOCR** (Python) untuk melakukan ekstraksi teks mentah (raw text extraction) dari gambar label/kemasan obat secara lokal.

---

## 🛠️ Persyaratan & Ketergantungan Sistem

Layanan ini membutuhkan Python 3.8 - 3.11. Pastikan Anda memiliki dependensi sistem berikut sesuai OS Anda:

### 🍎 macOS
PaddlePaddle memerlukan library **OpenMP** untuk komputasi paralel. Jika tidak ada, Python akan crash saat mengimpor Paddle.
Jalankan perintah ini menggunakan Homebrew:
```bash
brew install libomp
```

### 🪟 Windows
Pastikan Anda telah menginstal **Visual C++ Redistributable** dan build tools untuk Python C++ compiler.

---

## 📦 Langkah Setup & Instalasi

Ikuti langkah-langkah berikut untuk setup virtual environment dan instalasi dependensi di folder `ocr-service`:

```bash
# Masuk ke direktori service
cd ocr-service

# Buat virtual environment (venv)
python3 -m venv .venv

# Aktifkan virtual environment
# Di macOS/Linux:
source .venv/bin/activate
# Di Windows (Command Prompt):
.venv\Scripts\activate.bat
# Di Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Upgrade pip & install package
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🚀 Cara Menjalankan Service

### 1. Mode Lokal Standar
Untuk menjalankan server OCR lokal di port `8001`:
```bash
python main.py
```
*Catatan: Pada pemindaian pertama kali, PaddleOCR akan mengunduh model deteksi (`det`), pengenalan (`rec`), dan klasifikasi (`cls`) resmi dari server PaddlePaddle. Proses ini membutuhkan koneksi internet lancar dan berjalan otomatis.*

### 2. Mode Integrasi HP Fisik (Menggunakan ngrok)
Jika Anda menguji aplikasi langsung menggunakan HP Android/iOS fisik, HP Anda tidak bisa langsung mengakses `localhost:8001` komputer Anda. Oleh karena itu, kita perlu mengekspos port 8001 melalui tunnel HTTPS ngrok.

Jalankan script otomatis ini di folder `ocr-service`:
```bash
./start-with-ngrok.sh
```
Script tersebut akan:
1. Mengaktifkan venv dan memastikan package terinstal.
2. Menjalankan FastAPI di port `8001`.
3. Membuka tunnel ngrok pada port `8001`.
4. Menyediakan HTTPS URL (misal: `https://xxxx.ngrok-free.app`) yang harus disalin ke konfigurasi backend.

---

## 📡 Integrasi Backend & Mekanisme Fallback

### Endpoint API Sidecar
Layanan ini mengekspos endpoint berikut:
- **`GET /health`**: Endpoint pengecekan kesehatan server. Mengembalikan `{"ok": true}`.
- **`POST /ocr`**: Menerima input JSON `{ "imageBase64": "..." }`. Mengembalikan teks mentah hasil ekstraksi dalam bentuk baris-baris teks.

### Mekanisme Resiliensi & Fallback (Robustness)
Integrasi di sisi backend Node.js (`server/_core/paddleOcr.ts` & `server/routers.ts`) didesain dengan prinsip ketahanan tinggi:
1. **Primary Stage (PaddleOCR via ngrok):** Backend mencoba mengirim gambar ke server FastAPI PaddleOCR lokal/ngrok untuk mengekstrak teks mentah terlebih dahulu.
2. **Automated Fallback (Gemini Multimodal Vision):** Jika server PaddleOCR mati, offline, ngrok kedaluwarsa, atau terjadi error dalam proses deteksi, backend akan menangkap (`catch`) error tersebut, mencatat log kegagalan, dan langsung mengirimkan gambar base64 ke Google Gemini Vision secara direct untuk proses OCR sekaligus ekstraksi terstruktur.
3. **LLM Refinement:** Jika PaddleOCR berhasil, teks mentahnya dikirim bersama gambar ke Gemini untuk diformat menjadi JSON terstruktur bahasa Indonesia agar rapi dan mudah dibaca user.

---

## 🔍 Panduan Troubleshooting & Error Umum

### 1. `ModuleNotFoundError: No module named 'paddle'`
* **Penyebab:** Anda belum mengaktifkan virtual environment (`.venv`) atau instalasi dependensi terputus/gagal.
* **Solusi:** Pastikan Anda menjalankan `source .venv/bin/activate` terlebih dahulu sebelum menjalankan `main.py` atau menginstal requirements.

### 2. Error `libomp.dylib` tidak ditemukan (macOS)
* **Penyebab:** PaddlePaddle membutuhkan OpenMP runtime yang tidak tersedia secara bawaan di macOS.
* **Solusi:** Jalankan `brew install libomp` di terminal macOS Anda.

### 3. Server Hang / Timeout saat pemindaian pertama
* **Penyebab:** Server sedang mengunduh model deteksi bahasa Inggris (`en`) PaddleOCR dari server pusat. Ukuran model berkisar ~15-20MB.
* **Solusi:** Biarkan proses berjalan hingga selesai. Pastikan koneksi internet komputer Anda stabil. Unduhan ini hanya terjadi satu kali di awal.

### 4. Error `Address already in use` (Port 8001)
* **Penyebab:** Port `8001` sedang dipakai oleh proses Python/FastAPI lain yang belum mati sempurna atau aplikasi lain.
* **Solusi:** Hentikan proses tersebut dengan perintah:
  ```bash
  kill -9 $(lsof -t -i:8001)
  ```
