// server/api/literasi/kelas-guru.get.ts
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
  } catch {
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
  let guruId = query.guru_id as string;

  // Jika bukan admin dan bukan kepala_madrasah, gunakan gtk_id dari token
  if (userRole !== "admin" && userRole !== "kepala_madrasah") {
    if (!userGtkId) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: Akun Anda tidak terhubung dengan data guru (GTK ID kosong)",
      });
    }
    guruId = String(userGtkId);
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
  let targetUrl = `${cleanWorkerUrl}/api/literasi/kelas-guru`;
  if (guruId) {
    targetUrl += `?guru_id=${encodeURIComponent(guruId)}`;
  }

  try {
    const response = await $fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
        "X-User-Role": userRole,
        "X-User-Gtk-Id": String(userGtkId || ""),
      },
    });
    return response;
  } catch (error: any) {
    console.error(`Gagal proxy GET kelas-guru literasi ke Cloudflare Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: error.statusCode || 502,
      statusMessage: `Bad Gateway: Gagal mengambil data kelas literasi: ${error.message}`,
    });
  }
});
