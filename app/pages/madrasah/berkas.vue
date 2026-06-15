<template>
  <ResourceGrid
    title="Berkas Madrasah"
    localStorageKey="Berkas"
    emptyMessage="Tidak ada file yang ditemukan"
    :initialVisibleCount="6"
    accentColorClass="bg-emerald-600"
  >
    <template #empty-state>
      <FileX
        class="w-16 h-16 mx-auto mb-4 transition-colors duration-300 text-zinc-600"
        stroke-width="1.5"
      />
    </template>
  </ResourceGrid>
</template>

<script setup>
import { FileX } from "lucide-vue-next";
import ResourceGrid from "~/components/data/ResourceGrid.vue";
</script>
