// server/api/asesmen/jenis.post.ts
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

  const body = await readBody(event);
  let { guru_id, mapel_id, kelas_id, nama_asesmen, materi, tahun_pelajaran, semester } = body;

  // Jika bukan admin, paksa menggunakan gtk_id dari token
  if (userRole !== "admin") {
    if (!userGtkId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: Akun Anda tidak terhubung dengan data guru",
      });
    }
    guru_id = userGtkId;
  } else {
    if (!guru_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request: Parameter guru_id wajib diisi oleh Admin",
      });
    }
  }

  if (!guru_id || !mapel_id || !kelas_id || !nama_asesmen || !tahun_pelajaran || !semester) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Field guru_id, mapel_id, kelas_id, nama_asesmen, tahun_pelajaran, dan semester diperlukan",
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
  const targetUrl = `${cleanWorkerUrl}/api/asesmen/jenis`;

  try {
    const response = await $fetch(targetUrl, {
      method: "POST",
      body: {
        guru_id: typeof guru_id === "string" ? parseInt(guru_id) : guru_id,
        mapel_id: typeof mapel_id === "string" ? parseInt(mapel_id) : mapel_id,
        kelas_id,
        nama_asesmen,
        materi,
        tahun_pelajaran,
        semester,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiWorkerToken}`,
        "X-User-Role": userRole,
        "X-User-Gtk-Id": String(userGtkId || ""),
      },
    });
    return response;
  } catch (error: any) {
    console.error(`Gagal proxy POST jenis asesmen ke Cloudflare Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: error.statusCode || 502,
      statusMessage: error.statusMessage || `Gagal menambahkan jenis asesmen: ${error.message}`,
    });
  }
});
