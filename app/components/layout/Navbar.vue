<template>
  <!-- Main Header / Navbar Container -->
  <header
    class="fixed z-40 transition-all duration-300 ease-in-out bottom-3 inset-x-3 max-w-sm sm:max-w-md mx-auto rounded-2xl border shadow-xl backdrop-blur-lg lg:bottom-auto lg:top-0 lg:inset-x-0 lg:max-w-none lg:mx-0 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:shadow-none"
    :style="{
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-primary)',
    }"
    :class="isNavbarVisible ? 'translate-y-0' : 'translate-y-28 lg:translate-y-0'"
  >
    <!-- ============================================================ -->
    <!-- 1. MOBILE VIEW (Floating Dock with Beranda, Akun, Menu)      -->
    <!-- ============================================================ -->
    <div class="flex lg:hidden items-center justify-around p-1.5 h-15">
      <!-- 1. Beranda -->
      <NuxtLink
        to="/"
        @click="handleHomeClick"
        class="flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 select-none"
        :class="isHomeActive
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/12 dark:bg-emerald-500/15 font-semibold'
          : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'"
        aria-label="Beranda"
      >
        <Home class="w-5 h-5 transition-transform duration-200" :class="{ 'scale-110': isHomeActive }" />
        <span class="text-[10px] sm:text-[11px] leading-tight mt-0.5 font-medium">Beranda</span>
      </NuxtLink>

      <!-- 2. Akun (with dropdown) -->
      <div class="flex-1 relative flex justify-center" ref="mobileUserDropdownRef">
        <button
          @click="toggleUserDropdown"
          class="w-full flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 select-none"
          :class="isUserDropdownOpen
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/12 dark:bg-emerald-500/15 font-semibold'
            : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'"
          aria-label="Menu Akun"
        >
          <UserCircle class="w-5 h-5 transition-transform duration-200" :class="{ 'scale-110': isUserDropdownOpen }" />
          <span class="text-[10px] sm:text-[11px] leading-tight mt-0.5 font-medium">Akun</span>
        </button>

        <!-- Mobile User Dropdown Popover -->
        <Transition name="dropdown-slide-up">
          <div
            v-if="isUserDropdownOpen"
            class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 sm:w-52 rounded-2xl shadow-2xl border z-50 p-1.5 backdrop-blur-xl"
            :style="{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }"
          >
            <div class="flex flex-col gap-1">
              <!-- Profil Button (Hanya guru) -->
              <NuxtLink
                v-if="userRole === 'guru' && gtkId"
                :to="`/akademik/gtk/detail/${gtkId}`"
                @click="isUserDropdownOpen = false"
                class="flex w-full items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-(--bg-tertiary) active:scale-95"
                :style="{ color: 'var(--text-primary)' }"
                aria-label="Profil"
              >
                <UserCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span class="text-xs font-medium">Profil</span>
              </NuxtLink>

              <!-- Divider -->
              <div
                v-if="userRole === 'guru' && gtkId"
                class="border-t my-0.5 mx-1"
                :style="{ borderColor: 'var(--border-subtle)' }"
              ></div>

              <!-- Logout Button -->
              <button
                @click="handleLogout"
                class="flex w-full items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-red-500/10 active:scale-95 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                aria-label="Logout"
                :disabled="isLoggingOut"
              >
                <Loader2 v-if="isLoggingOut" class="w-5 h-5 animate-spin mx-auto" />
                <template v-else>
                  <SignOut class="w-5 h-5 transition-transform duration-200" />
                  <span class="text-xs font-medium">Keluar</span>
                </template>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 3. Menu (Sidebar / Modal Toggle) -->
      <button
        @click="toggleSidebar"
        class="flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 select-none"
        :class="isSidebarOpen
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/12 dark:bg-emerald-500/15 font-semibold'
          : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'"
        :aria-label="isSidebarOpen ? 'Tutup Menu' : 'Buka Menu'"
      >
        <Menu v-if="!isSidebarOpen" class="w-5 h-5 transition-transform duration-200 hover:scale-105" />
        <X v-else class="w-5 h-5 transition-transform duration-200 rotate-90 scale-105" />
        <span class="text-[10px] sm:text-[11px] leading-tight mt-0.5 font-medium">
          {{ isSidebarOpen ? 'Tutup' : 'Menu' }}
        </span>
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- 2. DESKTOP VIEW (Top Bar with Sidebar Toggle, Center Label, Account) -->
    <!-- ============================================================ -->
    <div
      class="hidden lg:flex max-w-7xl mx-auto justify-between items-center h-16 px-4"
      :style="{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }"
    >
      <!-- Bagian 1: Sidebar Toggle -->
      <div class="flex items-center space-x-4 shrink-0">
        <button
          @click="toggleSidebar"
          class="flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:bg-(--bg-tertiary)"
          :style="{ color: 'var(--text-primary)' }"
          :aria-label="isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'"
        >
          <Menu v-if="!isSidebarOpen" class="w-6 h-6 transform transition-all duration-300 hover:translate-x-0.5" />
          <X v-if="isSidebarOpen" class="w-6 h-6 transform transition-all duration-300 hover:rotate-90" />
        </button>
      </div>

      <!-- Bagian 2: Logo/Teks Info Halaman di Tengah -->
      <div class="flex-1 flex justify-center px-2 min-w-0">
        <div class="text-center truncate max-w-full">
          <span
            class="inline-block text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-mono tracking-tight sm:tracking-wider px-3 py-1 rounded-md truncate max-w-full"
            :style="{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-primary)',
            }"
          >
            {{ activeMenuLabel }}
          </span>
        </div>
      </div>

      <!-- Bagian 3: User Dropdown (Desktop) -->
      <div class="flex items-center space-x-4 shrink-0">
        <div class="relative" ref="desktopUserDropdownRef">
          <button
            @click="toggleUserDropdown"
            class="flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:bg-(--bg-tertiary)"
            :class="{ 'bg-(--bg-tertiary)': isUserDropdownOpen }"
            :style="{ color: 'var(--text-primary)' }"
            aria-label="User Menu"
          >
            <UserCircle class="w-6 h-6" />
          </button>

          <!-- Dropdown Menu Desktop -->
          <div
            v-if="isUserDropdownOpen"
            class="absolute w-44 rounded-lg shadow-lg border z-50 p-1 top-full mt-2 right-0"
            :style="{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }"
          >
            <div class="flex flex-col gap-0.5">
              <NuxtLink
                v-if="userRole === 'guru' && gtkId"
                :to="`/akademik/gtk/detail/${gtkId}`"
                @click="isUserDropdownOpen = false"
                class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-(--bg-tertiary)"
                :style="{ color: 'var(--text-primary)' }"
                aria-label="Profil"
              >
                <div class="flex items-center space-x-2">
                  <UserCircle class="w-5 h-5 transition-transform duration-300" />
                  <span class="font-medium">Profil</span>
                </div>
              </NuxtLink>

              <div
                v-if="userRole === 'guru' && gtkId"
                class="border-t my-0.5 mx-1"
                :style="{ borderColor: 'var(--border-subtle)' }"
              ></div>

              <button
                @click="handleLogout"
                class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-(--bg-tertiary) text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300"
                aria-label="Logout"
                :disabled="isLoggingOut"
              >
                <Loader2 v-if="isLoggingOut" class="w-5 h-5 animate-spin mx-auto" />
                <div v-else class="flex items-center space-x-2">
                  <SignOut class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span class="font-medium">Keluar</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  Home,
  UserCircle,
  Menu,
  X,
  LogOut as SignOut,
  Loader2,
} from "lucide-vue-next";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";

