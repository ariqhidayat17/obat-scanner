// ─── LLM Provider Config ────────────────────────────────────────────────────
// Prioritas: Gemini → OpenRouter → Forge (Manus)
// Urutan fallback saat quota habis / error

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const openRouterApiKey = process.env.OPENROUTER_API_KEY || "";
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY || "";

// Gemini endpoint (OpenAI-compatible)
const geminiApiUrl = geminiApiKey
  ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
  : "";

// OpenRouter endpoint
const openRouterApiUrl = openRouterApiKey
  ? "https://openrouter.ai/api/v1/chat/completions"
  : "";

// Forge endpoint (Manus deploy)
const forgeApiUrl = forgeApiKey && process.env.BUILT_IN_FORGE_API_URL
  ? process.env.BUILT_IN_FORGE_API_URL
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
  // LLM providers
  geminiApiKey,
  geminiApiUrl,
  openRouterApiKey,
  openRouterApiUrl,
  forgeApiUrl,
  forgeApiKey,
  /** URL base Forge Storage (hanya tersedia di Manus deploy). Kosong di dev lokal. */
  forgeStorageUrl,
  /** URL untuk Python PaddleOCR sidecar service */
  paddleOcrUrl: process.env.PADDLE_OCR_URL || "http://192.168.18.159:8001",
};

