// utils.ts
import { CORS_HEADERS } from "./config";

export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ---------------------------------------------------------------------------
// Random Password Generator
// ---------------------------------------------------------------------------
export function generateRandomPassword(length: number = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper untuk normalisasi nama (menghilangkan gelar akademis dan prefiks H./Hj. agar pencocokan nama akurat)
export function cleanName(name?: string | null): string {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

// Helper to convert camelCase/PascalCase to snake_case for backward compatibility
export function toSnakeCase(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}
