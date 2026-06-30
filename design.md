# ObatScan — Design Document

## App Concept
Aplikasi Android untuk membaca dan mengenali teks pada label/kemasan obat menggunakan OCR berbasis Deep Learning (PaddleOCR). Pengguna dapat memotret atau mengunggah gambar label obat, lalu aplikasi akan mengekstrak dan menampilkan informasi penting seperti nama obat, dosis, komposisi, tanggal kadaluarsa, dll.

---

## Color Palette

| Token       | Light Mode  | Dark Mode   | Usage                          |
|-------------|-------------|-------------|--------------------------------|
| `primary`   | `#1A73E8`   | `#4A9EFF`   | Tombol utama, aksen biru medis |
| `background`| `#F8FAFF`   | `#0F1923`   | Latar layar                    |
| `surface`   | `#FFFFFF`   | `#1A2535`   | Kartu, panel                   |
| `foreground`| `#1C2B3A`   | `#E8F0FE`   | Teks utama                     |
| `muted`     | `#6B7A8D`   | `#8FA3BF`   | Teks sekunder                  |
| `border`    | `#D8E4F0`   | `#2A3D55`   | Garis batas                    |
| `success`   | `#16A34A`   | `#4ADE80`   | Sukses scan                    |
| `warning`   | `#D97706`   | `#FBBF24`   | Peringatan                     |
| `error`     | `#DC2626`   | `#F87171`   | Error                          |

---

## Screen List

### 1. Home Screen (`/`)
**Tujuan:** Halaman utama dengan aksi scan cepat.

**Konten:**
- Header dengan logo ObatScan + judul
- Hero card dengan tombol "Scan Label Obat" (kamera)
- Tombol sekunder "Pilih dari Galeri"
- Daftar riwayat scan terbaru (FlatList, maks 10 item)
- Setiap item riwayat: thumbnail gambar + nama obat terdeteksi + waktu scan

**Fungsi:**
- Buka kamera untuk foto langsung
- Pilih gambar dari galeri
- Navigasi ke detail riwayat scan

---

### 2. Camera Screen (`/camera`)
**Tujuan:** Tampilan kamera penuh untuk memotret label obat.

**Konten:**
- Preview kamera fullscreen
- Overlay panduan frame (kotak putus-putus) untuk memposisikan label
- Tombol shutter di bawah tengah
- Tombol flip kamera (depan/belakang)
- Tombol flash toggle
- Tombol kembali (X) di kiri atas
- Tips singkat: "Pastikan teks terbaca jelas"

**Fungsi:**
- Ambil foto
- Flip kamera
- Toggle flash
- Kembali ke home

---

### 3. Result Screen (`/result`)
**Tujuan:** Menampilkan hasil OCR dari label obat.

**Konten:**
- Gambar label yang dipindai (thumbnail, bisa diperbesar)
- Status loading dengan animasi saat proses OCR
- Kartu hasil OCR dengan field terstruktur:
  - **Nama Obat** (bold, besar)
  - **Komposisi/Kandungan**
  - **Dosis & Aturan Pakai**
  - **Tanggal Kadaluarsa**
  - **Nomor Registrasi BPOM**
  - **Produsen**
  - **Teks Lain** (raw OCR text)
- Tombol "Scan Ulang"
- Tombol "Simpan ke Riwayat"
- Tombol "Salin Teks"

**Fungsi:**
- Tampilkan hasil terstruktur
- Salin teks ke clipboard
- Simpan ke riwayat lokal
- Kembali / scan ulang

---

### 4. History Screen (`/history`)
**Tujuan:** Riwayat semua scan yang pernah dilakukan.

**Konten:**
- Header "Riwayat Scan"
- FlatList semua riwayat scan
- Setiap item: thumbnail + nama obat + tanggal scan + preview teks singkat
- Tombol hapus per item (swipe atau long press)
- Empty state jika belum ada riwayat

**Fungsi:**
- Lihat detail scan lama
- Hapus riwayat
- Navigasi ke detail

---

### 5. Detail History Screen (`/history/[id]`)
**Tujuan:** Detail hasil scan dari riwayat.

**Konten:**
- Sama seperti Result Screen tapi read-only
- Tombol hapus dari riwayat

---

## Key User Flows

### Flow 1: Scan via Kamera
```
Home → Tap "Scan Label Obat" → Camera Screen → Ambil Foto → 
Loading OCR → Result Screen → Simpan ke Riwayat
```

### Flow 2: Scan via Galeri
```
Home → Tap "Pilih dari Galeri" → Image Picker → 
Loading OCR → Result Screen → Simpan ke Riwayat
```

### Flow 3: Lihat Riwayat
```
Home → Tab "Riwayat" → History Screen → Tap item → Detail Screen
```

---

## Tab Navigation

| Tab    | Icon              | Screen   |
|--------|-------------------|----------|
| Scan   | `camera.fill`     | Home     |
| Riwayat| `clock.fill`      | History  |

---

## Component Architecture

- `ScanButton` — Tombol utama dengan ikon kamera
- `ResultCard` — Kartu hasil OCR dengan field terstruktur
- `HistoryItem` — Item riwayat scan
- `OCRField` — Baris label + nilai untuk hasil OCR
- `LoadingOverlay` — Overlay loading saat proses OCR
- `CameraOverlay` — Frame panduan di atas kamera
