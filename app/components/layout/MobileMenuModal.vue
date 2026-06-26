<template>
  <div>
    <!-- Backdrop Overlay (No Blur) -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        @click="close"
        class="fixed inset-0 bg-black/60 z-45 lg:hidden"
        aria-label="Tutup menu"
      ></div>
    </Transition>

    <!-- Bottom Sheet Modal Container -->
    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="fixed left-0 bottom-0 w-full max-h-[82vh] z-50 flex flex-col rounded-t-3xl shadow-2xl lg:hidden"
        :style="{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-primary)',
        }"
      >
        <!-- Aesthetic Drag Handle -->
        <div class="w-full flex justify-center py-3.5 flex-shrink-0 cursor-pointer" @click="close">
          <div class="w-12 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
        </div>

        <!-- Navigation Scrollable Content -->
        <div class="flex-grow overflow-y-auto px-5 py-2 scrollbar-none pb-4">
          <ul class="space-y-2.5">
            <li
              v-for="menuItem in menuItems"
              :key="menuItem.to || menuItem.label"
              class="block"
            >
              <!-- Menu Item (Direct Link) -->
              <NuxtLink
                v-if="!menuItem.children"
                :to="menuItem.to"
                :class="getMobileLinkClass(menuItem.to)"
                @click="handleNavClick"
              >
                <div class="flex items-center">
                  <component
                    :is="menuItem.icon"
                    v-if="menuItem.icon"
                    class="w-5 h-5 mr-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors"
                  />
                  <span class="font-semibold text-sm">{{ menuItem.label }}</span>
                </div>
              </NuxtLink>

              <!-- Menu Item (Dropdown / Group Category) -->
              <div
                v-else
                class="rounded-2xl overflow-hidden border transition-all duration-300"
                :style="{
                  borderColor: isParentActive(menuItem) ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-primary)',
                  backgroundColor: isParentActive(menuItem) ? 'var(--bg-secondary)' : 'transparent'
                }"
              >
                <!-- Trigger Button -->
                <button
                  @click="toggleDropdown(menuItem.label)"
                  class="w-full flex items-center justify-between px-4 py-3.5 text-left transition-all duration-300"
                  :style="{
                    color: isParentActive(menuItem) ? 'var(--text-primary)' : 'var(--text-primary)'
                  }"
                >
                  <div class="flex items-center">
                    <component
                      :is="menuItem.icon"
                      v-if="menuItem.icon"
                      class="w-5 h-5 mr-3.5 transition-colors"
                      :class="[
                        isParentActive(menuItem) ? 'text-emerald-500' : 'text-zinc-500 dark:text-zinc-400'
                      ]"
                    />
                    <span
                      class="text-sm transition-colors duration-200"
                      :class="[isParentActive(menuItem) ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-semibold']"
                    >
                      {{ menuItem.label }}
                    </span>
                  </div>

                  <ChevronRight
                    :class="[
                      'w-4 h-4 transition-transform duration-300',
                      openDropdowns.includes(menuItem.label) ? 'rotate-90 text-emerald-500' : 'text-zinc-400',
                    ]"
                  />
                </button>

                <!-- Nested Dropdown List -->
                <div
                  v-show="openDropdowns.includes(menuItem.label)"
                  class="bg-zinc-50/20 dark:bg-black/10 border-t border-dashed"
                  :style="{ borderColor: 'var(--border-primary)' }"
                >
                  <ul class="py-1.5 divide-y divide-dashed" :style="{ borderColor: 'var(--border-primary)' }">
                    <li v-for="childItem in menuItem.children" :key="childItem.to">
                      <NuxtLink
                        :to="childItem.to"
                        @click="handleSubNavClick"
                        :class="getMobileChildLinkClass(childItem.to)"
                      >
                        <div class="flex items-center pl-4">
                          <!-- Bullet Indicator -->
                          <div
                            class="w-1.5 h-1.5 rounded-full mr-3.5 transition-all duration-300"
                            :class="isActiveRoute(childItem.to) ? 'bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'"
                          ></div>
                          <span class="text-sm font-medium">{{ childItem.label }}</span>
                        </div>
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Sticky Footer with App Info on Left and Close Button on Bottom-Right -->
        <div
          class="px-6 pt-4 flex justify-between items-center border-t flex-shrink-0"
          :style="{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-surface)',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
          }"
        >
          <div class="flex flex-col">
            <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-0.5">Sistem Navigasi</span>
            <span class="text-sm font-bold tracking-tight" :style="{ color: 'var(--text-primary)' }">
              {{ appName }}
            </span>
          </div>

          <!-- Relocated Close Button -->
          <button
            @click="close"
            class="px-4 py-2.5 rounded-xl transition-all duration-300 hover:bg-[var(--bg-tertiary)] flex items-center justify-center border font-semibold text-xs gap-2"
            :style="{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }"
            aria-label="Tutup menu"
          >
            <X class="w-4 h-4 text-red-500 dark:text-red-400" />
            <span>Tutup Menu</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, watch } from "vue";
