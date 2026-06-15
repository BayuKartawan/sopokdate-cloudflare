// middleware/auth.global.js
// Global middleware yang menggantikan router.beforeEach() dari router/index.js

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware di server (SPA mode tetap, tapi safety check)
  if (import.meta.server) return;

  // --- Sliding Session ---
  const userToken = localStorage.getItem("user-token");

  if (userToken) {
    const payload = decodeJWT(userToken);

    // Jika token masih valid, perbarui sessionExpiry di localStorage
    if (payload) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const newExpiryTime = Date.now() + sevenDaysInMs;
      localStorage.setItem("sessionExpiry", newExpiryTime.toString());
    }
  }

  // --- Main Auth Guard ---
  const requiresAuth = to.meta.requiresAuth !== false; // default true
  const requiredRole = to.meta.role;

  try {
    // Get current user dari JWT
    const currentUser = getCurrentUser();

    // 1. Jika user sudah login tapi mencoba akses /login, redirect ke home
    if (to.path === "/login" && currentUser) {
      return navigateTo("/");
    }

    // 2. Logika untuk rute yang memerlukan otentikasi
    if (requiresAuth) {
      // Jika butuh auth tapi user tidak ada atau token invalid
      if (!currentUser) {
        return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
      }

      // Jika butuh role spesifik, periksa rolenya
      if (requiredRole) {
        const userRole = getUserRole(currentUser.email);

        // Jika role tidak sesuai
        if (userRole !== requiredRole) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          return navigateTo("/");
        }
      }
    }
    // Rute public, langsung lanjut
  } catch {
    // Jika ada error, redirect ke login untuk keamanan
    clearUserAndRole();
    return navigateTo("/login");
  }
});

// --- Helper Functions (dipindahkan dari router/index.js) ---

// Cache untuk menyimpan role user
const userRoleCache = new Map();

/**
 * Fungsi untuk decode JWT token
 */
function decodeJWT(token) {
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
}

/**
 * Fungsi untuk cek apakah user sudah authenticated dengan JWT
 */
function getCurrentUser() {
  const token = localStorage.getItem("user-token");

  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);

  if (!payload) {
    // Token invalid atau expired, clear storage
    clearUserAndRole();
    return null;
  }

  return {
    email: payload.sub,
    role: payload.role,
  };
}

// Kunci yang konsisten untuk localStorage
const ROLE_STORAGE_KEY = "user-role";

/**
 * Get user role from localStorage (sudah disimpan saat login)
 */
function getUserRole(email) {
  if (!email) return null;

  // 1. Cek cache memori
  if (userRoleCache.has(email)) {
    return userRoleCache.get(email);
  }

  // 2. Cek localStorage
  const roleFromLocalStorage = localStorage.getItem(ROLE_STORAGE_KEY);
  if (roleFromLocalStorage) {
    userRoleCache.set(email, roleFromLocalStorage);
    return roleFromLocalStorage;
  }

  return null;
}

/**
 * Fungsi untuk clear user data dan role
 */
export function clearUserAndRole() {
  userRoleCache.clear();
  localStorage.removeItem(ROLE_STORAGE_KEY);
  localStorage.removeItem("user-token");
  localStorage.removeItem("user-data");
  localStorage.removeItem("user-displayName");
  localStorage.removeItem("sessionExpiry");
}
