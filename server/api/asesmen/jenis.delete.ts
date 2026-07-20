// server/api/asesmen/jenis.delete.ts
import { Buffer } from "buffer";

function validateMockJWT(token: string): boolean {
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
  } catch (e) {
    return false;
  }
}

function decodeMockJWT(token: string): any {
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

export default defineEventHandler(async (event) => {
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
  const userRole = payload?.role || "guru";
  const userGtkId = payload?.gtk_id;

  const query = getQuery(event);
  const id = query.id as string;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Parameter id diperlukan",
    });
  }

  const config = useRuntimeConfig();
  const workerUrl = config.apiWorkerUrl as string;
  if (!workerUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server Error: Konfigurasi API Worker tidak ditemukan",
    });
  }

  const cleanWorkerUrl = workerUrl.endsWith("/") ? workerUrl.slice(0, -1) : workerUrl;
  const targetUrl = `${cleanWorkerUrl}/api/asesmen/jenis/${id}`;

  try {
    const response = await $fetch(targetUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
        "X-User-Role": userRole,
        "X-User-Gtk-Id": String(userGtkId || ""),
      },
    });
    return response;
  } catch (error: any) {
    console.error(`Gagal proxy DELETE jenis asesmen ke Cloudflare Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: error.statusCode || 502,
      statusMessage: error.statusMessage || `Gagal menghapus jenis asesmen: ${error.message}`,
    });
  }
});
