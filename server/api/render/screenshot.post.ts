// server/api/render/screenshot.post.ts
// Proxy POST ke Cloudflare Worker Browser Rendering untuk generate screenshot JPEG

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
    console.error("Gagal validasi JWT (POST Screenshot):", e);
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

  // 2. Baca Body
  const body = await readBody(event);
  if (!body || !body.html) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Parameter 'html' diperlukan",
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

  const cleanWorkerUrl = workerUrl.endsWith("/")
    ? workerUrl.slice(0, -1)
    : workerUrl;

  const url = `${cleanWorkerUrl}/api/render/screenshot`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiWorkerToken}`,
      },
      body: JSON.stringify({
        html: body.html,
        width: body.width || 850,
        quality: body.quality || 92,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Worker returned status ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    setHeader(event, "Content-Type", "image/jpeg");
    setHeader(event, "Cache-Control", "no-cache");
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.error(`Gagal proxy POST screenshot ke Cloudflare Worker (${url}):`, error);
    throw createError({
      statusCode: 502,
      statusMessage: `Bad Gateway: Gagal generate screenshot via Cloudflare Browser Rendering: ${error.message}`,
    });
  }
});
