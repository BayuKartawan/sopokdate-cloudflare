<template>
  <ResourceGrid
    title="Aplikasi Madrasah"
    localStorageKey="Aplikasi"
    emptyMessage="Tidak ada aplikasi yang ditemukan"
    :initialVisibleCount="20"
    accentColorClass="bg-emerald-600"
  />
</template>

<script setup>
import ResourceGrid from "~/components/data/ResourceGrid.vue";
</script>
