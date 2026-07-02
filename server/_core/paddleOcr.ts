import { ENV } from "./env";

export interface PaddleOcrResult {
  success: boolean;
  rawText: string;
  lines: string[];
}

/**
 * Mengirim gambar base64 ke Python sidecar PaddleOCR service.
 * Mengembalikan string gabungan rawText.
 * Jika service offline atau gagal, melempar error agar caller bisa melakukan fallback.
 */
export async function extractTextWithPaddle(imageBase64: string): Promise<string> {
  if (!ENV.paddleOcrUrl) {
    throw new Error("PaddleOCR service URL is not configured");
  }

  // Remove data URI prefix if present
  const base64Data = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64;

  const url = `${ENV.paddleOcrUrl.replace(/\/$/, "")}/ocr`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64: base64Data,
      }),
    });

    if (!res.ok) {
      throw new Error(`OCR service returned status ${res.status}`);
    }

    const data = (await res.json()) as PaddleOcrResult;
    return data.rawText || "";
  } catch (error) {
    console.error("Failed to connect to PaddleOCR sidecar service:", error);
    throw error;
  }
}
