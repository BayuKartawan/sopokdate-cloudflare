<template>
  <div class="relative inline-block print:hidden">
    <!-- Single button if no options -->
    <button
      v-if="!options || options.length === 0"
      @click="printDokument"
      title="Cetak halaman ini"
      class="inline-flex items-center justify-center gap-2 border rounded-md text-sm font-medium h-9 px-3 transition-all duration-200 hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 focus:ring-offset-1 cursor-pointer"
      :style="{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-primary)',
      }"
    >
      <Printer class="w-4 h-4 flex-shrink-0" />
      <span class="leading-none">Cetak</span>
    </button>

    <!-- Dropdown button if options provided -->
    <div v-else class="relative">
      <button
        @click="isOpen = !isOpen"
        title="Pilih format cetak"
        class="inline-flex items-center justify-center gap-2 border rounded-md text-sm font-medium h-9 px-3 transition-all duration-200 hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 focus:ring-offset-1 cursor-pointer"
        :style="{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)',
        }"
      >
        <Printer class="w-4 h-4 flex-shrink-0" />
        <span class="leading-none">Cetak</span>
        <ChevronDown class="w-3.5 h-3.5 opacity-70 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
      </button>

      <!-- Click outside overlay -->
      <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>

      <!-- Options Dropdown Menu -->
      <div
        v-if="isOpen"
        class="absolute right-0 mt-1 w-52 rounded-lg shadow-lg border z-50 overflow-hidden py-1 transition-all"
        :style="{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderColor: 'var(--border-primary, #e5e7eb)',
          color: 'var(--text-primary, #111827)',
        }"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          @click="selectOption(opt)"
          class="w-full text-left px-3 py-2 text-xs font-medium flex flex-col gap-0.5 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors cursor-pointer"
          :class="[modelValue === opt.value ? 'bg-emerald-500/10 text-emerald-500 font-semibold' : '']"
        >
          <span>{{ opt.label }}</span>
          <span v-if="opt.description" class="text-[10px] opacity-60 font-normal">{{ opt.description }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Area yang akan dicetak -->
  <div id="print-area" class="hidden print:block">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { Printer, ChevronDown } from "lucide-vue-next";

export interface PrintOption {
  label: string;
  value: string;
  description?: string;
  documentTitle?: string;
}

const props = defineProps<{
  options?: PrintOption[];
  modelValue?: string;
  documentTitle?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "select", option: PrintOption): void;
  (e: "print"): void;
}>();

const isOpen = ref(false);

const executePrintWithTitle = (customTitle?: string): void => {
  const titleToUse = customTitle || props.documentTitle;
  const originalTitle = document.title;

  if (titleToUse) {
    document.title = titleToUse;
  }

  window.print();

  if (titleToUse) {
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  }
};

const printDokument = (): void => {
  isOpen.value = false;
  emit("print");
  executePrintWithTitle();
};

const selectOption = (opt: PrintOption): void => {
  isOpen.value = false;
  emit("update:modelValue", opt.value);
  emit("select", opt);
  nextTick(() => {
    executePrintWithTitle(opt.documentTitle);
  });
};
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden !important;
  }

  #print-area,
  #print-area * {
    visibility: visible !important;
  }

  #print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  .print\:hidden {
    display: none !important;
  }

  .print\:block {
    display: block !important;
  }
}
</style>

