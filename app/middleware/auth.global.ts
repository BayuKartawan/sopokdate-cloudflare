// middleware/auth.global.ts
// Global middleware yang menggantikan router.beforeEach() dari router/index.js
import { useMenuConfig } from "~/composables/ui/useMenuConfig";

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
  const requiredRole = to.meta.role as string | string[] | undefined;

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

        // Jika role tidak sesuai (mendukung string tunggal maupun array)
        const hasAccess = Array.isArray(requiredRole)
          ? requiredRole.includes(userRole || "")
          : userRole === requiredRole;

        if (!hasAccess) {
          alert("Anda tidak memiliki akses ke halaman ini.");
          return navigateTo("/");
        }
      }

      // Validasi akses menu dinamis dari database (kecuali admin dan halaman beranda)
      const userRoleForAccess = getUserRole(currentUser.email);
      if (userRoleForAccess && userRoleForAccess !== "admin" && to.path !== "/") {
        const { hasRouteAccess } = useMenuConfig();
        if (!hasRouteAccess(to.path, userRoleForAccess)) {
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
const userRoleCache = new Map<string, string>();

/**
 * Fungsi untuk decode JWT token
 */
function decodeJWT(token: string): any | null {
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

interface UserProfile {
  email: string;
  role: string;
  gtkId: any;
  userId: any;
}

/**
 * Fungsi untuk cek apakah user sudah authenticated dengan JWT
 */
function getCurrentUser(): UserProfile | null {
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
    gtkId: payload.gtk_id || null,
    userId: payload.user_id || null,
  };
}

// Kunci yang konsisten untuk localStorage
const ROLE_STORAGE_KEY = "user-role";

/**
 * Get user role from localStorage (sudah disimpan saat login)
 */
function getUserRole(email?: string | null): string | null {
  if (!email) return null;

  // 1. Cek cache memori
  if (userRoleCache.has(email)) {
    return userRoleCache.get(email)!;
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
export function clearUserAndRole(): void {
  userRoleCache.clear();
  localStorage.removeItem(ROLE_STORAGE_KEY);
  localStorage.removeItem("user-token");
  localStorage.removeItem("user-data");
  localStorage.removeItem("user-displayName");
  localStorage.removeItem("user-gtk-id");
  localStorage.removeItem("user-id");
  localStorage.removeItem("sessionExpiry");
  localStorage.removeItem("user-menu-akses");
}
