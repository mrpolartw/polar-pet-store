import Medusa from "@medusajs/js-sdk";

const API_URL = import.meta.env.VITE_MEDUSA_API_URL || "http://localhost:9000";
const PUBLISHABLE_API_KEY = import.meta.env.VITE_MEDUSA_API_KEY;

export const sdk = new Medusa({
  baseUrl: API_URL,
  debug: import.meta.env.DEV,
  publishableKey: PUBLISHABLE_API_KEY,
});
