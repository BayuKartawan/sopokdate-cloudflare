<template>
  <div class="relative w-full">
    <label for="search-input" class="sr-only">Search</label>
    <div class="relative flex items-center">
      <input id="search-input" ref="searchInput" type="text" v-model="searchQuery"
        @input="$emit('searchUpdated', searchQuery)" placeholder="Cari..."
        class="w-full rounded-lg border py-2 pe-12 pl-4 text-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-opacity-50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
        :style="{
          backgroundColor: 'var(--bg-input-alpha)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-primary)',
        }" />
      <button v-if="searchQuery" type="button" @click="clearSearch"
        class="absolute right-3 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 ease-in-out hover:text-red-400 hover:bg-red-500/20 active:bg-red-500/30"
        :style="{ color: 'var(--text-secondary)' }">
        <span class="sr-only">Clear search</span>
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { X } from "lucide-vue-next";

const emit = defineEmits<{
  (e: "searchUpdated", query: string): void;
}>();
const searchQuery = ref<string>("");
const searchInput = ref<HTMLInputElement | null>(null);

const clearSearch = (): void => {
  searchQuery.value = "";
  emit("searchUpdated", "");
  // Keep focus on the input after clearing
  searchInput.value?.focus();
};
</script>
