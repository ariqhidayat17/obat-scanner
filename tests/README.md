# Unit & Integration Tests (tests/)

Direktori ini berisi suite pengujian otomatis untuk memvalidasi fungsi backend dan modul utama aplikasi agar terhindar dari bug regresi.

## 🧪 Daftar Test Suite

* **`auth.logout.test.ts`**: Menguji fungsionalitas logout user, pembatalan/penghapusan session cookie backend, dan pembersihan state autentikasi lokal secara bersih.
* **`ocr.test.ts`**: Menguji pipeline OCR. Memvalidasi integrasi sidecar server PaddleOCR lokal/ngrok serta memverifikasi logika fallback otomatis (automated fallback) ke Google Gemini Vision ketika sidecar server sengaja dinonaktifkan atau offline.

## 🚀 Menjalankan Pengujian

Jalankan perintah berikut di root folder project untuk menjalankan seluruh test suite:
```bash
npm run test
```
