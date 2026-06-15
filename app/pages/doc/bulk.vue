<template>
  <div
    class="max-w-7xl mx-auto p-6 outline-none rounded-xl border bg-zinc-900 border-zinc-700"
  >
    <!-- Tombol Kembali dan Cetak -->
    <div class="flex gap-2 mb-5">
      <BaseButton text="← Kembali" @click="goBack" />
      <BaseButton :text="buttonText" @click="printSertifikat" />
    </div>

    <div id="print-area">
      <component
        v-for="(data, index) in dataList"
        :key="index"
        :is="templateComponent"
        v-bind="data"
      />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  requiresAuth: false,
});

import { onMounted, ref, computed } from "vue";

import SertifikatJuaraKelas from "~/components/document/SertifikatJuaraKelas.vue";
import CoverPemberkasan from "~/components/document/CoverPemberkasan.vue";
import CoverAbsenSiswa from "~/components/document/CoverAbsenSiswa.vue";
import CoverAbsenGuruMapel from "~/components/document/CoverAbsenGuruMapel.vue";
import BaseButton from "~/components/ui/BaseButton.vue";

// Use route query to pick the template to render for each item.
const route = useRoute();
const router = useRouter();
const dataList = ref([]);

// Map of supported template components. Keep keys stable and explicit.
const templateMap = {
  juaraKelas: {
    component: SertifikatJuaraKelas,
    title: "Sertifikat Juara Kelas",
  },
  cover: { component: CoverPemberkasan, title: "Cover Pemberkasan" },
  sampulAbsenSiswa: { component: CoverAbsenSiswa, title: "Sampul Absen Siswa" },
  sampulAbsenSiswaGuruMapel: {
    component: CoverAbsenGuruMapel,
    title: "Sampul Absen Siswa Guru Mapel",
  },
};

const templateComponent = computed(() => {
  const type = route.query?.type;
  const templateData = templateMap[type];
  return templateData?.component || null;
});

const buttonText = computed(() => {
  const type = route.query?.type;
  const templateData = templateMap[type];
  return templateData?.title ? `Cetak ${templateData.title}` : "Cetak Dokumen";
});

const goBack = () => router.back();

// Trigger browser print. Kept as-is to preserve behavior.
const printSertifikat = () => window.print();

// Load list of data (saved earlier) from sessionStorage. Guard JSON.parse.
onMounted(() => {
  const stored = sessionStorage.getItem("bulkDoc");
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    dataList.value = Array.isArray(parsed) ? parsed : [];
  } catch {
    // If parse fails, keep an empty list rather than throwing.
    dataList.value = [];
  }
});
</script>

<style>
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
  }

  .print\:hidden {
    display: none !important;
  }

  .page-break {
    page-break-after: always;
  }
}
</style>
