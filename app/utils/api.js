// utils/api.js

/**
 * Fungsi untuk mendapatkan JWT token dari localStorage
 * @returns {string|null}
 */
const getAuthToken = () => {
  return localStorage.getItem("user-token");
};

/**
 * Fungsi untuk decode JWT token
 * @param {string} token
 * @returns {Object|null}
 */
const decodeJWT = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
};

/**
 * Fungsi untuk handle auto-logout jika token expired
 */
const handleUnauthorized = () => {
  const sessionKeys = [
    "user-token",
    "user-data",
    "user-role",
    "user-displayName",
    "sessionExpiry",
  ];
  sessionKeys.forEach((k) => localStorage.removeItem(k));
  window.location.href = "/login";
};

/**
 * Fungsi fetch untuk API utama melalui proxy lokal Nuxt
 */
export const fetchFromApi = async (
  table,
  force = false,
  signal = null,
  queryParams = {},
) => {
  const token = getAuthToken();

  if (!token) {
    handleUnauthorized();
    throw new Error("No authentication token found");
  }

  // Validate token di client-side
  const payload = decodeJWT(token);
  if (!payload) {
    handleUnauthorized();
    throw new Error("Token expired or invalid");
  }

  let url = table
    ? `/api/data-proxy?type=utama&table=${encodeURIComponent(table)}`
    : `/api/data-proxy?type=utama`;

  if (force) {
    url += "&nocache=true";
  }

  for (const [key, val] of Object.entries(queryParams)) {
    if (val !== undefined && val !== null) {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
    }
  }

  // Fetch ke proxy lokal Nuxt dengan menyertakan token JWT
  const response = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(force ? { "Cache-Control": "no-cache" } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch data ${table ? "for table " + table : ""} from backend proxy`,
    );
  }

  return response.json();
};

/**
 * Fungsi fetch untuk API surat melalui proxy lokal Nuxt
 */
export const fetchFromSuratApi = async (force = false, signal = null) => {
  const token = getAuthToken();

  if (!token) {
    handleUnauthorized();
    throw new Error("No authentication token found");
  }

  // Validate token di client-side
  const payload = decodeJWT(token);
  if (!payload) {
    handleUnauthorized();
    throw new Error("Token expired or invalid");
  }

  const url = `/api/data-proxy?type=surat${force ? "&nocache=true" : ""}`;

  // Fetch ke proxy lokal Nuxt dengan menyertakan token JWT
  const response = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(force ? { "Cache-Control": "no-cache" } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch surat data from backend proxy");
  }

  return response.json();
};

/**
 * Fungsi untuk login (deprecated, handled locally now)
 */
export const loginApi = async (email, password) => {
  throw new Error(
    "loginApi is deprecated. Authentication is now handled locally.",
  );
};

/**
 * Helper untuk fetch dengan authentication (generic)
 * @param {string} url - Full URL untuk fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();

  if (!token) {
    handleUnauthorized();
    throw new Error("No authentication token found");
  }

  // Validate token
  const payload = decodeJWT(token);
  if (!payload) {
    handleUnauthorized();
    throw new Error("Token expired or invalid");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Session expired. Please login again.");
  }

  return response;
};

/**
 * Fungsi untuk mengirim data ke API utama melalui proxy lokal Nuxt (POST)
 */
export const postToApi = async (table, data) => {
  const token = getAuthToken();

  if (!token) {
    handleUnauthorized();
    throw new Error("No authentication token found");
  }

  // Validate token di client-side
  const payload = decodeJWT(token);
  if (!payload) {
    handleUnauthorized();
    throw new Error("Token expired or invalid");
  }

  const url = "/api/data-proxy";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "utama",
      table,
      data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send data to table ${table}`);
  }

  return response.json();
};

/**
 * Fungsi untuk mengupdate data di API utama melalui proxy lokal Nuxt (PUT)
 */
export const putToApi = async (table, id, data) => {
  const token = getAuthToken();

  if (!token) {
    handleUnauthorized();
    throw new Error("No authentication token found");
  }

  const payload = decodeJWT(token);
  if (!payload) {
    handleUnauthorized();
    throw new Error("Token expired or invalid");
  }

  const url = "/api/data-proxy";

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ table, id, data }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.statusMessage || `Failed to update data in table ${table}`);
  }

  return response.json();
};

/**
 * Fungsi untuk menghapus data di API utama melalui proxy lokal Nuxt (DELETE)
 */
export const deleteFromApi = async (table, id) => {
  const token = getAuthToken();

  if (!token) {
    handleUnauthorized();
    throw new Error("No authentication token found");
  }

  const payload = decodeJWT(token);
  if (!payload) {
    handleUnauthorized();
    throw new Error("Token expired or invalid");
  }

  const url = "/api/data-proxy";

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ table, id }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.statusMessage || `Failed to delete data from table ${table}`);
  }

  return response.json();
};
