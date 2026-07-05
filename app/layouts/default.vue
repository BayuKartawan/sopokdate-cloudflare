<template>
  <div>
    <!-- Navigation components (conditional based on login status) -->
    <template v-if="isLoggedIn">
      <!-- Navbar -->
      <Navbar
        :isSidebarOpen="isSidebarOpen"
        @toggleSidebar="toggleSidebar"
        :class="{ 'lg:pl-64': isSidebarOpen && !isMobileView }"
        class="transition-all duration-300"
      />

      <!-- Sidebar (Desktop) -->
      <Sidebar v-if="!isMobileView" :isSidebarOpen="isSidebarOpen" @closeSidebar="closeSidebar" />

      <!-- Mobile Menu Modal (Mobile) -->
      <MobileMenuModal v-else :isOpen="isSidebarOpen" @close="closeSidebar" />
    </template>

    <!-- Main content -->
    <main
      :class="[
        isLoggedIn ? 'pt-0 pb-16 lg:pt-16 lg:pb-0 safe-area-main' : '',
        {
          'lg:pl-64': isSidebarOpen && !isMobileView && isLoggedIn,
        },
      ]"
      class="flex-grow transition-all duration-300 min-h-screen"
    >
      <slot />
    </main>

    <Footer
      v-if="isLoggedIn"
      :class="{ 'lg:pl-64': isSidebarOpen && !isMobileView }"
      class="transition-all duration-300"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAuth } from "~/composables/auth/useAuth";

import Navbar from "~/components/layout/Navbar.vue";
import Sidebar from "~/components/layout/Sidebar.vue";
import MobileMenuModal from "~/components/layout/MobileMenuModal.vue";
import Footer from "~/components/layout/Footer.vue";

const router = useRouter();
const { logoutDirect, isTokenValid, decodeJWT, resetAllLocalStorage, refreshMenuAccess } =
  useAuth();

// --- State
const user = ref(null);
const isSidebarOpen = ref(false);
const isMobileView = ref(false);

// --- Computed Properties
const isLoggedIn = computed(() => !!user.value);

// --- Functions

/**
 * Check apakah user sedang login dengan validasi JWT
 */
const checkUserAuth = () => {
  const token = localStorage.getItem("user-token");

  if (!token) {
    user.value = null;
    return;
  }

  // Validasi token dengan decode JWT
  if (isTokenValid()) {
    const payload = decodeJWT(token);

    if (payload) {
      // Set user dari JWT payload
      user.value = {
        email: payload.sub,
        role: payload.role,
      };
    } else {
      user.value = null;
    }
  } else {
    user.value = null;
  }
};

/**
 * Check session expiry dan logout jika expired
 */
const checkSessionExpiry = () => {
  const userToken = localStorage.getItem("user-token");
  const expiryTime = localStorage.getItem("sessionExpiry");

  if (userToken && expiryTime && Date.now() > parseInt(expiryTime, 10)) {
    logoutDirect(router);
    user.value = null;
    return false;
  }

  return true;
};

/**
 * Check last visit and reset storage if > 1 week
 */
const checkLastVisit = () => {
  const lastVisit = localStorage.getItem("lastVisit");
  const currentTime = Date.now();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  if (lastVisit) {
    const timeDiff = currentTime - parseInt(lastVisit, 10);
    if (timeDiff > sevenDaysInMs) {
      resetAllLocalStorage();
      window.location.reload();
      return false;
    }
  }

  // Update last visit
  localStorage.setItem("lastVisit", currentTime.toString());
  return true;
};

/**
 * Check viewport size untuk responsive sidebar
 */
const checkViewport = () => {
  isMobileView.value = window.innerWidth < 1024;
  isSidebarOpen.value = !isMobileView.value;
};

/**
 * Toggle sidebar open/close
 */
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

/**
 * Close sidebar (untuk mobile)
 */
const closeSidebar = () => {
  isSidebarOpen.value = false;
};

/**
 * Handle window resize
 */
const handleResize = () => {
  checkViewport();
  if (isMobileView.value && isSidebarOpen.value) {
    closeSidebar();
  } else if (!isMobileView.value && !isSidebarOpen.value) {
    isSidebarOpen.value = true;
  }
};

// --- Lifecycle Hooks

onMounted(() => {
  // 0. Check last visit (1 week inactivity reset)
  const isVisitValid = checkLastVisit();
  if (!isVisitValid) return;

  // 1. Check session expiry dulu
  const isSessionValid = checkSessionExpiry();

  if (!isSessionValid) {
    // Jika session expired, stop execution
    return;
  }

  // 2. Check user authentication dengan JWT
  checkUserAuth();

  // 3. Check viewport
  checkViewport();

  // 4. Add resize listener
  window.addEventListener("resize", handleResize);

  // 5. Re-check auth on route changes and refresh menu access
  const stopWatchRoute = router.afterEach(() => {
    checkUserAuth();
    refreshMenuAccess();
  });

  // 6. Listen to storage events (untuk multi-tab logout sync)
  const handleStorageChange = (e) => {
    if (e.key === "user-token" && !e.newValue) {
      user.value = null;
      router.push("/login");
    } else if (e.key === "user-token" && e.newValue) {
      checkUserAuth();
    }
  };
  window.addEventListener("storage", handleStorageChange);

  // 7. Initial menu access refresh
  refreshMenuAccess();

  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("storage", handleStorageChange);
    stopWatchRoute();
  });
});
</script>
