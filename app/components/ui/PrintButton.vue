<template>
  <!-- Tombol cetak — styling identik dengan BaseButton size="md" -->
  <button
    @click="printDokument"
    title="Cetak halaman ini"
    class="print:hidden inline-flex items-center justify-center gap-2 border rounded-md text-sm font-medium h-9 px-3 transition-all duration-200 hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 focus:ring-offset-1"
    :style="{
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-primary)',
      color: 'var(--text-primary)',
    }"
  >
    <Printer class="w-4 h-4 flex-shrink-0" />
    <span class="leading-none">Cetak</span>
  </button>

  <!-- Area yang akan dicetak -->
  <div id="print-area" class="hidden print:block">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Printer } from "lucide-vue-next";

const printDokument = (): void => {
  window.print();
};
</script>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }

  #print-area,
  #print-area * {
    visibility: visible;
  }

  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
  }

  .print\:hidden {
    display: none !important;
  }

  .print\:block {
    display: block !important;
  }
}
</style>
