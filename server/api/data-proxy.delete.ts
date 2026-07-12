// server/api/data-proxy.delete.ts
// Proxy DELETE ke Cloudflare Worker D1 (hapus data)

import { Buffer } from "buffer";
import { invalidateCache } from "../utils/cache";

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
    console.error("Gagal validasi mock JWT di server (DELETE):", e);
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
  // 1. Validasi Token Authorization
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

  // 2. Cek role admin
  const jwtPayload = decodeMockJWT(token);
  if (!jwtPayload || jwtPayload.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Hanya admin yang bisa menghapus data",
    });
  }

  // 3. Ambil Body (DELETE with body)
  const body = await readBody(event);

  const config = useRuntimeConfig();
  const workerUrl = config.apiWorkerUrl as string;

  if (!workerUrl) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Server Error: Konfigurasi API Worker tidak ditemukan di server",
    });
  }

  const cleanWorkerUrl = workerUrl.endsWith("/")
    ? workerUrl.slice(0, -1)
    : workerUrl;
  
  let url: string;
  if (body.type === "surat" && body.surat_type) {
    url = `${cleanWorkerUrl}/api/surat/${encodeURIComponent(body.surat_type)}`;
  } else {
    url = `${cleanWorkerUrl}/api/data`;
  }

  try {
    const response = await $fetch(url, {
      method: "DELETE",
      body: body.type === "surat" ? undefined : {
        table: body.table,
        id: body.id,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });

    // Invalidate server cache untuk tabel ini
    if (body.table) {
      invalidateCache(body.table);
    }
    if (body.type === "surat") {
      invalidateCache("surat");
    }

    return response;
  } catch (error: any) {
    console.error(`Gagal proxy DELETE ke Cloudflare Worker (${url}):`, error);
    throw createError({
      statusCode: error?.response?.status || 502,
      statusMessage: `Bad Gateway: Gagal menghapus data di Cloudflare Worker: ${error.message}`,
    });
  }
});
