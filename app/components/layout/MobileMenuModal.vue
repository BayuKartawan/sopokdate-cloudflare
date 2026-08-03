<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" @click="close" class="fixed inset-0 bg-black/50 z-45 lg:hidden" aria-label="Tutup menu"></div>
    </Transition>

    <!-- Bottom Sheet Modal -->
    <Transition name="slide-up">
      <div v-if="isOpen"
        class="fixed left-0 bottom-0 w-full max-h-[85vh] z-50 flex flex-col rounded-t-[28px] lg:hidden overflow-hidden"
        :style="{
          backgroundColor: 'var(--bg-primary)',
          boxShadow: '0 -8px 40px var(--shadow-overlay)',
        }">
        <!-- Drag Handle + Close -->
        <div class="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
              <LayoutGrid class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span class="text-sm font-semibold" :style="{ color: 'var(--text-primary)' }">SopokDate</span>
          </div>
          <button @click="close"
            class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:scale-95"
            aria-label="Tutup menu">
            <X class="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-grow overflow-y-auto px-4 pt-2 pb-4 scrollbar-none"
          :style="{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }">

          <!-- Direct Link Items (e.g., Beranda) as a leading grid -->
          <div v-if="directMenuItems.length" class="mb-4">
            <div class="grid grid-cols-3 gap-2">
              <NuxtLink v-for="item in directMenuItems" :key="item.to" :to="item.to" @click="handleNavClick"
                class="flex flex-col items-center justify-center rounded-2xl p-3.5 transition-all duration-200 active:scale-95 select-none"
                :class="[
                  isActiveRoute(item.to)
                    ? 'bg-emerald-500/12 dark:bg-emerald-500/15 ring-1 ring-emerald-500/25'
                    : 'bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)]'
                ]">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors duration-200"
                  :class="[
                    isActiveRoute(item.to)
                      ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                      : 'bg-[var(--bg-tertiary)]/60'
                  ]">
                  <component :is="item.icon" class="w-5 h-5 transition-colors duration-200" :class="[
                    isActiveRoute(item.to)
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-secondary)]'
                  ]" />
                </div>
                <span class="text-xs font-medium text-center leading-tight transition-colors duration-200" :class="[
                  isActiveRoute(item.to)
                    ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-[var(--text-secondary)]'
                ]">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Grouped Menu Items (with children) -->
          <div v-for="(group, groupIndex) in groupedMenuItems" :key="group.label"
            :class="groupIndex > 0 ? 'mt-5' : 'mt-1'">
            <!-- Group Header -->
            <div class="flex items-center gap-2 px-1 mb-2.5">
              <component :is="group.icon" v-if="group.icon" class="w-3.5 h-3.5" :class="[
                isParentActive(group)
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-[var(--text-muted)]'
              ]" />
              <span class="text-[11px] font-bold uppercase tracking-wider" :class="[
                isParentActive(group)
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-[var(--text-muted)]'
              ]">{{ group.label }}</span>
              <div class="flex-1 h-px ml-1" :class="[
                isParentActive(group)
                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                  : 'bg-[var(--border-primary)]'
              ]"></div>
            </div>

            <!-- Children Grid -->
            <div class="grid grid-cols-3 gap-2">
              <NuxtLink v-for="child in group.children" :key="child.to" :to="child.to" @click="handleNavClick"
                class="flex flex-col items-center justify-center rounded-2xl p-3 transition-all duration-200 active:scale-95 select-none min-h-[76px]"
                :class="[
                  isActiveRoute(child.to)
                    ? 'bg-emerald-500/12 dark:bg-emerald-500/15 ring-1 ring-emerald-500/25'
                    : 'bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)]'
                ]">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors duration-200"
                  :class="[
                    isActiveRoute(child.to)
                      ? childIconMeta(child).activeBg
                      : 'bg-[var(--bg-tertiary)]/60'
                  ]">
                  <component :is="childIconMeta(child).icon" class="w-4 h-4 transition-colors duration-200" :class="[
                    isActiveRoute(child.to)
                      ? childIconMeta(child).activeColor
                      : 'text-[var(--text-secondary)]'
                  ]" />
                </div>
                <span
                  class="text-[11px] font-medium text-center leading-tight line-clamp-2 transition-colors duration-200"
                  :class="[
                    isActiveRoute(child.to)
                      ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-[var(--text-secondary)]'
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

<script setup>
import { ref, computed, onUnmounted, watch, markRaw } from "vue";
import { useMenuConfig } from "~/composables/ui/useMenuConfig.js";
import {
  X,
  LayoutGrid,
  Home,
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
const { menuItems } = useMenuConfig();

// --- Child icon mapping ---
// Maps child item labels to specific icons and accent colors for visual distinction
const childIconMap = {
  // Akun
  "Akun Sopokdate": { icon: markRaw(KeyRound), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "EMIS 4.0": { icon: markRaw(Fingerprint), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "Email Madrasah": { icon: markRaw(Mail), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "RDM": { icon: markRaw(ShieldCheck), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "EMIS GTK": { icon: markRaw(UserCog), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
  "SIMPATIKA": { icon: markRaw(BadgeCheck), activeColor: "text-violet-600 dark:text-violet-400", activeBg: "bg-violet-500/15 dark:bg-violet-500/20" },
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
  "Daftar Siswa": { icon: markRaw(ListOrdered), activeColor: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
  "Cetak Pas Foto": { icon: markRaw(Camera), activeColor: "text-indigo-600 dark:text-indigo-400", activeBg: "bg-indigo-500/15 dark:bg-indigo-500/20" },
  // Keuangan BOS
  "Penerimaan Honor": { icon: markRaw(Banknote), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
  "Kuitansi": { icon: markRaw(Receipt), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
  "Nota": { icon: markRaw(StickyNote), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" },
};

const defaultIconMeta = { icon: markRaw(FileText), activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-500/15 dark:bg-emerald-500/20" };

const childIconMeta = (child) => {
  return childIconMap[child.label] || defaultIconMeta;
};

// --- Computed ---
const directMenuItems = computed(() => {
  return menuItems.value.filter((item) => !item.children);
});

const groupedMenuItems = computed(() => {
  return menuItems.value.filter((item) => item.children && item.children.length > 0);
});

// --- Helper Functions ---
const isActiveRoute = (toPath) => {
  if (!toPath) return false;
  if (toPath === "/" || toPath === "/edm") {
    return route.path === toPath;
  }
  return route.path === toPath || route.path.startsWith(toPath + "/");
};

const isParentActive = (menuItem) => {
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
  (newVal) => {
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
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
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
