<template>
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden"
    :style="{ backgroundColor: 'var(--bg-surface)' }">
    <!-- Decorative background elements removed to avoid-->

    <div class="container mx-auto px-4 relative z-10">
      <div class="max-w-[360px] w-full mx-auto group">
        <!-- Glow wrapper removed to avoid -->

        <div class="card rounded-2xl p-6 sm:p-8 border shadow-2xl transition-all duration-300 relative overflow-hidden"
          :style="{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
          }">
          <div class="flex flex-col items-stretch gap-6">
            <div class="text-center sm:text-left">
              <h1
                class="text-2xl sm:text-3xl font-semibold tracking-tight flex items-baseline justify-center sm:justify-start"
                :style="{ color: 'var(--text-heading)' }">
                {{ appName }}
              </h1>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" class="w-full flex flex-col gap-4" id="loginForm">
              <!-- Username (floating label) -->
              <div class="relative">
                <input type="text" id="email" v-model="email" placeholder=" " required
                  class="peer w-full h-11 px-3.5 pt-4 pb-1 rounded-lg border placeholder-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 text-sm"
                  :style="{
                    backgroundColor: 'var(--bg-input-alpha)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }" />
                <label for="email"
                  class="absolute left-3.5 top-2 text-sm pointer-events-none transition-all duration-200 origin-left -translate-y-4 scale-75 z-10 px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-emerald-500 dark:peer-focus:text-emerald-400"
                  :style="{
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-primary)',
                  }">
                  Username
                </label>
              </div>

              <!-- Password (floating label + visibility) -->
              <div class="relative">
                <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder=" "
                  required
                  class="peer w-full h-11 px-3.5 pt-4 pb-1 pr-10 rounded-lg border placeholder-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-300 text-sm"
                  :style="{
                    backgroundColor: 'var(--bg-input-alpha)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }" />
                <label for="password"
                  class="absolute left-3.5 top-2 text-sm pointer-events-none transition-all duration-200 origin-left -translate-y-4 scale-75 z-10 px-1 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-emerald-500 dark:peer-focus:text-emerald-400"
                  :style="{
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-primary)',
                  }">
                  Password
                </label>

                <button type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-3.5 focus:outline-none group/btn"
                  @click="togglePasswordVisibility">
                  <IconEye v-if="!showPassword" class="h-4 w-4 transition-colors duration-300"
                    :style="{ color: 'var(--text-secondary)' }" />
                  <IconEyeSlash v-else class="h-4 w-4 transition-colors duration-300"
                    :style="{ color: 'var(--text-secondary)' }" />
                </button>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage"
                class="p-3 rounded-lg bg-red-950/40 border border-red-800/60 transition-all duration-300">
                <p class="text-red-400 text-sm font-medium flex items-center">
                  <CircleX class="w-4 h-4 mr-2 shrink-0" />
                  {{ errorMessage }}
                </p>
              </div>

              <!-- Submit -->
              <div class="mt-2">
                <button type="submit" :disabled="isLoading"
                  class="w-full h-11 rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-950/20">
                  <span v-if="isLoading" class="flex items-center justify-center">
                    <Loader2 class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Memproses...
                  </span>
                  <span v-else class="flex items-center justify-center">
                    <LogIn class="w-4 h-4 mr-2" stroke-width="2" />
                    Masuk ke Sistem
                  </span>
                </button>
              </div>

              <!-- Divider -->
              <div class="relative flex py-1 items-center">
                <div class="flex-grow border-t" :style="{ borderColor: 'var(--border-primary)' }"></div>
                <span class="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider"
                  :style="{ color: 'var(--text-faint)' }">Atau</span>
                <div class="flex-grow border-t" :style="{ borderColor: 'var(--border-primary)' }"></div>
              </div>

              <!-- Barcode Login Trigger -->
              <div>
                <button type="button" @click="openScanModal"
                  class="w-full h-11 rounded-lg border text-sm font-semibold transition-all duration-300 flex items-center justify-center cursor-pointer gap-2"
                  :style="{
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }">
                  <ScanBarcode class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Scan Barcode / QR
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Barcode Scanner Modal -->
    <div v-if="showScanModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div class="border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        :style="{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        }">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b" :style="{ borderColor: 'var(--border-primary)' }">
          <h3 class="text-sm font-semibold flex items-center gap-2" :style="{ color: 'var(--text-primary)' }">
            <ScanBarcode class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Masuk dengan Barcode / QR
          </h3>
          <button type="button" @click="closeScanModal" class="focus:outline-none cursor-pointer"
            :style="{ color: 'var(--text-secondary)' }">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-5 flex flex-col gap-4 items-center justify-center">
          <div class="relative w-full max-w-[280px] aspect-square overflow-hidden rounded-xl border" :style="{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-surface)',
          }">
            <div id="reader" class="w-full h-full"></div>
          </div>
          <p class="text-[11px] text-center px-2" :style="{ color: 'var(--text-muted)' }">
            Posisikan QR code / barcode di depan kamera.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from "vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { useAuth } from "~/composables/auth/useAuth";
