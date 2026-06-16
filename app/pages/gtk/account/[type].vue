<template>
  <AccountTable
    :key="tableKey"
    :title="pageTitle"
    :initialTable="tableName"
  />
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AccountTable from "~/components/data/AccountTable.vue";

definePageMeta({
  requiresAuth: true,
  role: ["admin", "guru"],
});

const route = useRoute();

const typeMap = {
  "emis": { name: "AkunEmis", label: "EMIS 4.0" },
  "email": { name: "AkunEmail", label: "Email Madrasah Kemenag" },
  "rdm": { name: "AkunRdm", label: "Raport Digital Madrasah" },
  "emis-gtk": { name: "AkunEmisGTK", label: "EMIS GTK" },
  "simpatika": { name: "AkunSimpatika", label: "SIMPATIKA" },
};

const currentConfig = computed(() => {
  const t = String(route.params.type).toLowerCase();
  return typeMap[t] || typeMap["emis"];
});

const tableName = computed(() => currentConfig.value.name);
const pageTitle = computed(() => `Daftar ${currentConfig.value.label}`);
const tableKey = computed(() => currentConfig.value.name);
</script>
