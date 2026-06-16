// server/api/data-proxy.put.ts
// Proxy PUT ke Cloudflare Worker D1 (update data)

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
    console.error("Gagal validasi mock JWT di server (PUT):", e);
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
      statusMessage: "Forbidden: Hanya admin yang bisa mengupdate data",
    });
  }

  // 3. Ambil Body
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

  const cleanWorkerUrl = workerUrl.endsWith("/") ? workerUrl.slice(0, -1) : workerUrl;
  const url = `${cleanWorkerUrl}/api/data`;

  try {
    const response = await $fetch(url, {
      method: "PUT",
      body: {
        table: body.table,
        id: body.id,
        data: body.data,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });

    return response;
  } catch (error: any) {
    console.error(`Gagal proxy PUT ke Cloudflare Worker (${url}):`, error);
    throw createError({
      statusCode: error?.response?.status || 502,
      statusMessage: `Bad Gateway: Gagal mengupdate data di Cloudflare Worker: ${error.message}`,
    });
  }
});