import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";

interface FlatMenuItem {
  to: string;
  label: string;
}

const router = useRouter();
const route = useRoute();
const { Notify, Loading, Confirm } = useNotiflix();
const { logout, isLoading: authLoading, getUserRole, getGtkId } = useAuth();

const isLoggingOut = ref(false);
const userRole = ref<string | null>("");
const gtkId = ref<string | number | null>(null);

const handleLogout = () => {
  if (isLoggingOut.value || authLoading.value) return; // Mencegah klik ganda

  logout({
    router,
    notiflix: { Notify, Loading, Confirm },
    onStart: () => {
      isLoggingOut.value = true;
    },
    onFinish: () => {
      isLoggingOut.value = false;
    },
  });
};

// Props dan Emits untuk sidebar
const props = defineProps({
  isSidebarOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "toggleSidebar"): void;
  (e: "closeSidebar"): void;
}>();

const toggleSidebar = () => {
  if (isUserDropdownOpen.value) {
    isUserDropdownOpen.value = false;
  }
  emit("toggleSidebar");
};

// Handle Home link click in mobile dock
const handleHomeClick = () => {
  if (isUserDropdownOpen.value) {
    isUserDropdownOpen.value = false;
  }
  if (props.isSidebarOpen) {
    emit("closeSidebar");
  }
};

