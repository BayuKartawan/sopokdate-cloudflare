<template>
  <AccountTable
    title="Akun GTK"
    initialTable="AkunGtk"
    :breadcrumbs="breadcrumbs"
  />
</template>

<script setup>
import AccountTable from "~/components/data/AccountTable.vue";

definePageMeta({
  requiresAuth: true,
  role: ["admin", "guru", "kepala_madrasah"],
});

const breadcrumbs = [
  { label: "Beranda", to: "/" },
  { label: "Akun", to: "/akun/gtk" },
  { label: "Akun GTK" },
];
</script>
