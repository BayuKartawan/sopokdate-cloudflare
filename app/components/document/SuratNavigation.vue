<!-- \src\components\surat\SuratNavigation.vue -->
<template>
  <div class="rounded-xl shadow-sm border overflow-hidden theme-bg theme-border">
    <div class="p-6">
      <div class="flex items-center space-x-3 mb-4">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
            <FileText class="text-blue-500" />
          </div>
        </div>
        <div>
          <h4 class="text-sm font-medium theme-text">Pilih Jenis Surat</h4>
          <p v-if="suratConfigsLength > 0"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Tersedia {{ suratConfigsLength }} jenis surat.
          </p>
        </div>
      </div>

      <div class="mb-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 theme-text-muted" />
          </div>
          <input
            :value="searchQuery"
            @input="handleInput"
            type="text"
            placeholder="Cari surat..."
            class="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 theme-input"
          />
          <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              @click="$emit('clear-search')"
              class="rounded-full p-1 theme-text-muted hover:theme-text theme-bg-card-hover transition-colors"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="searchQuery" class="mb-3">
        <span class="text-xs theme-text-muted">
          {{ Object.keys(filteredSuratConfigs).length }} dari
          {{ suratConfigsLength }} surat ditemukan
        </span>
      </div>

      <div class="space-y-2 max-h-96 overflow-y-auto theme-scrollbar">
        <div
          v-for="(config, jenis) in filteredSuratConfigs"
          :key="jenis"
          @click="$emit('select-surat-type', jenis)"
          :class="[
            'p-3 rounded-lg border cursor-pointer group transition-colors',
            selectedSuratType === jenis
              ? 'bg-blue-500/10 border-blue-500/50 text-blue-500'
              : 'theme-bg-secondary theme-border theme-text-secondary hover:theme-bg-tertiary',
          ]"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-medium break-words" v-html="highlightSearchTerm(jenis)"></h5>
            </div>
            <div :class="[
              'ml-2',
              selectedSuratType === jenis ? 'scale-110' : 'group-hover:scale-105',
            ]">
              <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center',
                selectedSuratType === jenis ? 'text-blue-500' : 'theme-text-muted',
              ]">
                <CheckCircle v-if="selectedSuratType === jenis" class="w-6 h-6" />
                <span v-else class="text-xs font-bold">{{ getItemNumber(jenis) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty: search no result -->
        <div v-if="searchQuery && Object.keys(filteredSuratConfigs).length === 0" class="text-center py-8">
          <Search class="w-12 h-12 mx-auto mb-3 theme-text-faint" />
          <p class="text-sm theme-text-muted">Tidak ada surat ditemukan</p>
          <p class="text-xs mt-1 theme-text-faint">Coba kata kunci yang berbeda</p>
          <button
            @click="$emit('clear-search')"
            class="mt-3 px-3 py-1.5 text-xs rounded-md border theme-text-secondary theme-border hover:theme-bg-secondary transition-colors"
          >
            Hapus Pencarian
          </button>
        </div>

        <!-- Empty: no templates -->
        <div v-if="!searchQuery && suratConfigsLength === 0" class="text-center py-8">
          <FileText class="w-12 h-12 mx-auto mb-3 theme-text-faint" />
          <p class="text-sm theme-text-muted">Tidak ada template surat tersedia</p>
          <p class="text-xs mt-1 theme-text-faint">Silakan tambah template surat terlebih dahulu</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, FileText, Search, X } from "lucide-vue-next";
import { computed } from "vue";

interface SuratConfig {
  [key: string]: unknown;
}

// Mendefinisikan props yang diterima dari komponen induk
const props = defineProps<{
  suratConfigs: Record<string, SuratConfig>;
  filteredSuratConfigs: Record<string, SuratConfig>;
  selectedSuratType?: string;
  searchQuery?: string;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "clear-search": [];
  "select-surat-type": [jenis: string];
}>();

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement | null;
  if (target) {
    emit("update:searchQuery", target.value);
  }
};

// BARU: FUNGSI UNTUK MENGETAHUI BANYAK SURAT TERSEDIA
const suratConfigsLength = computed<number>(() => {
  return Object.keys(props.suratConfigs).length;
});

// Function untuk highlight search term (TIDAK BERUBAH)
const highlightSearchTerm = (text: string): string => {
  if (!props.searchQuery) return text;

  const regex = new RegExp(`(${props.searchQuery})`, "gi");
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>',
  );
};

// Function untuk get item number (TIDAK BERUBAH)
const getItemNumber = (jenis: string): number => {
  const filteredKeys = Object.keys(props.filteredSuratConfigs);
  return filteredKeys.indexOf(jenis) + 1;
};
</script>

<style scoped>
.theme-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.theme-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.theme-scrollbar::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.theme-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
.theme-scrollbar {
  scrollbar-color: var(--scrollbar-thumb) transparent;
  scrollbar-width: thin;
}
</style>
