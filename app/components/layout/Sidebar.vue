<template>
  <div>
    <!-- Overlay untuk mobile -->
    <div v-if="isSidebarOpen" @click="closeSidebar"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300" aria-label="Close sidebar"></div>

    <!-- Sidebar -->
    <aside :class="[isSidebarOpen ? 'translate-x-0' : '-translate-x-full']"
      :style="{ backgroundColor: 'var(--bg-surface)' }"
      class="fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
      <div class="p-2 pl-4 flex justify-between items-center flex-shrink-0">
        <!-- App Name -->
        <span class="p-3 pt-4 leading-none flex items-center text-sm" :style="{ color: 'var(--text-primary)' }">
          {{ appName }}
        </span>

        <!-- Toggle Button -->
        <button @click="toggleAllDropdowns"
          class="h-10 w-10 flex items-center justify-center rounded-md transition-colors hover:text-emerald-500"
          :style="{ color: 'var(--text-primary)' }" :title="allDropdownsOpen ? 'Tutup Semua Menu' : 'Buka Semua Menu'">
          <FolderOpen v-if="allDropdownsOpen" class="w-5 h-5" />
          <FolderClosed v-else class="w-5 h-5" />
        </button>
      </div>

      <!-- Menu Items dengan scroll -->
      <nav class="flex-1 overflow-hidden flex flex-col">
        <div
          class="pl-4 py-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-zinc-600 dark:hover:scrollbar-thumb-zinc-500">
          <ul>
            <li v-for="menuItem in menuItems" :key="menuItem.to || menuItem.label">
              <!-- Menu tanpa dropdown -->
              <NuxtLink v-if="!menuItem.children" :to="menuItem.to" :class="getLinkClass(menuItem.to, 'flex')"
                @click="handleNavClick">
                <component :is="menuItem.icon" v-if="menuItem.icon" class="w-5 h-5 mr-3" />
                {{ menuItem.label }}
              </NuxtLink>

              <!-- Menu dengan dropdown -->
              <div v-else>
                <button @click="toggleDropdown(menuItem.label)" :class="[
                  'w-full flex items-center px-3 py-2 text-left transition-colors duration-200',
                  isParentActive(menuItem)
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'hover:text-emerald-500',
                ]" :style="{
                  color: isParentActive(menuItem)
                    ? undefined
                    : 'var(--text-primary)',
                }">
                  <component :is="menuItem.icon" v-if="menuItem.icon" class="w-5 h-5 mr-3" />
                  <span class="flex-1">{{ menuItem.label }}</span>

                  <ChevronRight :class="[
                    'w-4 h-4 transition-transform duration-200',
                    openDropdowns.includes(menuItem.label) ? 'rotate-90' : '',
                  ]" />
                </button>

                <div v-show="openDropdowns.includes(menuItem.label)" class="relative ml-[13px] my-1 space-y-0.5">
                  <!-- Garis Vertikal Presisi -->
                  <span
                    class="absolute left-[8px] top-1 bottom-1 w-[2px] bg-emerald-500/20 dark:bg-emerald-500/30 rounded-full" />

                  <NuxtLink v-for="childItem in menuItem.children" :key="childItem.to" :to="childItem.to"
                    @click="handleSubNavClick" :class="getLinkClass(childItem.to, 'relative group !pl-7 rounded-md')">
                    <!-- Ikon Titik Terhubung Sejajar Presisi Utuh (Tidak Terpotong) -->
                    <span
                      class="absolute left-[9px] -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[var(--bg-surface)] z-10">
                      <span :class="[
                        'rounded-full transition-all duration-200',
                        isActiveRoute(childItem.to)
                          ? 'w-2 h-2 bg-emerald-500 ring-4 ring-emerald-500/20 scale-100'
                          : 'w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-500 group-hover:bg-emerald-500 group-hover:scale-125'
                      ]" />
                    </span>

                    <component :is="childItem.icon" v-if="childItem.icon" class="w-4 h-4 mr-2.5 flex-shrink-0" />
                    <span class="truncate">{{ childItem.label }}</span>
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";
import { FolderClosed, FolderOpen, ChevronRight } from "lucide-vue-next";

// --- Props & Emits ---
defineProps({
  isSidebarOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "closeSidebar"): void;
}>();

// --- Composables & Config ---
const route = useRoute();
const appName = useRuntimeConfig().public.appName;
const { menuItems, getMenuItemsWithChildren } = useMenuConfig();

// --- State ---
const openDropdowns = ref<string[]>([]);
const isMobileView = ref<boolean>(false);

// --- Computed Properties ---
const allDropdownsOpen = computed(() => {
  const dropdownMenus = getMenuItemsWithChildren();
  return (
    dropdownMenus.length > 0 &&
    dropdownMenus.every((item: any) => openDropdowns.value.includes(item.label))
  );
});

// --- Helper Functions ---
const isActiveRoute = (toPath?: string): boolean => {
  if (!toPath) return false;
  if (toPath === "/" || toPath === "/edm") {
    return route.path === toPath;
  }
  return route.path === toPath || route.path.startsWith(toPath + "/");
};

const isParentActive = (menuItem: any): boolean => {
  if (!menuItem.children) return false;
  return menuItem.children.some((child: any) => isActiveRoute(child.to));
};

const getLinkClass = (toPath?: string, additionalClass: string = ""): string => {
  const baseClass =
    "inline-flex items-center px-3 py-2 transition-all duration-300 outline-none focus:outline-none focus:ring-0 focus:outline-none w-full";
  const activeClass = isActiveRoute(toPath)
    ? "text-emerald-600 dark:text-emerald-400"
    : "theme-text hover:text-emerald-500";
  return `${baseClass} ${activeClass} ${additionalClass}`;
};

// --- Methods & Actions ---
const closeSidebar = () => {
  emit("closeSidebar");
};

const toggleDropdown = (menuLabel: string) => {
  const index = openDropdowns.value.indexOf(menuLabel);
  if (index > -1) {
    openDropdowns.value = [];
  } else {
    openDropdowns.value = [menuLabel];
  }
};

const toggleAllDropdowns = () => {
  const dropdownMenus = getMenuItemsWithChildren();

  if (allDropdownsOpen.value) {
    openDropdowns.value = [];
  } else {
    openDropdowns.value = dropdownMenus.map((item: any) => item.label);
  }
};

const autoExpandActiveDropdown = () => {
  if (!menuItems.value) return;

  let activeMenuLabel: string | null = null;
  menuItems.value.forEach((menuItem: any) => {
    if (menuItem.children) {
      const hasActiveChild = menuItem.children.some((child: any) =>
        isActiveRoute(child.to),
      );
      if (hasActiveChild) {
        activeMenuLabel = menuItem.label;
      }
    }
  });

  if (activeMenuLabel) {
    if (!allDropdownsOpen.value) {
      openDropdowns.value = [activeMenuLabel];
    } else {
      if (!openDropdowns.value.includes(activeMenuLabel)) {
        openDropdowns.value.push(activeMenuLabel);
      }
    }
  } else {
    if (!allDropdownsOpen.value) {
      openDropdowns.value = [];
    }
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

// --- Watchers ---
watch(
  [() => route.path, () => menuItems.value],
  () => {
    autoExpandActiveDropdown();
  },
  { immediate: true, deep: true },
);

// --- Lifecycle Hooks ---
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
  background-color: var(--scrollbar-thumb);
  border-radius: 3px;
}

.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb-hover);
}

/* Fallback untuk Firefox */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}
</style>
