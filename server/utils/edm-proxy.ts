// server/utils/edm-proxy.ts
// Shared helper for EDM proxy endpoints
import { Buffer } from "buffer";
import { sendWebResponse } from "h3";

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
 * Validate auth header (or query param 'token') and return decoded payload.
 * Throws createError on failure.
 */
export function requireAuth(event: any): { token: string; payload: any; role: string; gtkId: string | null } {
  let authHeader = getHeader(event, "authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    const query = getQuery(event);
    if (query.token && typeof query.token === "string") {
      token = query.token;
    }
  }

  if (!token || !validateMockJWT(token)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Token tidak ditemukan atau format salah",
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

/**
 * Proxy a FormData POST request to Cloudflare Worker
 */
export async function proxyFormData(
  targetUrl: string,
  event: any,
  role: string,
  gtkId: string | null,
): Promise<any> {
  const config = useRuntimeConfig();
  const rawBody = await readRawBody(event, false);
  const contentType = getHeader(event, "content-type") || "";

  try {
    return await $fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${config.apiWorkerToken}`,
        "X-User-Role": role,
        "X-User-Gtk-Id": gtkId || "",
      },
      body: rawBody,
    });
  } catch (error: any) {
    console.error(`Gagal proxy FormData ke Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: ${error.message}`,
    });
  }
}

/**
 * Proxy a stream/binary GET request (file download) from Cloudflare Worker
 */
export async function proxyStream(
  targetUrl: string,
  event: any,
): Promise<any> {
  const config = useRuntimeConfig();
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw createError({
        statusCode: response.status,
        statusMessage: errText,
      });
    }

    return await sendWebResponse(event, response);
  } catch (error: any) {
    console.error(`Gagal proxy stream ke Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: error.statusCode || 502,
      statusMessage: error.statusMessage || `Bad Gateway: ${error.message}`,
    });
  }
}

