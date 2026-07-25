# Shared Codes & Types (shared/)

Folder ini berisi kode, tipe data TypeScript, konstanta, dan kelas error yang digunakan bersama (shared) oleh aplikasi mobile (frontend) dan server Node.js (backend) untuk menjaga konsistensi type-safety secara end-to-end.

## 🗂️ Struktur Modul

* **`types.ts`**: Skema tipe data utama aplikasi (definisi struktur data Obat, Riwayat Pemindaian, Profil User, Chat, dan Jadwal Pengingat).
* **`ocr-types.ts`**: Tipe data khusus request/response OCR dan struktur parsing data hasil analisis Gemini (JSON schema).
* **`const.ts`**: Konstanta global yang diakses bersama (status pemindaian, konfigurasi default, dll).

### ⚙️ Core Shared (`shared/_core/`)
* **`errors.ts`**: Custom error classes standar (misal: APIError, AuthError, ValidationError) untuk standarisasi penanganan error di frontend maupun backend.