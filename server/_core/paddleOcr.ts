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
  // Use configured PaddleOCR URL from environment
  const targetUrl = `${ENV.paddleOcrUrl.replace(/\/$/, "")}/ocr`;

  // Remove data URI prefix if present
  const base64Data = imageBase64.includes(",") 
    ? imageBase64.split(",")[1] 
    : imageBase64;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
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
