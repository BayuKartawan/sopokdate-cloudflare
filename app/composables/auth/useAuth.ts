import { ref } from "vue";
import { clearUserAndRole } from "~/middleware/auth.global";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { clearSessionCache } from "~/composables/data/useTableData";

/**
 * Membuat token JWT tiruan di client-side agar tetap kompatibel dengan middleware dan helper decodeJWT
 */
const signMockJWT = (payload: any): string => {
  try {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const body = btoa(JSON.stringify(payload))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    return `${header}.${body}.mocksignature`;
  } catch (e) {
    console.error("Failed to generate mock JWT:", e);
    return "invalid.token.mock";
  }
};

interface UserData {
  email: string;
  displayName: string;
  role: string;
  gtkId: number | null;
  userId: number | null;
  loginTime: number;
}

export function useAuth() {
  const isLoading = ref(false);
  const errorMessage = ref("");
  const { Loading } = useNotiflix();

  const userDataCache = ref(
    new Map<string, { role: string; displayName: string }>(),
  );

  // API Configuration — via runtimeConfig
  const getApiBaseUrl = (): string => {
    try {
      const config = useRuntimeConfig();
      return (config.public as any).apiBaseUrl || "";
    } catch {
      return "";
    }
  };

  const decodeJWT = (token: string): any | null => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }

      return payload;
    } catch {
      return null;
    }
  };

  const isTokenValid = (): boolean => {
    const token = localStorage.getItem("user-token");
    if (!token) return false;

    const payload = decodeJWT(token);
    return payload !== null;
  };

  const saveUserToStorage = ({
    email,
    token,
    role,
    displayName,
    gtkId,
    userId,
  }: {
    email: string;
    token: string;
    role: string;
    displayName?: string | null;
    gtkId?: number | string | null;
    userId?: number | string | null;
  }): void => {
    const finalDisplayName = displayName || email;

    localStorage.setItem("user-token", token);
    localStorage.setItem(
      "user-data",
      JSON.stringify({
        email,
        displayName: finalDisplayName,
        role,
        gtkId: gtkId ? Number(gtkId) : null,
        userId: userId ? Number(userId) : null,
        loginTime: Date.now(),
      } as UserData),
    );
    localStorage.setItem("user-role", role);
    localStorage.setItem("user-displayName", finalDisplayName);

    // Simpan gtk_id terpisah untuk akses cepat
    if (gtkId) {
      localStorage.setItem("user-gtk-id", String(gtkId));
    }
    if (userId) {
      localStorage.setItem("user-id", String(userId));
    }

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expiryTime = Date.now() + sevenDaysInMs;
    localStorage.setItem("sessionExpiry", expiryTime.toString());
  };

  const clearUserStorage = (): void => {
    clearUserAndRole();
    clearSessionCache();

    const sessionKeys = [
      "user-token",
      "user-data",
      "user-role",
      "user-displayName",
      "user-gtk-id",
      "user-id",
      "sessionExpiry",
      "user-menu-akses",
    ];

    sessionKeys.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    userDataCache.value.clear();
  };

  const resetAllLocalStorage = (): void => {
    clearSessionCache();
    localStorage.clear();
    sessionStorage.clear();
    userDataCache.value.clear();
  };

  const getErrorMessage = (error: any): string => {
    let errorMsg = "Gagal login. Silakan coba lagi.";

    if (error?.message) {
      const msg = String(error.message).toLowerCase();

      if (
        msg.includes("email atau password salah") ||
        msg.includes("username atau password salah")
      ) {
        errorMsg = "Username atau password salah.";
      } else if (msg.includes("verifikasi keamanan gagal")) {
        errorMsg = "Verifikasi keamanan gagal. Silakan coba lagi.";
      } else if (msg.includes("unauthorized") || msg.includes("login gagal")) {
        errorMsg = "Username atau password salah.";
      } else if (msg.includes("network") || msg.includes("fetch")) {
        errorMsg = "Koneksi gagal. Periksa internet Anda.";
      } else if (msg.includes("jwt invalid") || msg.includes("token")) {
        errorMsg = "Sesi tidak valid. Silakan login kembali.";
      } else if (msg.includes("timeout")) {
        errorMsg = "Waktu request habis. Coba lagi.";
      } else if (msg.includes("tidak aktif")) {
        errorMsg = "Akun tidak aktif. Hubungi admin.";
      } else {
        errorMsg = error.message;
      }
    }

    return errorMsg;
  };

  const redirectBasedOnRole = (router: any): void => {
    try {
      router.push("/");
    } catch {
      window.location.href = "/";
    }
  };

  /**
   * Login — verifikasi credential via server proxy ke Cloudflare Worker D1
   */
  const login = async (
    username?: string,
    password?: string,
    router?: any,
    Notify?: any,
  ): Promise<boolean> => {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      if (!username || !password) {
        throw new Error("Username dan password diperlukan");
      }

      // Kirim ke auth proxy → Cloudflare Worker → D1
      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.statusMessage ||
            errData.error ||
            "Username atau password salah.",
        );
      }

      const result = await response.json();

      if (!result.success || !result.user) {
        throw new Error("Login gagal. Silakan coba lagi.");
      }

      const user = result.user;
      const role = user.role || "guru";
      const displayName = user.display_name || username;

      // Generate mock JWT token (dengan gtk_id dan user_id)
      const token = signMockJWT({
        sub: username,
        role: role,
        name: displayName,
        gtk_id: user.gtk_id || null,
        user_id: user.id,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 hari
      });

      saveUserToStorage({
        email: username,
        token,
        role,
        displayName,
        gtkId: user.gtk_id,
        userId: user.id,
      });

      userDataCache.value.set(username, { role, displayName });

      // Fetch akses menu dari database dan simpan di localStorage
      try {
        const menuResponse = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "get-my-menu-akses" }),
        });

        if (menuResponse.ok) {
          const menuResult = await menuResponse.json();
          if (menuResult.success && menuResult.allowed_menus) {
            localStorage.setItem(
              "user-menu-akses",
              JSON.stringify(menuResult.allowed_menus),
            );
          }
        }
      } catch (menuErr) {
        // Jika gagal fetch menu akses, biarkan — fallback ke static roles
        console.warn("Gagal memuat pengaturan akses menu:", menuErr);
      }

      Notify?.success?.(`Login berhasil, selamat datang ${displayName}!`, {
        timeout: 3000,
      });

      setTimeout(() => {
        redirectBasedOnRole(router);
      }, 1000);

      return true;
    } catch (err) {
      userDataCache.value.clear();
      const msg = getErrorMessage(err);
      errorMessage.value = msg;
      Notify?.failure?.(msg, {
        timeout: 4000,
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = ({
    router,
    notiflix,
    onStart,
    onFinish,
  }: {
    router: any;
    notiflix: any;
    onStart?: () => void;
    onFinish?: () => void;
  }): void => {
    if (!notiflix || !notiflix.Confirm) {
      return;
    }

    notiflix.Confirm.show(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar?",
      "Ya, Keluar",
      "Batal",
      async () => {
        isLoading.value = true;
        onStart?.();

        try {
          notiflix.Loading?.standard?.("Sedang keluar...", {
            backgroundColor: "#18181b",
            messageColor: "#f4f4f5",
          });

          clearUserStorage();

          notiflix.Loading?.remove?.();
          notiflix.Notify?.success?.("Berhasil keluar", {
            position: "right-top",
            timeout: 2000,
          });

          await router.push("/login");
        } catch {
          notiflix.Loading?.remove?.();
          notiflix.Notify?.failure?.("Gagal keluar, silakan coba lagi", {
            position: "right-top",
            timeout: 3000,
          });
        } finally {
          isLoading.value = false;
          onFinish?.();
        }
      },
      () => {},
    );
  };

  const logoutDirect = async (router: any, notiflix: any): Promise<boolean> => {
    isLoading.value = true;

    try {
      notiflix?.Loading?.standard?.("Sedang keluar...", {
        backgroundColor: "#18181b",
        messageColor: "#f4f4f5",
      });

      clearUserStorage();

      notiflix?.Loading?.remove?.();
      await router.push("/login");
      return true;
    } catch {
      notiflix?.Loading?.remove?.();
      notiflix?.Notify?.failure?.("Gagal keluar, silakan coba lagi", {
        position: "right-top",
        timeout: 3000,
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const getUserRole = (): string | null => {
    return localStorage.getItem("user-role");
  };

  const getUserData = (): UserData | null => {
    try {
      const userData = localStorage.getItem("user-data");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const getGtkId = (): string | null => {
    return localStorage.getItem("user-gtk-id");
  };

  const getToken = (): string | null => {
    return localStorage.getItem("user-token");
  };

  const clearError = (): void => {
    errorMessage.value = "";
  };

  const clearCache = (): void => {
    userDataCache.value.clear();
  };

  const isSessionValid = (): boolean => {
    const expiry = localStorage.getItem("sessionExpiry");
    if (!expiry) return false;

    const expiryTime = parseInt(expiry);
    const currentTime = Date.now();

    return currentTime < expiryTime && isTokenValid();
  };

  return {
    isLoading,
    errorMessage,

    login,
    logout,
    logoutDirect,
    getUserRole,
    getUserData,
    getGtkId,
    getToken,
    saveUserToStorage,
    clearUserStorage,
    resetAllLocalStorage,

    getErrorMessage,
    redirectBasedOnRole,
    isTokenValid,
    isSessionValid,
    decodeJWT,
    clearError,
    clearCache,
  };
}
