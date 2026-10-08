<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" @click="close" class="fixed inset-0 bg-black/50 z-30 lg:hidden" aria-label="Tutup menu"></div>
    </Transition>

    <!-- Floating Sheet Modal (Above Navbar) -->
    <Transition name="slide-up">
      <div v-if="isOpen"
        class="fixed inset-x-3 bottom-21 max-w-sm sm:max-w-md mx-auto max-h-[72vh] z-40 flex flex-col rounded-2xl border lg:hidden overflow-hidden"
        :style="{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)',
        }">
        <!-- Header: Centered Title -->
        <div class="flex items-center justify-center px-5 pt-3.5 pb-2 shrink-0">
          <span class="text-sm font-semibold tracking-tight" :style="{ color: 'var(--text-primary)' }">Menu Sopokdate</span>
        </div>

        <!-- Scrollable Content -->
        <div class="grow overflow-y-auto px-4 pt-2 pb-4 scrollbar-none">
          <!-- Grouped Menu Items (with children) -->
          <div v-for="(group, groupIndex) in groupedMenuItems" :key="group.label"
            :class="groupIndex > 0 ? 'mt-5' : 'mt-1'">
            <!-- Group Header -->
            <div class="flex items-center gap-2 px-1 mb-2.5">
              <component :is="group.icon" v-if="group.icon" class="w-3.5 h-3.5" :class="[
                isParentActive(group)
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-(--text-muted)'
              ]" />
              <span class="text-[11px] font-bold uppercase tracking-wider" :class="[
                isParentActive(group)
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-(--text-muted)'
              ]">{{ group.label }}</span>
              <div class="flex-1 h-px ml-1" :class="[
                isParentActive(group)
                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                  : 'bg-(--border-primary)'
              ]"></div>
            </div>

            <!-- Children Grid -->
            <div class="grid grid-cols-3 gap-2">
              <NuxtLink v-for="child in group.children" :key="child.to" :to="child.to" @click="handleNavClick"
                class="flex flex-col items-center justify-center rounded-2xl p-3 transition-all duration-200 active:scale-95 select-none min-h-19"
                :class="[
                  isActiveRoute(child.to)
                    ? 'bg-emerald-500/12 dark:bg-emerald-500/15 ring-1 ring-emerald-500/25'
                    : 'bg-(--bg-secondary)/50 hover:bg-(--bg-secondary)'
                ]">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors duration-200"
                  :class="[
                    isActiveRoute(child.to)
                      ? childIconMeta(child).activeBg
                      : 'bg-(--bg-tertiary)/60'
                  ]">
                  <component :is="childIconMeta(child).icon" class="w-4 h-4 transition-colors duration-200" :class="[
                    isActiveRoute(child.to)
                      ? childIconMeta(child).activeColor
                      : 'text-(--text-secondary)'
                  ]" />
                </div>
                <span
                  class="text-[11px] font-medium text-center leading-tight line-clamp-2 transition-colors duration-200"
                  :class="[
                    isActiveRoute(child.to)
                      ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-(--text-secondary)'
                  ]">{{ child.label }}</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Bottom Spacer -->
          <div class="h-2"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, markRaw } from "vue";
import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";
import {
  // Akun icons
  KeyRound,
  Fingerprint,
  Mail,
  ShieldCheck,
  UserCog,
  Building,
  BadgeCheck,
  // Akademik icons
  UserCheck,
  GraduationCap,
  Users,
  Award,
  // Jadwal icons
  BookOpen,
  Clock,
  CalendarPlus,
  Printer,
  // Absensi icons
  CalendarDays,
  ClipboardList,
  BarChart3,
  // Madrasah icons
  Building2,
  FolderOpen,
  AppWindow,
  // Dokumen icons
  FileText,
  Medal,
  BookCopy,
  ListOrdered,
  Camera,
  // Keuangan icons
  Banknote,
  Receipt,
  StickyNote,
} from "lucide-vue-next";

interface MenuItemChild {
  to?: string;
  label: string;
  icon?: any;
}

interface MenuItem {
  to?: string;
  label: string;
  icon?: any;
  children?: MenuItemChild[];
}

interface IconMeta {
  icon: any;
  activeColor: string;
  activeBg: string;
}

// --- Props & Emits ---
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

// --- Composables & Config ---
const route = useRoute();
const { menuItems } = useMenuConfig();

