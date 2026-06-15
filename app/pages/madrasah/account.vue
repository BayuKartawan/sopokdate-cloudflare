<template>
  <AccountTable
    title="Daftar Akun Madrasah"
    initialTable="Operator"
    showEmptyStateDetails
  />
</template>

<script setup>
definePageMeta({
  requiresAuth: true,
  role: "admin",
});

import AccountTable from "~/components/data/AccountTable.vue";
</script>
