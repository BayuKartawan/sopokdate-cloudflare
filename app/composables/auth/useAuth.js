import { ref } from "vue";
import { clearUserAndRole } from "~/middleware/auth.global";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { clearSessionCache } from "~/composables/data/useTableData";

// Kredensial pengguna lokal (menggantikan database user di Cloudflare Worker)
const USERS = {
  "bayu2kali@my.my": {
    password: "bayU*Saya",
    role: "admin",
    displayName: "Bayu Administrator",
  },
  "guru@haha.wkwk": {
    password: "haha_haha",
    role: "user",
    displayName: "Guru Madrasah",
  },
};

/**
 * Membuat token JWT tiruan di client-side agar tetap kompatibel dengan middleware dan helper decodeJWT
 */
const signMockJWT = (payload) => {
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

export function useAuth() {
  const isLoading = ref(false);
  const errorMessage = ref("");
  const { Loading } = useNotiflix();

  const userDataCache = ref(new Map());

  // API Configuration â€” via runtimeConfig
  const getApiBaseUrl = () => {
    try {
      const config = useRuntimeConfig();
      return config.public.apiBaseUrl;
    } catch {
      return "";
    }
  };

  const decodeJWT = (token) => {
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

  const isTokenValid = () => {
    const token = localStorage.getItem("user-token");
    if (!token) return false;

    const payload = decodeJWT(token);
    return payload !== null;
  };

  const saveUserToStorage = ({ email, token, role, displayName }) => {
    const finalDisplayName = displayName || email;

    localStorage.setItem("user-token", token);
    localStorage.setItem(
      "user-data",
      JSON.stringify({
        email,
        displayName: finalDisplayName,
        role,
        loginTime: Date.now(),
      }),
    );
    localStorage.setItem("user-role", role);
    localStorage.setItem("user-displayName", finalDisplayName);

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expiryTime = Date.now() + sevenDaysInMs;
    localStorage.setItem("sessionExpiry", expiryTime.toString());
  };

  const clearUserStorage = () => {
    clearUserAndRole();
    clearSessionCache();

    const sessionKeys = [
      "user-token",
      "user-data",
      "user-role",
      "user-displayName",
      "sessionExpiry",
    ];

    sessionKeys.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    userDataCache.value.clear();
  };

  const resetAllLocalStorage = () => {
    clearSessionCache();
    localStorage.clear();
    sessionStorage.clear();
    userDataCache.value.clear();
  };

  const getErrorMessage = (error) => {
    let errorMsg = "Gagal login. Silakan coba lagi.";

    if (error?.message) {
      const msg = error.message.toLowerCase();

      if (msg.includes("email atau password salah")) {
        errorMsg = "Email atau password salah.";
      } else if (msg.includes("verifikasi keamanan gagal")) {
        errorMsg = "Verifikasi keamanan gagal. Silakan coba lagi.";
      } else if (msg.includes("unauthorized") || msg.includes("login gagal")) {
        errorMsg = "Email atau password salah.";
      } else if (msg.includes("network") || msg.includes("fetch")) {
        errorMsg = "Koneksi gagal. Periksa internet Anda.";
      } else if (msg.includes("jwt invalid") || msg.includes("token")) {
        errorMsg = "Sesi tidak valid. Silakan login kembali.";
      } else if (msg.includes("timeout")) {
        errorMsg = "Waktu request habis. Coba lagi.";
      } else {
        errorMsg = error.message;
      }
    }

    return errorMsg;
  };

  const redirectBasedOnRole = (router) => {
    try {
      router.push("/");
    } catch {
      window.location.href = "/";
    }
  };

  const login = async (email, password, router, Notify) => {
    isLoading.value = true;
    errorMessage.value = "";

    try {
      if (!email || !password) {
        throw new Error("Email dan password diperlukan");
      }

      // Simulasi delay jaringan agar terasa natural
      await new Promise((resolve) => setTimeout(resolve, 800));

      const user = USERS[email];

      if (!user || user.password !== password) {
        throw new Error("Email atau password salah.");
      }

      const role = user.role || "user";
      const displayName = user.displayName || email;

      // Generate mock JWT token
      const token = signMockJWT({
        sub: email,
        role: role,
        name: displayName,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 hari
      });

      saveUserToStorage({
        email,
        token,
        role,
        displayName,
      });

      userDataCache.value.set(email, { role, displayName });

      Notify?.success?.(`Login berhasil, selamat datang ${displayName}!`, {
        timeout: 3000,
      });

      setTimeout(() => {
        redirectBasedOnRole(router);
      }, 1000);

      return true;
    } catch (err) {
      userDataCache.value.clear();
      const msg = err.message || "Gagal login. Silakan coba lagi.";
      errorMessage.value = msg;
      Notify?.failure?.(msg, {
        timeout: 4000,
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = ({ router, notiflix, onStart, onFinish }) => {
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

  const logoutDirect = async (router, notiflix) => {
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

  const getUserRole = () => {
    return localStorage.getItem("user-role");
  };

  const getUserData = () => {
    try {
      const userData = localStorage.getItem("user-data");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const getToken = () => {
    return localStorage.getItem("user-token");
  };

  const clearError = () => {
    errorMessage.value = "";
  };

  const clearCache = () => {
    userDataCache.value.clear();
  };

  const isSessionValid = () => {
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
