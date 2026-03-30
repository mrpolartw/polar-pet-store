import Medusa from "@medusajs/js-sdk";

function normalizeEnvValue(value, fallback = "") {
  const normalized = String(value || "")
    .trim()
    .split(/\s+/)[0]

  return normalized || fallback
}

export const MEDUSA_API_URL = normalizeEnvValue(
  import.meta.env.VITE_MEDUSA_API_URL,
  "http://localhost:9000"
);

export const PUBLISHABLE_API_KEY = normalizeEnvValue(
  import.meta.env.VITE_MEDUSA_API_KEY
);

export const sdk = new Medusa({
  baseUrl: MEDUSA_API_URL,
  publishableKey: PUBLISHABLE_API_KEY,  // 讀取 VITE_MEDUSA_API_KEY
});
