# Helper Libraries & Services (lib/)

Folder ini berisi modul utility, helper functions, integrasi API, persistence, dan state management lokal pada aplikasi.

## 🗂️ Struktur Modul

* **`trpc.ts`**: Inisialisasi klien tRPC (React Query wrapper) untuk komunikasi type-safe dengan backend Node.js.
* **`image-store.ts`**: Manajemen penyimpanan gambar lokal (menggunakan SQLite / AsyncStorage) untuk menyimpan riwayat hasil foto label obat.
* **`image-persistence.ts`**: Logika serialisasi/deserialisasi file gambar base64 ke disk lokal perangkat agar hemat memori.
* **`image-utils.ts`**: Utilitas manipulasi gambar (kompresi, resizing, rotasi, konversi base64) sebelum dikirim ke backend.
* **`reminder.ts`**: Integrasi alarm dan notifikasi pengingat minum obat lokal (menggunakan `expo-notifications`).
* **`theme-provider.tsx`**: Context provider untuk mendistribusikan konfigurasi tema aktif ke seluruh komponen.
* **`utils.ts`**: Helper fungsi umum (format tanggal, manipulasi teks, delay, penanganan error).

### ⚙️ Core Modules (`lib/_core/`)
* **`api.ts`**: Setup HTTP base client untuk request non-tRPC.
* **`auth.ts`**: Penyimpanan token kredensial user, verifikasi sesi aktif, dan manajemen proses logout.
* **`manus-runtime.ts`**: Integrasi runtime platform penunjang aplikasi.
* **`theme.ts`**: Integrasi color scheme Tailwind/NativeWind.