// server/utils/edm-proxy.ts
// Shared helper for EDM proxy endpoints
import { Buffer } from "buffer";

export function validateMockJWT(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payloadRaw = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(payloadRaw);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function decodeMockJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payloadRaw = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(payloadRaw);
  } catch {
    return null;
  }
}

/**
 * Validate auth header and return decoded payload.
 * Throws createError on failure.
 */
export function requireAuth(event: any): { token: string; payload: any; role: string; gtkId: string | null } {
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Token tidak ditemukan atau format salah",
    });
  }

  const token = authHeader.substring(7);
  if (!validateMockJWT(token)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa",
    });
  }

  const payload = decodeMockJWT(token);
  const role = payload?.role || "guru";
  const gtkId = payload?.gtk_id ? String(payload.gtk_id) : null;

  return { token, payload, role, gtkId };
}

/**
 * Get clean worker URL from runtime config
 */
export function getWorkerUrl(): string {
  const config = useRuntimeConfig();
  const workerUrl = config.apiWorkerUrl as string;
  if (!workerUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server Error: Konfigurasi API Worker tidak ditemukan",
    });
  }
  return workerUrl.endsWith("/") ? workerUrl.slice(0, -1) : workerUrl;
}

/**
 * Proxy a GET request to Cloudflare Worker
 */
export async function proxyGet(
  targetUrl: string,
  role: string,
  gtkId: string | null,
): Promise<any> {
  const config = useRuntimeConfig();
  try {
    return await $fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
        "X-User-Role": role,
        "X-User-Gtk-Id": gtkId || "",
      },
    });
  } catch (error: any) {
    console.error(`Gagal proxy GET ke Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: ${error.message}`,
    });
  }
}

/**
 * Proxy a POST/PUT/DELETE request to Cloudflare Worker
 */
export async function proxyMutation(
  targetUrl: string,
  method: "POST" | "PUT" | "DELETE",
  role: string,
  gtkId: string | null,
  body?: any,
): Promise<any> {
  const config = useRuntimeConfig();
  try {
    return await $fetch(targetUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiWorkerToken}`,
        "X-User-Role": role,
        "X-User-Gtk-Id": gtkId || "",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error: any) {
    console.error(`Gagal proxy ${method} ke Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: ${error.message}`,
    });
  }
}
