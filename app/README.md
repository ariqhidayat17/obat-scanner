# Frontend Screens & Navigation (app/)

Folder berisi routing, screen, dan layout aplikasi menggunakan **Expo Router** (file-based routing).

## 🗂️ Struktur Folder & Route

* **`_layout.tsx`**: Root layout. Mengatur navigasi stack global, inisialisasi context tRPC, autentikasi, serta inisialisasi SQLite/AsyncStorage lokal.
* **`(tabs)/`**: Tab navigation utama (bawah):
  * **`index.tsx` (Scan/Home):** Halaman awal. Tombol ambil gambar/pilih dari galeri.
  * **`history.tsx` (Riwayat):** Halaman daftar riwayat pemindaian obat yang tersimpan.
* **`camera.tsx`**: Kamera kustom dengan panduan frame overlay persegi untuk kemasan obat. Memakai `expo-camera`.
* **`result.tsx`**: Menampilkan hasil analisis OCR Paddle/Gemini secara terstruktur.
* **`interaction.tsx`**: Menu analisis efek interaksi antar obat.
* **`chat/[id].tsx`**: Konsultasi tanya-jawab dengan asisten AI mengenai obat spesifik.
* **`history/[id].tsx`**: Detail riwayat pemindaian obat masa lalu.
* **`dev/theme-lab.tsx`**: Halaman sandbox developer untuk menguji komponen & palet warna UI.
* **`oauth/`**: Penanganan integrasi callback login OAuth.

## 🎨 Gaya UI & Tema
Menggunakan **NativeWind** (Tailwind CSS untuk React Native) dengan konfigurasi warna medis yang disesuaikan dalam `constants/theme.ts`.