import {
  Eye as IconEye,
  EyeOff as IconEyeSlash,
  Loader2,
  LogIn,
  CircleX,
  ScanBarcode,
  X,
} from "lucide-vue-next";

definePageMeta({
  layout: "auth",
  requiresAuth: false,
});

// Inject tema dari runtimeConfig
const config = useRuntimeConfig();
const appName = config.public.appName;

// Membuat instance notiflix
const notiflixInstance = useNotiflix();

// Router instance
const router = useRouter();

// Menggunakan composable useAuth
const { login, isLoading, errorMessage } = useAuth();

// Form data
const email = ref<string>("");
const password = ref<string>("");
const showPassword = ref<boolean>(false);

// Scanner states
const showScanModal = ref<boolean>(false);
let html5QrcodeInstance: any = null;

// Toggle visibilitas password
const togglePasswordVisibility = (): void => {
  showPassword.value = !showPassword.value;
};

// Handle login form submission
const handleLogin = async (): Promise<void> => {
  try {
    await login(email.value, password.value, router, notiflixInstance.Notify);

    // Reset form setelah login sukses
    email.value = "";
    password.value = "";
  } catch {
    if (notiflixInstance && notiflixInstance.Notify) {
      notiflixInstance.Notify.failure("Terjadi kesalahan saat login");
    }
  }
};

// Scanner methods
const openScanModal = (): void => {
  showScanModal.value = true;
  nextTick(() => {
    startCameraScanner();
  });
};

const closeScanModal = (): void => {
  stopCameraScanner();
  showScanModal.value = false;
};

const startCameraScanner = async (): Promise<void> => {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");

    if (!html5QrcodeInstance) {
      html5QrcodeInstance = new Html5Qrcode("reader");
    }

    if (html5QrcodeInstance.isScanning) {
      return;
    }

    await html5QrcodeInstance.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: (width: number, height: number) => {
          return {
            width: Math.min(width * 0.8, 240),
            height: Math.min(height * 0.8, 240),
          };
        },
      },
      (decodedText: string) => {
        handleScanSuccess(decodedText);
      },
      () => {
        // Quiet scanner verbose logs
      },
    );
  } catch (err) {
    console.error("Gagal memulai kamera scanner:", err);
    if (notiflixInstance && notiflixInstance.Notify) {
      notiflixInstance.Notify.failure("Gagal mengakses kamera");
    }
  }
};

const stopCameraScanner = async (): Promise<void> => {
  if (html5QrcodeInstance && html5QrcodeInstance.isScanning) {
    try {
      await html5QrcodeInstance.stop();
    } catch (err) {
      console.error("Gagal menghentikan kamera scanner:", err);
    }
  }
};

const handleScanSuccess = async (decodedText: string): Promise<void> => {
  closeScanModal();

  let parsedEmail = "";
  let parsedPassword = "";

  try {
    const textTrimmed = decodedText.trim();
    if (textTrimmed.startsWith("{") && textTrimmed.endsWith("}")) {
      const data = JSON.parse(textTrimmed);
      parsedEmail = data.email || data.username || "";
      parsedPassword = data.password || "";
    } else {
      const separators = ["|", ":", ";", ","];
      let parts = [textTrimmed];

      for (const sep of separators) {
        if (textTrimmed.includes(sep)) {
          parts = textTrimmed.split(sep);
          break;
        }
      }

      if (parts.length >= 2) {
        parsedEmail = parts[0].trim();
        parsedPassword = parts[1].trim();
      }
    }
  } catch (e) {
    console.error("Gagal memproses barcode data:", e);
  }

  if (parsedEmail && parsedPassword) {
    email.value = parsedEmail;
    password.value = parsedPassword;

    if (notiflixInstance && notiflixInstance.Notify) {
      notiflixInstance.Notify.success(
        "Barcode berhasil terbaca, memproses login...",
      );
    }

    await handleLogin();
  } else {
    if (notiflixInstance && notiflixInstance.Notify) {
      notiflixInstance.Notify.failure("Format barcode tidak valid");
    }
  }
};

// Clean up scanner on unmount
onBeforeUnmount(() => {
  stopCameraScanner();
});
</script>
