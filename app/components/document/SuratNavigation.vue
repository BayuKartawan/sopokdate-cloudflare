<!-- \src\components\surat\SuratNavigation.vue -->
<template>
  <div
    class="rounded-xl shadow-sm border overflow-hidden bg-zinc-900 border-zinc-700"
  >
    <div class="p-6">
      <div class="flex items-center space-x-3 mb-4">
        <div class="flex-shrink-0">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-900/30"
          >
            <FileText class="text-blue-400" />
          </div>
        </div>
        <div>
          <h4 class="text-sm font-medium text-zinc-100">Pilih Jenis Surat</h4>
          <p
            v-if="suratConfigsLength > 0"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400"
          >
            Tersedia {{ suratConfigsLength }} jenis surat.
          </p>
        </div>
      </div>

      <div class="mb-4">
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <Search class="w-4 h-4 text-zinc-500" />
          </div>
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text"
            :placeholder="'Cari surat...'"
            class="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder-opacity-60 text-zinc-100 bg-zinc-800 border-zinc-600 placeholder-zinc-400 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-zinc-800"
          />
          <div
            v-if="searchQuery"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <button
              @click="$emit('clear-search')"
              class="rounded-full p-1 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="searchQuery" class="mb-3">
        <span class="text-xs text-zinc-400">
          {{ Object.keys(filteredSuratConfigs).length }} dari
          {{ suratConfigsLength }} surat ditemukan
        </span>
      </div>

      <div class="space-y-2 max-h-96 overflow-y-auto scrollbar-dark">
        <div
          v-for="(config, jenis) in filteredSuratConfigs"
          :key="jenis"
          @click="$emit('select-surat-type', jenis)"
          :class="[
            'p-3 rounded-lg border cursor-pointer group',
            selectedSuratType === jenis
              ? 'bg-blue-900/30 border-blue-600 text-blue-400'
              : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600',
          ]"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h5
                class="text-sm font-medium break-words"
                v-html="highlightSearchTerm(jenis)"
              ></h5>
            </div>
            <div
              :class="[
                'ml-2 ',
                selectedSuratType === jenis
                  ? 'scale-110'
                  : 'group-hover:scale-105',
              ]"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center',
                  selectedSuratType === jenis ? 'text-blue-400 ' : '',
                ]"
              >
                <CheckCircle
                  v-if="selectedSuratType === jenis"
                  class="w-6 h-6"
                />
                <span v-else class="text-xs font-bold">{{
                  getItemNumber(jenis)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="searchQuery && Object.keys(filteredSuratConfigs).length === 0"
          class="text-center py-8"
        >
          <Search class="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p class="text-sm text-zinc-500">Tidak ada surat ditemukan</p>
          <p class="text-xs mt-1 text-zinc-600">Coba kata kunci yang berbeda</p>
          <button
            @click="$emit('clear-search')"
            class="mt-3 px-3 py-1.5 text-xs rounded-md border text-zinc-300 border-zinc-600 hover:bg-zinc-700"
          >
            Hapus Pencarian
          </button>
        </div>

        <div
          v-if="!searchQuery && suratConfigsLength === 0"
          class="text-center py-8"
        >
          <FileText class="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p class="text-sm text-zinc-500">Tidak ada template surat tersedia</p>
          <p class="text-xs mt-1 text-zinc-600">
            Silakan tambah template surat terlebih dahulu
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CheckCircle, FileText, Search, X } from "lucide-vue-next";

import { computed } from "vue";

// Mendefinisikan props yang diterima dari komponen induk
const props = defineProps({
  suratConfigs: Object,
  filteredSuratConfigs: Object,
  selectedSuratType: String,
  searchQuery: String,
});

// BARU: FUNGSI UNTUK MENGETAHUI BANYAK SURAT TERSEDIA
const suratConfigsLength = computed(() => {
  return Object.keys(props.suratConfigs).length;
});

// Function untuk highlight search term (TIDAK BERUBAH)
const highlightSearchTerm = (text) => {
  if (!props.searchQuery) return text;

  const regex = new RegExp(`(${props.searchQuery})`, "gi");
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>',
  );
};

// Function untuk get item number (TIDAK BERUBAH)
const getItemNumber = (jenis) => {
  const filteredKeys = Object.keys(props.filteredSuratConfigs);
  return filteredKeys.indexOf(jenis) + 1;
};
</script>

<style scoped>
/* Scrollbar untuk mode gelap */
.scrollbar-dark::-webkit-scrollbar {
  width: 8px;
}

.scrollbar-dark::-webkit-scrollbar-track {
  background: #27272a;
  border-radius: 4px;
}

.scrollbar-dark::-webkit-scrollbar-thumb {
  background: #52525b;
  border-radius: 4px;
}

.scrollbar-dark::-webkit-scrollbar-thumb:hover {
  background: #71717a;
}

/* Firefox scrollbar styling */
.scrollbar-dark {
  scrollbar-color: #52525b #27272a;
  scrollbar-width: thin;
}
</style>
