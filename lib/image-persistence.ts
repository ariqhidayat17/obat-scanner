import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

// ─── IndexedDB Config (Web Only) ───────────────────────────────────────────
const DB_NAME = "ObatScanDB";
const DB_VERSION = 1;
const STORE_NAME = "images";

function getIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported on this platform"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveWebImage(id: string, base64OrUri: string): Promise<string> {
  const db = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(base64OrUri, id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(`web-db:${id}`);
  });
}

async function loadWebImage(id: string): Promise<string | null> {
  const db = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function deleteWebImage(id: string): Promise<void> {
  const db = await getIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ─── API Utama Persistensi Gambar ──────────────────────────────────────────

/**
 * Menyimpan gambar riwayat secara permanen berdasarkan platform.
 * Jika berupa remote URL (HTTP/S), langsung dikembalikan tanpa disimpan ulang.
 * 
 * @param id - ID unik entri riwayat (misalnya timestamp)
 * @param sourceUri - URI sumber (dapat berupa file cache lokal, base64, atau remote URL)
 * @returns URI tujuan yang persisten untuk disimpan di AsyncStorage
 */
export async function saveHistoryImage(id: string, sourceUri: string): Promise<string> {
  if (!sourceUri) return "";

  // Jika remote URL dari S3, gunakan langsung secara gratis
  if (sourceUri.startsWith("http://") || sourceUri.startsWith("https://")) {
    return sourceUri;
  }

  if (Platform.OS === "web") {
    // Simpan base64/URI data ke IndexedDB agar LocalStorage tetap sangat kecil
    return await saveWebImage(id, sourceUri);
  } else {
    // Pada Native (iOS/Android), pindahkan dari cache ke direktori dokumen permanen
    try {
      const extension = sourceUri.endsWith(".png") ? "png" : "jpg";
      const filename = `scan_${id}.${extension}`;
      const destinationUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });

      return destinationUri;
    } catch (err) {
      console.error("[image-persistence] Gagal menyalin file di native:", err);
      // Fallback ke cache URI asli jika penyalinan gagal
      return sourceUri;
    }
  }
}

/**
 * Memuat gambar persisten. Khusus platform web, mengambil base64 dari IndexedDB.
 * Untuk native, langsung mengembalikan path file permanen.
 * 
 * @param uriOrKey - URI atau kunci IndexedDB yang disimpan di AsyncStorage
 * @returns URI yang siap dirender oleh komponen `<Image>`
 */
export async function loadHistoryImage(uriOrKey: string): Promise<string> {
  if (!uriOrKey) return "";

  if (Platform.OS === "web" && uriOrKey.startsWith("web-db:")) {
    const id = uriOrKey.replace("web-db:", "");
    try {
      const data = await loadWebImage(id);
      return data || "";
    } catch (err) {
      console.error("[image-persistence] Gagal memuat gambar dari IndexedDB:", err);
      return "";
    }
  }

  return uriOrKey;
}

/**
 * Menghapus gambar riwayat dari penyimpanan fisik/lokal agar tidak menyisakan sampah.
 * 
 * @param uriOrKey - URI atau kunci IndexedDB yang ingin dihapus
 */
export async function deleteHistoryImage(uriOrKey: string): Promise<void> {
  if (!uriOrKey) return;

  if (Platform.OS === "web") {
    if (uriOrKey.startsWith("web-db:")) {
      const id = uriOrKey.replace("web-db:", "");
      try {
        await deleteWebImage(id);
      } catch (err) {
        console.error("[image-persistence] Gagal menghapus gambar dari IndexedDB:", err);
      }
    }
  } else {
    // Pada Native, hapus file dari documentDirectory
    try {
      // Pastikan hanya menghapus file lokal kita sendiri yang ada di documentDirectory
      if (uriOrKey.startsWith(FileSystem.documentDirectory ?? "")) {
        const fileInfo = await FileSystem.getInfoAsync(uriOrKey);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(uriOrKey, { idempotent: true });
        }
      }
    } catch (err) {
      console.error("[image-persistence] Gagal menghapus file di native:", err);
    }
  }
}