import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";
import { X, ChevronRight } from "lucide-vue-next";

// --- Props & Emits ---
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close"]);

// --- Composables & Config ---
const route = useRoute();
const appName = useRuntimeConfig().public.appName;
const { menuItems } = useMenuConfig();

// --- State ---
const openDropdowns = ref([]);

// --- Helper Functions ---
const isActiveRoute = (toPath) => {
  if (!toPath) return false;
  if (toPath === "/") {
    return route.path === "/";
  }
  return route.path === toPath || route.path.startsWith(toPath + "/");
};

const isParentActive = (menuItem) => {
  if (!menuItem.children) return false;
  return menuItem.children.some((child) => isActiveRoute(child.to));
};

const getMobileLinkClass = (toPath) => {
  const baseClass =
    "group flex items-center px-4 py-3.5 rounded-2xl border transition-all duration-300 select-none outline-none";
  const activeClass = isActiveRoute(toPath)
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-xs"
    : "theme-text border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/40 hover:text-emerald-500";
  return `${baseClass} ${activeClass}`;
};

const getMobileChildLinkClass = (toPath) => {
  const baseClass =
    "flex items-center px-4 py-3 transition-all duration-300 select-none outline-none w-full";
  const activeClass = isActiveRoute(toPath)
    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
    : "text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/40";
  return `${baseClass} ${activeClass}`;
};

// --- Methods & Actions ---
const close = () => {
  emit("close");
};

const toggleDropdown = (menuLabel) => {
  const index = openDropdowns.value.indexOf(menuLabel);
  if (index > -1) {
    openDropdowns.value = openDropdowns.value.filter((label) => label !== menuLabel);
  } else {
    // Accordion behavior: only one dropdown is open at a time
    openDropdowns.value = [menuLabel];
  }
};

const handleNavClick = () => {
  close();
};

const handleSubNavClick = () => {
  close();
};

const autoExpandActiveDropdown = () => {
  if (!menuItems.value) return;

  let activeMenuLabel = null;
  menuItems.value.forEach((menuItem) => {
    if (menuItem.children) {
      const hasActiveChild = menuItem.children.some((child) =>
        isActiveRoute(child.to)
      );
      if (hasActiveChild) {
        activeMenuLabel = menuItem.label;
      }
    }
  });

  if (activeMenuLabel) {
    openDropdowns.value = [activeMenuLabel];
  } else {
    openDropdowns.value = [];
  }
};

// Scroll Lock when open to prevent background scrolling
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
  { immediate: true }
);

// --- Watchers ---
watch(
  [() => route.path, () => menuItems.value],
  () => {
    autoExpandActiveDropdown();
  },
  { immediate: true, deep: true },
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* Scoped transition for slide-up mobile menu */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Scoped transition for backdrop fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tap Highlight and focus outline fixes */
a, button {
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

/* Hide scrollbar */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
