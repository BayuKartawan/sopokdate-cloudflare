<!-- app/components/siswa/SiswaDetailLayout.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="flex items-center gap-3">
          <svg
            class="w-5 h-5 animate-spin text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span class="text-zinc-400 font-medium text-sm">{{ loadingText }}</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center p-6 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 max-w-lg mx-auto mt-8"
      >
        <h3 class="text-base font-bold mb-2">Data tidak ditemukan</h3>
        <p class="text-sm text-zinc-400 mb-4">{{ error }}</p>
        <BaseButton text="Kembali ke Daftar" title="Kembali ke daftar" @click="$emit('click-back')" />
      </div>

      <!-- Detail Content -->
      <div v-else-if="data" class="space-y-4">

        <!-- Breadcrumb -->
        <div class="flex items-center gap-1.5 text-zinc-400 text-xs">
          <NuxtLink
            :to="breadcrumbLink"
            class="hover:text-emerald-400 transition-colors"
          >{{ breadcrumbTitle }}</NuxtLink>
          <span class="text-zinc-600">/</span>
          <span class="text-zinc-300 font-medium truncate">{{ toTitleCase(data.nama) }}</span>
        </div>

        <!-- Header Card -->
        <div class="rounded-xl p-4 sm:p-5 bg-zinc-800/40 border border-zinc-700/30 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <!-- Avatar + Info -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 overflow-hidden border border-emerald-500/20"
              >
                <img
                  v-if="foto && typeof foto === 'string' && foto.startsWith('http')"
                  :src="foto"
                  alt="Foto"
                  class="w-full h-full object-cover"
                />
                <UserCircle v-else class="h-8 w-8 sm:h-9 sm:w-9" />
              </div>
              <div class="min-w-0">
                <h1 class="text-lg sm:text-xl font-bold text-[var(--text-heading)] leading-tight truncate">
                  {{ toTitleCase(data.nama) }}
                </h1>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <slot name="actions"></slot>
              <BaseButton
                text="Kembali"
                title="Kembali ke daftar"
                @click="$emit('click-back')"
              />
            </div>
          </div>
        </div>

        <!-- Main Details Section -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-4">

          <!-- Left - Biodata (3/4) -->
          <div class="xl:col-span-3">
            <div class="rounded-xl bg-zinc-800/40 border border-zinc-700/30 shadow-sm overflow-hidden">
              <!-- Card Header -->
              <div class="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-zinc-700/50">
                <Info class="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <h2 class="text-sm font-bold text-[var(--text-heading)]">{{ biodataTitle }}</h2>
              </div>

              <!-- Fields — 2-col grid on md+, stacked on mobile -->
              <div class="p-4 sm:p-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y divide-zinc-700/30 md:divide-y-0">
                  <div
                    v-for="(item, index) in biodataFields"
                    :key="index"
                    class="py-2.5 md:border-b md:border-zinc-700/30"
                  >
                    <dt class="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mb-0.5">
                      {{ item.label }}
                    </dt>
                    <dd class="flex items-center gap-2 group">
                      <span
                        class="flex-1 text-sm text-zinc-100 hover:text-emerald-400 transition-colors font-medium break-all select-all cursor-pointer leading-snug"
                        @click="copyToClipboard(item.value, item.label)"
                        title="Klik untuk menyalin"
                      >
                        {{ item.value || '-' }}
                      </span>
                      <span
                        class="text-[9px] bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        @click="copyToClipboard(item.value, item.label)"
                      >
                        Salin
                      </span>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right - Classmates / Related Sidebar (1/4) -->
          <div class="xl:col-span-1">
            <div class="rounded-xl bg-zinc-800/40 border border-zinc-700/30 shadow-sm xl:sticky xl:top-20">
              <!-- Sidebar Header -->
              <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-700/50">
                <Users class="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <h3 class="text-xs font-bold text-[var(--text-heading)] leading-tight">
                  {{ sidebarTitle }}
                  <span v-if="sidebarSubtitle" class="block text-zinc-400 font-normal">({{ sidebarSubtitle }})</span>
                </h3>
              </div>

              <!-- List -->
              <div class="p-2 max-h-72 xl:max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                <button
                  v-for="(item, index) in relatedItems"
                  :key="index"
                  @click="$emit('click-related', item)"
                  class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-zinc-700/40 text-zinc-400 hover:text-emerald-400 flex items-center justify-between gap-2"
                >
                  <span class="truncate">{{ item.displayTitle }}</span>
                  <span class="text-[9px] bg-zinc-700/80 text-zinc-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {{ item.genderAbbr }}
                  </span>
                </button>

                <p
                  v-if="!relatedItems || relatedItems.length === 0"
                  class="text-xs text-center py-8 text-zinc-500"
                >
                  {{ emptyRelatedText }}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info, UserCircle, Users } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import type { PropType } from "vue";

interface BiodataField {
  label: string;
  value?: any;
}

interface RelatedItem {
  displayTitle: string;
  genderAbbr?: string;
  [key: string]: any;
}

const props = defineProps({
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: "Memuat detail..." },
  error: { type: String as PropType<string | null>, default: null },
  data: { type: Object as PropType<Record<string, any> | null>, default: null },
  foto: { type: String as PropType<string | null>, default: null },
  breadcrumbLink: { type: String, default: "#" },
  breadcrumbTitle: { type: String, default: "Data" },
  biodataTitle: { type: String, default: "Biodata Lengkap" },
  biodataFields: { type: Array as PropType<BiodataField[]>, default: () => [] },
  sidebarTitle: { type: String, default: "Siswa Sekelas" },
  sidebarSubtitle: { type: String, default: "" },
  relatedItems: { type: Array as PropType<RelatedItem[]>, default: () => [] },
  emptyRelatedText: { type: String, default: "Tidak ada data lainnya" },
});

defineEmits<{
  (e: "click-back"): void;
  (e: "click-related", item: RelatedItem): void;
}>();

const { Notify } = useNotiflix();

const toTitleCase = (str?: string | null): string => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const copyToClipboard = async (text?: any, label?: string): Promise<void> => {
  if (!text || text === "-") return;
  try {
    await navigator.clipboard.writeText(String(text));
    Notify?.success?.(`${label || 'Data'} berhasil disalin!`);
  } catch {
    Notify?.failure?.("Gagal menyalin!");
  }
};
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgb(63 63 70);
  border-radius: 2px;
}
.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: rgb(82 82 91);
}
</style>
