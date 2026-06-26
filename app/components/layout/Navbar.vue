<template>
  <header
    class="fixed w-full z-30 bottom-0 lg:top-0 lg:bottom-auto border-t lg:border-t-0 lg:border-b transition-transform duration-300 ease-in-out"
    :style="{ borderColor: 'var(--border-primary)' }"
    :class="
      isNavbarVisible ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
    "
  >
    <div
      class="max-w-7xl mx-auto flex justify-between items-center h-16 px-4"
      :style="{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }"
    >
      <!-- Bagian 1: Toggle Hamburger + Toggle Tema -->
      <div class="flex items-center space-x-4 flex-shrink-0 order-3 lg:order-1">
        <!-- Sidebar Toggle Component (Inlined) -->
        <button
          @click="toggleSidebar"
          class="flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all duration-300 hover:bg-[var(--bg-tertiary)] min-w-[3.5rem] lg:min-w-0"
          :style="{ color: 'var(--text-primary)' }"
          :aria-label="isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'"
        >
          <Menu
            v-if="!isSidebarOpen"
            class="w-5 h-5 lg:w-6 lg:h-6 transform transition-all duration-300 hover:translate-x-0.5"
          />
          <X
            v-if="isSidebarOpen"
            class="w-5 h-5 lg:w-6 lg:h-6 transform transition-all duration-300 hover:rotate-90"
          />
          <span class="text-[10px] leading-none mt-1 font-semibold lg:hidden">
            {{ isSidebarOpen ? 'Tutup' : 'Menu' }}
          </span>
        </button>

        <!-- Theme Toggle -->
      </div>

      <!-- Bagian 2: Logo/Teks di Tengah Sesuai Menu -->
      <div class="flex-1 flex justify-center px-2 min-w-0 order-2">
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

      <!-- Bagian 3: Fullscreen + User Dropdown -->
      <div class="flex items-center space-x-4 flex-shrink-0 order-1 lg:order-3">
        <!-- User Dropdown -->
        <div class="relative" ref="userDropdownRef">
          <!-- User Avatar/Icon Button -->
          <button
            @click="toggleUserDropdown"
            class="flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all duration-300 hover:bg-[var(--bg-tertiary)] min-w-[3.5rem] lg:min-w-0"
            :class="{ 'bg-[var(--bg-tertiary)]': isUserDropdownOpen }"
            :style="{ color: 'var(--text-primary)' }"
            aria-label="User Menu"
          >
            <!-- User Icon -->
            <UserCircle class="w-5 h-5 lg:w-6 lg:h-6" />
            <span class="text-[10px] leading-none mt-1 font-semibold lg:hidden">Akun</span>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isUserDropdownOpen"
            class="absolute w-44 rounded-lg shadow-lg border z-50 p-1 bottom-full mb-2 left-0 lg:bottom-auto lg:mb-0 lg:top-full lg:mt-2 lg:right-0 lg:left-auto"
            :style="{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }"
          >
            <div class="flex flex-col gap-0.5">
              <!-- Profil Button (Hanya guru) -->
              <NuxtLink
                v-if="userRole === 'guru' && gtkId"
                :to="`/akademik/gtk/detail/${gtkId}`"
                @click="isUserDropdownOpen = false"
                class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-[var(--bg-tertiary)]"
                :style="{ color: 'var(--text-primary)' }"
                aria-label="Profil"
              >
                <div class="flex items-center space-x-2">
                  <UserCircle
                    class="w-5 h-5 transition-transform duration-300"
                  />
                  <span class="font-medium">Profil</span>
                </div>
              </NuxtLink>

              <!-- Divider -->
              <div
                v-if="userRole === 'guru' && gtkId"
                class="border-t my-0.5 mx-1"
                :style="{ borderColor: 'var(--border-subtle)' }"
              ></div>

              <!-- Logout Button (Inlined) -->
              <button
                @click="handleLogout"
                class="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-[var(--bg-tertiary)] text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300"
                aria-label="Logout"
                :disabled="isLoggingOut"
              >
                <Loader2
                  v-if="isLoggingOut"
                  class="w-5 h-5 animate-spin mx-auto"
                />
                <div v-else class="flex items-center space-x-2">
                  <SignOut
                    class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"
                  />
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

<script setup>
import {
  UserCircle,
  Menu,
  X,
  LogOut as SignOut,
  Loader2,
} from "lucide-vue-next";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";

import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";

const router = useRouter();
const { Notify, Loading, Confirm } = useNotiflix();
const { logout, isLoading: authLoading, getUserRole, getGtkId } = useAuth();

const isLoggingOut = ref(false);
const userRole = ref("");
const gtkId = ref(null);

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
defineProps({
  isSidebarOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["toggleSidebar"]);

const toggleSidebar = () => {
  emit("toggleSidebar");
};

// User Dropdown State
const isUserDropdownOpen = ref(false);
const userDropdownRef = ref(null);

// Toggle user dropdown
const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target)) {
    isUserDropdownOpen.value = false;
  }
};

const route = useRoute();
const { menuItems } = useMenuConfig();

const activeMenuLabel = computed(() => {
  const path = route.path;
  if (path === "/") return "Beranda";

  const flatItems = [];
  menuItems.value.forEach((item) => {
    if (item.to) {
      flatItems.push({ to: item.to, label: item.label });
    }
    if (item.children) {
      item.children.forEach((child) => {
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
    .filter((item) => item.to !== "/" && path.startsWith(item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  if (prefixMatch) return prefixMatch.label;

  if (path === "/login") return "Login";

  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const isId = /^[0-9a-fA-F-]+$/.test(lastSegment) || !isNaN(lastSegment);
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
