// server/api/absensi/submitted-dates.get.ts
// Proxy GET ke Cloudflare Worker D1 untuk mengambil daftar tanggal yang sudah terkirim absensinya per kelas & tapel

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
    console.error(
      "Gagal validasi mock JWT di server (GET Submitted Dates):",
      e,
    );
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

  // 2. Ambil Query Parameter
  const query = getQuery(event);
  const kelasId = query.kelas_id as string;
  const tahunPelajaran = query.tahun_pelajaran as string;

  if (!kelasId || !tahunPelajaran) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Bad Request: Parameter kelas_id dan tahun_pelajaran diperlukan",
    });
  }

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

  const params = new URLSearchParams({
    kelas_id: kelasId,
    tahun_pelajaran: tahunPelajaran,
  }).toString();

  const url = `${cleanWorkerUrl}/api/absensi/submitted-dates?${params}`;

  try {
    const response = await $fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });

    return response;
  } catch (error: any) {
    console.error(
      `Gagal proxy GET submitted dates absensi ke Cloudflare Worker (${url}):`,
      error,
    );
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal mengambil data tanggal terisi dari Cloudflare Worker: ${error.message}`,
    });
  }
});