// Active state for Home
const isHomeActive = computed(() => route.path === "/");

// User Dropdown State & Refs
const isUserDropdownOpen = ref(false);
const mobileUserDropdownRef = ref<HTMLDivElement | null>(null);
const desktopUserDropdownRef = ref<HTMLDivElement | null>(null);

// Toggle user dropdown
const toggleUserDropdown = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  if (isMobile && props.isSidebarOpen) {
    emit("closeSidebar");
  }
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  const isInsideMobile = mobileUserDropdownRef.value?.contains(target);
  const isInsideDesktop = desktopUserDropdownRef.value?.contains(target);
  if (!isInsideMobile && !isInsideDesktop) {
    isUserDropdownOpen.value = false;
  }
};

// Close dropdown on route change
watch(
  () => route.path,
  () => {
    isUserDropdownOpen.value = false;
  }
);

const { menuItems } = useMenuConfig();

const activeMenuLabel = computed(() => {
  const path = route.path;
  if (path === "/") return "Beranda";

  const flatItems: FlatMenuItem[] = [];
  menuItems.value.forEach((item: any) => {
    if (item.to) {
      flatItems.push({ to: item.to, label: item.label });
    }
    if (item.children) {
      item.children.forEach((child: any) => {
        if (child.to) {
          flatItems.push({ to: child.to, label: child.label });
        }
      });
    }
  });

  const exactMatch = flatItems.find(
    (item) => item.to !== "/" && item.to === path,
  );
  if (exactMatch) return exactMatch.label;

  const prefixMatch = flatItems
    .filter((item) => item.to !== "/" && path.startsWith(item.to + "/"))
    .sort((a, b) => b.to.length - a.to.length)[0];
  if (prefixMatch) return prefixMatch.label;

  if (path === "/login") return "Login";

  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const isId = /^[0-9a-fA-F-]+$/.test(lastSegment) || !isNaN(Number(lastSegment));
    const targetSegment =
      isId && segments.length > 1 ? segments[segments.length - 2] : lastSegment;

    return targetSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return "SopokDate";
});

const isNavbarVisible = ref(true);
let lastScrollY = 0;

const handleScroll = () => {
  if (window.innerWidth >= 1024) {
    isNavbarVisible.value = true;
    return;
  }

  const currentScrollY = window.scrollY;

  if (isUserDropdownOpen.value) {
    isUserDropdownOpen.value = false;
  }

  if (currentScrollY <= 10) {
    isNavbarVisible.value = true;
    lastScrollY = currentScrollY;
    return;
  }

  const diff = currentScrollY - lastScrollY;
  if (Math.abs(diff) > 10) {
    if (diff > 0) {
      isNavbarVisible.value = false;
    } else {
      isNavbarVisible.value = true;
    }
    lastScrollY = currentScrollY;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", handleScroll, { passive: true });
  userRole.value = getUserRole();
  gtkId.value = getGtkId();
  lastScrollY = window.scrollY;
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
/* Dropdown popover animation for mobile */
.dropdown-slide-up-enter-active,
.dropdown-slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-slide-up-enter-from,
.dropdown-slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.96);
}
</style>
