# Reusable Components (components/)

Folder berisi komponen UI global dan terisolasi yang dapat digunakan kembali di seluruh screen aplikasi.

## 🗂️ Struktur Komponen

* **`screen-container.tsx`**: Wrapper screen standar untuk membungkus halaman. Menangani `SafeAreaView`, status bar, layout scrollable/non-scrollable, dan keyboard-dismissing otomatis.
* **`reminder-modal.tsx`**: Modal popup untuk mengatur pengingat/alarm konsumsi obat pasien.
* **`haptic-tab.tsx`**: Tombol tab navigasi bawah dengan feedback getar (haptic) taktil saat ditekan.
* **`themed-view.tsx`**: View component dasar yang otomatis menyesuaikan skema warna (Light/Dark mode).
* **`parallax-scroll-view.tsx`**: Komponen scroll dengan efek latar belakang parallax interaktif.
* **`hello-wave.tsx`**: Animasi lambaian tangan bawaan Expo untuk halaman selamat datang.
* **`external-link.tsx`**: Penanganan pembukaan tautan web eksternal di luar aplikasi secara aman.

### 🎨 UI Atoms (`components/ui/`)
* **`collapsible.tsx`**: Accordion component untuk menyembunyikan/menampilkan detail informasi obat.
* **`icon-symbol.tsx`**: Wrapper ikon serbaguna (SF Symbols di iOS, MaterialIcons di Android/Web) untuk konsistensi cross-platform.