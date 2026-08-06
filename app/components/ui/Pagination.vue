<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center space-x-2 mt-8">
    <!-- Previous Button -->
    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1"
      class="p-2 rounded-lg border transition-all duration-200 disabled:opacity-30" :style="{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-primary)',
      }" aria-label="Previous Page">
      <ChevronLeft class="w-5 h-5" />
    </button>

    <!-- Page Numbers -->
    <div class="flex items-center space-x-1">
      <template v-for="page in displayedPages" :key="page">
        <button v-if="page !== '...'" @click="changePage(page)" :class="[
          'min-w-[40px] h-10 px-3 rounded-lg border text-sm font-medium transition-all duration-200',
          currentPage === page
            ? 'bg-emerald-600 border-emerald-500 text-white'
            : '',
        ]" :style="currentPage !== page
              ? {
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }
              : {}
            ">
          {{ page }}
        </button>
        <span v-else class="px-2" :style="{ color: 'var(--text-muted)' }">
          {{ page }}
        </span>
      </template>
    </div>

    <!-- Next Button -->
    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages"
      class="p-2 rounded-lg border transition-all duration-200 disabled:opacity-30" :style="{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-primary)',
      }" aria-label="Next Page">
      <ChevronRight class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

import { computed } from "vue";

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "pageChanged", page: number): void;
}>();

const changePage = (page: number | string): void => {
  if (typeof page === "number" && page >= 1 && page <= props.totalPages) {
    emit("pageChanged", page);
  }
};

const displayedPages = computed((): (number | string)[] => {
  const total = props.totalPages;
  const current = props.currentPage;
  const delta = 1; // Number of pages to show around current page
  const range: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) range.push(i);
    return range;
  }

  range.push(1);

  if (current > delta + 2) {
    range.push("...");
  }

  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (current < total - delta - 1) {
    range.push("...");
  }

  range.push(total);

  return range;
});
</script>

<style scoped>
button:disabled {
  cursor: not-allowed;
}
</style>
