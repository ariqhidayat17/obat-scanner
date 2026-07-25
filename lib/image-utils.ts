/**
 * Utility untuk mengompres dan mengecilkan gambar sebelum dikirim ke server OCR.
 *
 * Gambar hasil kamera ponsel modern bisa berukuran 5-12 MB (baca: pemborosan).
 * OCR tidak memerlukan gambar resolusi sangat tinggi untuk membaca teks pada label obat.
 * Fungsi ini memangkas ukuran payload hingga ~90% tanpa mengorbankan akurasi OCR.
 */
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.72;

/**
 * Mengecilkan ukuran dan mengompres gambar untuk pengiriman OCR.
 * @param imageUri - URI gambar lokal dari kamera atau galeri
 * @returns Object berisi `uri` (path file terkompresi) dan `base64` string terkompresi
 */
export async function compressImageForOcr(imageUri: string): Promise<{
  uri: string;
  base64: string;
  mimeType: string;
}> {
  const result = await manipulateAsync(
    imageUri,
    [{ resize: { width: MAX_WIDTH } }],
    {
      compress: COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    }
  );

  let base64 = result.base64 ?? "";
  if (!base64 && Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (result.uri.startsWith("data:")) {
        base64 = result.uri.split(",")[1] || "";
      } else {
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        base64 = dataUrl.split(",")[1] || "";
      }
    } catch (err) {
      console.error("[compressImageForOcr] web base64 fallback error:", err);
    }
  }

  return {
    uri: result.uri,
    base64,
    mimeType: "image/jpeg",
  };
}
