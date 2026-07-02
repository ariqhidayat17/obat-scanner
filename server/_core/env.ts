// ─── Forge (Manus Platform) Config ────────────────────────────────────────────
// Diisi otomatis saat deploy di Manus. Untuk dev lokal, gunakan API key alternatif.

// API key: Forge → Gemini → OpenAI (urutan prioritas)
const forgeApiKey =
  process.env.BUILT_IN_FORGE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  "";

// URL khusus untuk LLM chat completions
// Hanya gunakan Forge URL jika BUILT_IN_FORGE_API_KEY tersedia (bukan key lain)
const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL
  ? process.env.BUILT_IN_FORGE_API_URL
  : process.env.GEMINI_API_KEY && !process.env.BUILT_IN_FORGE_API_KEY
    ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    : "";

// URL khusus untuk Forge Storage (presign S3).
// Hanya tersedia saat deploy di Manus dengan BUILT_IN_FORGE_API_KEY.
// Di dev lokal, ini akan kosong dan storage akan di-skip (fallback ke base64).
const forgeStorageUrl = process.env.BUILT_IN_FORGE_API_KEY
  ? (process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.im")
  : "";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl,
  forgeApiKey,
  /** URL base Forge Storage (hanya tersedia di Manus deploy). Kosong di dev lokal. */
  forgeStorageUrl,
  /** URL untuk Python PaddleOCR sidecar service */
  paddleOcrUrl: process.env.PADDLE_OCR_URL || "http://localhost:8001",
};

