// server/api/absensi.post.ts
// Proxy POST ke Cloudflare Worker D1 untuk menyimpan data absensi siswa

import { Buffer } from "buffer";

/**
 * Memvalidasi token JWT tiruan di sisi server
 */
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
    console.error("Gagal validasi mock JWT di server (POST Absensi):", e);
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
      statusMessage: "Server Error: Konfigurasi API Worker tidak ditemukan di server",
    });
  }

  const cleanWorkerUrl = workerUrl.endsWith("/") ? workerUrl.slice(0, -1) : workerUrl;
  const url = `${cleanWorkerUrl}/api/absensi`;

  try {
    // 3. Lakukan request server-to-server ke Cloudflare Worker (POST)
    const response = await $fetch(url, {
      method: "POST",
      body: {
        tanggal: body.tanggal,
        kelas_id: body.kelas_id,
        tahun_pelajaran: body.tahun_pelajaran,
        semester: body.semester,
        data: body.data,
        input_by: body.input_by,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });

    return response;
  } catch (error: any) {
    console.error(`Gagal proxy POST absensi ke Cloudflare Worker (${url}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal mengirim data absensi ke Cloudflare Worker: ${error.message}`,
    });
  }
});
