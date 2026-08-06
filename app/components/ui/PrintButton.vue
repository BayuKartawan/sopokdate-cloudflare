<template>
  <div>
    <div>
      <BaseButton text="Cetak" @click="printDokument" class="print:hidden">
        <template #icon>
          <Printer class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
        </template>
      </BaseButton>
    </div>

    <!-- Area yang akan dicetak -->
    <div id="print-area" class="hidden print:block">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from "./BaseButton.vue";
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
