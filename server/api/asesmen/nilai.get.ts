// server/api/asesmen/nilai.get.ts
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

  const query = getQuery(event);
  const jenisAsesmenId = query.jenis_asesmen_id as string;

  if (!jenisAsesmenId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Parameter jenis_asesmen_id diperlukan",
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
  const targetUrl = `${cleanWorkerUrl}/api/asesmen/nilai?jenis_asesmen_id=${encodeURIComponent(jenisAsesmenId)}`;

  try {
    const response = await $fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });
    return response;
  } catch (error: any) {
    console.error(`Gagal proxy GET nilai ke Cloudflare Worker (${targetUrl}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal mengambil data nilai: ${error.message}`,
    });
  }
});
