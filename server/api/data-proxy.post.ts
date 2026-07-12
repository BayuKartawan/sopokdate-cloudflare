// server/api/data-proxy.post.ts
// Proxy POST ke Cloudflare Worker D1

import { Buffer } from "buffer";
import { invalidateCache } from "../utils/cache";

/**
 * Memvalidasi token JWT tiruan di sisi server
 * @param token Token JWT yang akan divalidasi
 * @returns boolean true jika valid
 */
function validateMockJWT(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode payload bagian kedua dari base64
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payloadRaw = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(payloadRaw);

    // Periksa apakah token kedaluwarsa
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch (e) {
    console.error("Gagal validasi mock JWT di server (POST):", e);
    return false;
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

  // 2. Ambil Body
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

  // Bersihkan trailing slash pada URL Worker agar tidak menghasilkan double slash
  const cleanWorkerUrl = workerUrl.endsWith("/")
    ? workerUrl.slice(0, -1)
    : workerUrl;

  // URL endpoint POST di Worker
  let url: string;
  if (body.type === "surat") {
    url = `${cleanWorkerUrl}/api/surat`;
  } else {
    url = `${cleanWorkerUrl}/api/data`;
  }

  try {
    // 3. Lakukan request server-to-server ke Cloudflare Worker (POST)
    const fetchBody =
      body.type === "surat"
        ? {
            surat_type: body.surat_type,
            template_path: body.template_path,
            template_type: body.template_type,
            description: body.description,
            placeholders: body.placeholders,
          }
        : {
            table: body.table,
            data: body.data,
          };

    const response = await $fetch(url, {
      method: "POST",
      body: fetchBody,
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
    console.error(`Gagal proxy POST ke Cloudflare Worker (${url}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal mengirim data ke Cloudflare Worker: ${error.message}`,
    });
  }
});
