/**
 * In-memory singleton store untuk menyimpan data gambar sementara saat navigasi.
 *
 * ALASAN KEBERADAAN MODUL INI:
 * Mengirimkan base64 string gambar (yang bisa berukuran 1–5 MB) melalui parameter
 * navigasi expo-router adalah POLA YANG SALAH. Sistem operasi & browser memiliki
 * batas panjang URL yang jauh lebih kecil dari ukuran data tersebut, yang bisa
 * menyebabkan data terpotong, navigasi gagal, atau aplikasi crash.
 *
 * CARA PAKAI:
 * - Sebelum navigasi ke "/result", panggil: setImageBase64(base64string)
 * - Di layar "/result", ambil datanya dengan: getImageBase64()
 * - Setelah selesai diproses, bersihkan dengan: clearImageBase64()
 */

interface PendingImage {
  base64: string;
  mimeType: string;
}

let _store: PendingImage | null = null;

/** Simpan data gambar ke memory store sebelum navigasi. */
export function setImageBase64(base64: string, mimeType: string = "image/jpeg"): void {
  _store = { base64, mimeType };
}

/** Ambil data gambar dari memory store. Mengembalikan null jika tidak ada data. */
export function getImageBase64(): PendingImage | null {
  return _store;
}

/** Bersihkan data gambar dari memori setelah selesai diproses. */
export function clearImageBase64(): void {
  _store = null;
}
