# ObatScan - Project TODO

## Branding & Setup
- [x] Generate logo ObatScan
- [x] Update app.config.ts dengan nama dan logo
- [x] Update theme.config.js dengan warna medis biru

## Backend API
- [x] Buat tRPC route `ocr.scan` untuk proses gambar via LLM multimodal
- [x] Upload gambar ke S3 storage sebelum kirim ke LLM
- [x] Parse hasil LLM menjadi struktur data terorganisir (nama obat, dosis, dll)

## Screens & Navigation
- [x] Setup tab navigation (Scan + Riwayat)
- [x] Home Screen dengan tombol scan dan galeri
- [x] Camera Screen dengan overlay panduan frame
- [x] Result Screen dengan kartu hasil OCR terstruktur
- [x] History Screen dengan FlatList riwayat
- [x] Detail History Screen

## Fitur
- [x] Integrasi expo-camera untuk foto langsung
- [x] Integrasi expo-image-picker untuk pilih dari galeri
- [x] Loading state saat proses OCR
- [x] Tampilkan hasil OCR terstruktur (nama, dosis, komposisi, dll)
- [x] Salin teks ke clipboard
- [x] Simpan riwayat scan ke AsyncStorage
- [x] Hapus item riwayat
- [x] Empty state untuk riwayat kosong

## Polish
- [ ] Animasi loading OCR
- [x] Haptic feedback pada tombol utama
- [ ] Thumbnail gambar di riwayat
