// server/api/auth-proxy.post.ts
// Proxy ke Cloudflare Worker untuk auth (login & user management)

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { action, ...payload } = body;

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

  try {
    // Action: login — tidak perlu API Key (public endpoint)
    if (action === "login") {
      const response = await $fetch(`${cleanWorkerUrl}/api/auth/login`, {
        method: "POST",
        body: {
          username: payload.username,
          password: payload.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response;
    }

    // Semua action lain memerlukan API Key
    const apiToken = config.apiWorkerToken as string;

    if (!apiToken) {
      throw createError({
        statusCode: 500,
        statusMessage: "Server Error: API Worker Token tidak ditemukan",
      });
    }

    // Validasi JWT dari request (admin only endpoints)
    const authHeader = getHeader(event, "authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Token tidak ditemukan",
      });
    }

    const token = authHeader.substring(7);
    if (!validateMockJWT(token)) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa",
      });
    }

    // Cek role admin dari JWT (kecuali untuk action 'get-my-menu-akses')
    const jwtPayload = decodeMockJWT(token);
    if (action !== "get-my-menu-akses") {
      if (!jwtPayload || jwtPayload.role !== "admin") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden: Hanya admin yang bisa mengakses fitur ini",
        });
      }
    } else {
      if (!jwtPayload) {
        throw createError({
          statusCode: 401,
          statusMessage: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa",
        });
      }
    }

    // Action: get-my-menu-akses
    if (action === "get-my-menu-akses") {
      const response = await $fetch(`${cleanWorkerUrl}/api/menu-akses/my`, {
        method: "GET",
        query: {
          user_id: jwtPayload.user_id,
          role: jwtPayload.role,
        },
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      return response;
    }

    // Action: seed-guru
    if (action === "seed-guru") {
      const response = await $fetch(`${cleanWorkerUrl}/api/auth/seed-guru`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    }

    // Action: get-users
    if (action === "get-users") {
      const response = await $fetch(`${cleanWorkerUrl}/api/auth/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      return response;
    }

    // Action: update-user
    if (action === "update-user") {
      const { userId, ...updateData } = payload;
      if (!userId) {
        throw createError({
          statusCode: 400,
          statusMessage: "userId diperlukan",
        });
      }

      const response = await $fetch(
        `${cleanWorkerUrl}/api/auth/users/${userId}`,
        {
          method: "PUT",
          body: updateData,
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response;
    }

    // Action: delete-user
    if (action === "delete-user") {
      const { userId } = payload;
      if (!userId) {
        throw createError({
          statusCode: 400,
          statusMessage: "userId diperlukan",
        });
      }

      const response = await $fetch(
        `${cleanWorkerUrl}/api/auth/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        },
      );
      return response;
    }

    // Action: get-menu-akses-role
    if (action === "get-menu-akses-role") {
      const { role } = payload;
      const response = await $fetch(`${cleanWorkerUrl}/api/menu-akses/role`, {
        method: "GET",
        query: { role },
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      return response;
    }

    // Action: save-menu-akses-role
    if (action === "save-menu-akses-role") {
      const { role, items } = payload;
      const response = await $fetch(`${cleanWorkerUrl}/api/menu-akses/role`, {
        method: "PUT",
        body: { role, items },
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    }

    // Action: get-menu-akses-user
    if (action === "get-menu-akses-user") {
      const { userId } = payload;
      const response = await $fetch(`${cleanWorkerUrl}/api/menu-akses/user`, {
        method: "GET",
        query: { user_id: userId },
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      return response;
    }

    // Action: save-menu-akses-user
    if (action === "save-menu-akses-user") {
      const { userId, items } = payload;
      const response = await $fetch(`${cleanWorkerUrl}/api/menu-akses/user`, {
        method: "PUT",
        body: { user_id: userId, items },
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    }

    // Action: reset-menu-akses-user
    if (action === "reset-menu-akses-user") {
      const { userId } = payload;
      const response = await $fetch(`${cleanWorkerUrl}/api/menu-akses/user`, {
        method: "DELETE",
        query: { user_id: userId },
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      return response;
    }

    throw createError({
      statusCode: 400,
      statusMessage: `Action tidak valid: ${action}`,
    });
  } catch (error: any) {
    // Jika error sudah berupa createError, throw kembali
    if (error.statusCode) {
      throw error;
    }

    // Tangani error dari $fetch (worker mengembalikan error)
    const statusCode = error?.response?.status || error?.status || 502;
    const errorData = error?.response?._data || error?.data;
    const errorMessage =
      errorData?.error || error.message || "Gagal berkomunikasi dengan server";

    throw createError({
      statusCode,
      statusMessage: errorMessage,
    });
  }
});

// --- Helper JWT functions ---

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