// --- Child icon mapping ---
// Maps child item labels to specific icons and accent colors for visual distinction
const childIconMap: Record<string, IconMeta> = {
  // Akun
  "Akun Sopokdate": { icon: markRaw(KeyRound), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "Akun GTK": { icon: markRaw(ShieldCheck), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "Akun Madrasah": { icon: markRaw(Building), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "Pengelola Akses": { icon: markRaw(ShieldCheck), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  // Akademik
  "Guru Tendik": { icon: markRaw(UserCheck), activeColor: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-500/15 dark:bg-sky-500/20" },
  "Siswa": { icon: markRaw(Users), activeColor: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-500/15 dark:bg-sky-500/20" },
  "Rombel": { icon: markRaw(GraduationCap), activeColor: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-500/15 dark:bg-sky-500/20" },
  "Alumni": { icon: markRaw(Award), activeColor: "text-sky-600 dark:text-sky-400", activeBg: "bg-sky-500/15 dark:bg-sky-500/20" },
  // Jadwal
  "Kurikulum": { icon: markRaw(BookOpen), activeColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-500/15 dark:bg-amber-500/20" },
  "Alokasi Jam": { icon: markRaw(Clock), activeColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-500/15 dark:bg-amber-500/20" },
  "Buat Jadwal": { icon: markRaw(CalendarPlus), activeColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-500/15 dark:bg-amber-500/20" },
  "Cetak Jadwal": { icon: markRaw(Printer), activeColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-500/15 dark:bg-amber-500/20" },
  // Absensi
  "Kalender Pendidikan": { icon: markRaw(CalendarDays), activeColor: "text-teal-600 dark:text-teal-400", activeBg: "bg-teal-500/15 dark:bg-teal-500/20" },
  "Absensi Siswa": { icon: markRaw(ClipboardList), activeColor: "text-teal-600 dark:text-teal-400", activeBg: "bg-teal-500/15 dark:bg-teal-500/20" },
  "Rekap Absensi": { icon: markRaw(BarChart3), activeColor: "text-teal-600 dark:text-teal-400", activeBg: "bg-teal-500/15 dark:bg-teal-500/20" },
  // Madrasah
  "Data Madrasah": { icon: markRaw(Building2), activeColor: "text-rose-600 dark:text-rose-400", activeBg: "bg-rose-500/15 dark:bg-rose-500/20" },
  "Berkas Madrasah": { icon: markRaw(FolderOpen), activeColor: "text-rose-600 dark:text-rose-400", activeBg: "bg-rose-500/15 dark:bg-rose-500/20" },
  "Aplikasi Madrasah": { icon: markRaw(AppWindow), activeColor: "text-rose-600 dark:text-rose-400", activeBg: "bg-rose-500/15 dark:bg-rose-500/20" },
  // Dokumen
  "Surat": { icon: markRaw(FileText), activeColor: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
  "Sertifikat": { icon: markRaw(Medal), activeColor: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
  "Sampul": { icon: markRaw(BookCopy), activeColor: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
  "Cetak Pas Foto": { icon: markRaw(Camera), activeColor: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
  // Keuangan BOS
  "Penerimaan Honor": { icon: markRaw(Banknote), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
  "Kuitansi": { icon: markRaw(Receipt), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
  "Nota": { icon: markRaw(StickyNote), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
};

const defaultIconMeta: IconMeta = { icon: markRaw(FileText), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" };

const childIconMeta = (child: MenuItemChild): IconMeta => {
  return childIconMap[child.label] || defaultIconMeta;
};

// --- Computed ---
const groupedMenuItems = computed<MenuItem[]>(() => {
  return menuItems.value.filter((item: MenuItem) => item.children && item.children.length > 0);
});

// --- Helper Functions ---
const activeChildPath = computed(() => {
  const currentPath = route.path;
  if (currentPath === "/") return "/";

  const allPaths: string[] = [];
  menuItems.value?.forEach((item: MenuItem) => {
    if (item.to) allPaths.push(item.to);
    if (item.children) {
      item.children.forEach((c) => {
        if (c.to) allPaths.push(c.to);
      });
    }
  });

  const exactMatch = allPaths.find((p) => p !== "/" && p === currentPath);
  if (exactMatch) return exactMatch;

  const prefixMatches = allPaths
    .filter((p) => p !== "/" && currentPath.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length);

  return prefixMatches[0] || null;
});

const isActiveRoute = (toPath?: string): boolean => {
  if (!toPath) return false;
  return activeChildPath.value === toPath;
};

const isParentActive = (menuItem: MenuItem): boolean => {
  if (!menuItem.children) return false;
  return menuItem.children.some((child) => isActiveRoute(child.to));
};

// --- Methods & Actions ---
const close = () => {
  emit("close");
};

const handleNavClick = () => {
  close();
};

// Scroll Lock when open to prevent background scrolling
watch(
  () => props.isOpen,
  (newVal: boolean) => {
    if (newVal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px) scale(0.97);
  opacity: 0;
}

/* Backdrop fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tap highlight and focus fixes */
a,
button {
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

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
