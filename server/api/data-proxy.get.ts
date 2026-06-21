// server/api/data-proxy.get.ts
// Proxy ke Cloudflare Worker D1

import { apiCache, CACHE_EXPIRATION_MS } from "../utils/cache";

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
    console.error("Gagal validasi mock JWT di server:", e);
    return false;
  }
}

/**
 * Decode token JWT tiruan untuk mendapatkan payload (role, gtk_id, dll)
 */
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

  // 2. Ambil Query Parameter
  const query = getQuery(event);
  const type = query.type as string;
  const table = query.table as string;

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

  // Bangun URL ke Cloudflare Worker
  let url = "";

  if (type === "utama") {
    // Endpoint data utama → Worker /api/data
    const searchParams = new URLSearchParams();
    if (table) {
      searchParams.append("table", table);
    }
    if (query.filter_col) {
      searchParams.append("filter_col", query.filter_col as string);
    }
    if (query.filter_val) {
      searchParams.append("filter_val", query.filter_val as string);
    }

    // Jika role guru dan tabel DataGtk / Akun, filter hanya data miliknya
    const jwtPayload = decodeMockJWT(token);
    if (jwtPayload && jwtPayload.role === "guru" && jwtPayload.gtk_id) {
      if (
        table === "DataGtk" ||
        [
          "AkunEmis",
          "AkunEmail",
          "AkunSimpatika",
          "AkunEmisGTK",
          "AkunRdm",
        ].includes(table)
      ) {
        searchParams.append("gtk_id", String(jwtPayload.gtk_id));
      }
    }

    const qs = searchParams.toString();
    url = `${cleanWorkerUrl}/api/data${qs ? "?" + qs : ""}`;
  } else if (type === "surat") {
    // Endpoint surat → Worker /api/surat
    url = `${cleanWorkerUrl}/api/surat`;
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Parameter type tidak valid",
    });
  }

  if (!workerUrl) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Server Error: Konfigurasi API Worker tidak ditemukan di server",
    });
  }

  // Cek apakah request meminta bypass cache (force refresh)
  const nocache =
    query.nocache === "true" ||
    getHeader(event, "cache-control") === "no-cache";

  // Cek cache server jika diaktifkan di konfigurasi dan tidak di-bypass
  if (config.enableServerCache && !nocache) {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION_MS) {
      return cached.data;
    }
  }

  try {
    // 3. Lakukan request server-to-server ke Cloudflare Worker
    const response = await $fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
    });

    // Simpan hasil fetch ke cache server jika diaktifkan
    if (config.enableServerCache) {
      apiCache.set(url, {
        data: response,
        timestamp: Date.now(),
      });
    }

    return response;
  } catch (error: any) {
    console.error(`Gagal proxy ke Cloudflare Worker (${url}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal mengambil data dari Cloudflare Worker: ${error.message}`,
    });
  }
});
