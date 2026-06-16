<template>
  <div>
    <!-- Overlay untuk mobile -->
    <div
      v-if="isSidebarOpen"
      @click="closeSidebar"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
      aria-label="Close sidebar"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'bg-zinc-950',
      ]"
      class="fixed backdrop-blur-lg left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out flex flex-col"
    >
      <div class="p-2 pl-4 flex justify-between items-center flex-shrink-0">
        <!-- App Name -->
        <span
          class="p-3 pt-4 leading-none flex items-center text-sm text-zinc-200"
        >
          {{ appName }}
        </span>

        <!-- Toggle Button -->
        <button
          @click="toggleAllDropdowns"
          class="h-10 w-10 flex items-center justify-center rounded-md transition-colors text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400"
          :title="allDropdownsOpen ? 'Tutup Semua Menu' : 'Buka Semua Menu'"
        >
          <FolderOpen v-if="allDropdownsOpen" class="w-6 h-6" />
          <FolderClosed v-else class="w-6 h-6" />
        </button>
      </div>

      <!-- Menu Items dengan scroll -->
      <nav class="flex-1 overflow-hidden flex flex-col">
        <div
          class="pl-4 py-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-zinc-600 dark:hover:scrollbar-thumb-zinc-500"
        >
          <ul>
            <li
              v-for="menuItem in menuItems"
              :key="menuItem.to || menuItem.label"
            >
              <!-- Menu tanpa dropdown -->
              <NuxtLink
                v-if="!menuItem.children"
                :to="menuItem.to"
                :class="getLinkClass(menuItem.to, 'flex')"
                @click="handleNavClick"
              >
                <component :is="menuItem.icon" v-if="menuItem.icon" class="w-5 h-5 mr-3" />
                {{ menuItem.label }}
              </NuxtLink>

              <!-- Menu dengan dropdown -->
              <div v-else>
                <button
                  @click="toggleDropdown(menuItem.label)"
                  class="w-full flex items-center px-3 py-2 text-left transition-colors duration-200 text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400"
                >
                  <component :is="menuItem.icon" v-if="menuItem.icon" class="w-5 h-5 mr-3" />
                  <span class="flex-1">{{ menuItem.label }}</span>

                  <ChevronRight
                    :class="[
                       'w-4 h-4 transition-transform duration-200',
                       openDropdowns.includes(menuItem.label) ? 'rotate-90' : '',
                    ]"
                  />
                </button>

                <div
                  v-show="openDropdowns.includes(menuItem.label)"
                  class="overflow-hidden"
                >
                  <NuxtLink
                    v-for="childItem in menuItem.children"
                    :key="childItem.to"
                    :to="childItem.to"
                    @click="handleSubNavClick"
                    :class="getLinkClass(childItem.to, 'ml-8')"
                  >
                    <component :is="childItem.icon" v-if="childItem.icon" class="w-5 h-5 mr-3" />
                    {{ childItem.label }}
                  </NuxtLink>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";

import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";
import { FolderClosed, FolderOpen, ChevronRight } from "lucide-vue-next";

const route = useRoute();

const getLinkClass = (toPath, additionalClass = "") => {
  const baseClass =
    "inline-flex items-center px-3 py-2 transition-all duration-300 outline-none focus:outline-none focus:ring-0 focus:outline-none w-full";
  const activeClass =
    route.path === toPath
      ? "text-emerald-400 bg-zinc-900"
      : "text-zinc-200 hover:text-emerald-400 hover:bg-zinc-900";
  return `${baseClass} ${activeClass} ${additionalClass}`;
};

const appName = useRuntimeConfig().public.appName;

// Props dan Emits untuk sidebar - HANYA SATU DEFINISI
defineProps({
  isSidebarOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["closeSidebar"]);

const closeSidebar = () => {
  emit("closeSidebar");
};

// Menggunakan composable untuk menu configuration
const { menuItems, getMenuItemsWithChildren } = useMenuConfig();

// State untuk dropdown - menggunakan array untuk multiple dropdown
const openDropdowns = ref([]);

const isMobileView = ref(false);

// Computed untuk mengecek apakah semua dropdown yang memiliki children sudah terbuka
const allDropdownsOpen = computed(() => {
  const dropdownMenus = getMenuItemsWithChildren();
  return (
    dropdownMenus.length > 0 &&
    dropdownMenus.every((item) => openDropdowns.value.includes(item.label))
  );
});

// Function untuk toggle dropdown - hanya satu dropdown yang bisa terbuka
const toggleDropdown = (menuLabel) => {
  const index = openDropdowns.value.indexOf(menuLabel);
  if (index > -1) {
    openDropdowns.value = [];
  } else {
    openDropdowns.value = [menuLabel];
  }
};

// Function untuk toggle semua dropdown
const toggleAllDropdowns = () => {
  const dropdownMenus = getMenuItemsWithChildren();

  if (allDropdownsOpen.value) {
    // Tutup semua dropdown
    openDropdowns.value = [];
  } else {
    // Buka semua dropdown
    openDropdowns.value = dropdownMenus.map((item) => item.label);
  }
};

const checkViewport = () => {
  isMobileView.value = window.innerWidth < 1024;
};

const handleNavClick = () => {
  if (isMobileView.value) {
    emit("closeSidebar");
  }
};

const handleSubNavClick = () => {
  if (isMobileView.value) {
    emit("closeSidebar");
  }
};

onMounted(() => {
  checkViewport();
  window.addEventListener("resize", checkViewport);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkViewport);
});
</script>

<style scoped>
a {
  -webkit-tap-highlight-color: transparent;
}

a:focus {
  box-shadow: none;
}

/* Custom scrollbar untuk webkit browsers */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgb(82 82 91);
  border-radius: 3px;
}

.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: rgb(113 113 122);
}

/* Fallback untuk Firefox */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgb(82 82 91) transparent;
}
</style>
