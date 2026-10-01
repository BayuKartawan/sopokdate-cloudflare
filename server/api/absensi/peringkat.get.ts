// server/api/absensi/peringkat.get.ts
// Proxy GET ke Cloudflare Worker D1 untuk mengambil data peringkat ketidakhadiran siswa

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
      "Gagal validasi mock JWT di server (GET Peringkat Absensi):",
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
  const tahunPelajaran = query.tahun_pelajaran as string;
  const semester = query.semester as string;
  const startDate = query.start_date as string;
  const endDate = query.end_date as string;

  if (!tahunPelajaran) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Parameter tahun_pelajaran diperlukan",
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

  const params: Record<string, string> = {
    tahun_pelajaran: tahunPelajaran,
  };

  if (semester) params.semester = semester;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const qs = new URLSearchParams(params).toString();
  const url = `${cleanWorkerUrl}/api/absensi/peringkat?${qs}`;

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
      `Gagal proxy GET peringkat absensi ke Cloudflare Worker (${url}):`,
      error,
    );
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal mengambil data peringkat absensi dari Cloudflare Worker: ${error.message}`,
    });
  }
});
