<template>
  <div
    class="max-w-7xl mx-auto p-6 outline-none rounded-xl border bg-zinc-900 border-zinc-700"
  >
    <!-- Tombol Kembali dan Cetak -->
    <div class="flex flex-wrap items-center gap-4 mb-5 print:hidden">
      <BaseButton text="← Kembali" @click="goBack" />
      <BaseButton :text="buttonText" @click="printSertifikat" />

      <!-- Selector Orientasi Halaman -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-zinc-400 font-medium">Orientasi Cetak:</span>
        <select
          v-model="printOrientation"
          class="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="portrait">Portrait (Tegak)</option>
          <option value="landscape">Landscape (Mendatar)</option>
        </select>
      </div>

      <BaseButton
        v-if="isJuaraKelas"
        :text="isSending ? 'Mengirim...' : 'Kirim Data'"
        :disabled="isSending"
        @click="sendCertificateData"
        class="!bg-emerald-600 hover:!bg-emerald-500 !text-white !border-emerald-500 font-semibold cursor-pointer"
      >
        <template #icon>
          <Send class="w-4 h-4" />
        </template>
      </BaseButton>
    </div>

    <div
      class="w-full overflow-hidden flex justify-center items-start print:block print:overflow-visible"
    >
      <div
        id="print-area"
        :style="previewStyle"
        class="origin-top print:!transform-none print:!w-full print:!h-auto print:!m-0"
      >
        <component :is="templateComponent" v-bind="queryWithVerif" />
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  requiresAuth: false,
});

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { Send } from "lucide-vue-next";
import SertifikatJuaraKelas from "~/components/document/SertifikatJuaraKelas.vue";
import CoverPemberkasan from "~/components/document/CoverPemberkasan.vue";
import CoverAbsenSiswa from "~/components/document/CoverAbsenSiswa.vue";
import CoverAbsenGuruMapel from "~/components/document/CoverAbsenGuruMapel.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import { postToApi } from "~/utils/api";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";
import { formatTanggalIndo } from "~/utils/date";

// route query driven template selection
const route = useRoute();
const router = useRouter();
const { Notify } = useNotiflix();
const { currentAcademicYear, currentSemester } = useAcademicYear();

const isSending = ref(false);
const printOrientation = ref("portrait");

const templateMap = {
  juaraKelas: {
    component: SertifikatJuaraKelas,
    title: "Sertifikat Juara Kelas",
    orientation: "landscape",
  },
  cover: {
    component: CoverPemberkasan,
    title: "Berkas Pencairan",
    orientation: "portrait",
  },
  sampulAbsenSiswa: {
    component: CoverAbsenSiswa,
    title: "Cover Absen Siswa",
    orientation: "portrait",
  },
  sampulAbsenSiswaGuruMapel: {
    component: CoverAbsenGuruMapel,
    title: "Cover Absen Guru Mapel",
    orientation: "portrait",
  },
};

const documentTitle = computed(() => {
  const type = route.query?.type;
  if (type === "juaraKelas") {
    const nama = route.query?.nama_lengkap || "Siswa";
    const kelas = route.query?.kelas || "Kelas";
    const juara = route.query?.juara || "";
    const juaraText = juara ? `_Juara ${juara}` : "";
    const rawTitle = `${nama}_${kelas}${juaraText}`;
    return rawTitle.replace(/[\/\\?%*:|"<>]/g, "_");
  }
  const templateData = templateMap[type];
  return templateData?.title || "Dokumen";
});

useHead({
  title: documentTitle,
  style: [
    {
      id: "print-orientation-style",
      children: computed(
        () => `
        @media print {
          @page {
            size: ${printOrientation.value};
            margin: 0 !important;
          }
        }
      `,
      ),
    },
  ],
});

const goBack = () => router.back();

const printSertifikat = () => window.print();

const isJuaraKelas = computed(() => {
  return route.query?.type === "juaraKelas";
});

const scaleVal = ref(1);

const updateScale = () => {
  if (typeof window === "undefined") return;

  const containerWidth = window.innerWidth - 48; // screen padding
  if (isJuaraKelas.value) {
    const targetWidth = 1122; // width of A4 landscape 297mm
    if (containerWidth < targetWidth) {
      scaleVal.value = containerWidth / targetWidth;
      return;
    }
  } else {
    const targetWidth = 794; // width of A4 portrait 210mm
    if (containerWidth < targetWidth) {
      scaleVal.value = containerWidth / targetWidth;
      return;
    }
  }
  scaleVal.value = 1;
};

onMounted(() => {
  updateScale();
  window.addEventListener("resize", updateScale);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScale);
});

const previewStyle = computed(() => {
  const widthPx = isJuaraKelas.value ? 1122 : 794;
  const heightPx = isJuaraKelas.value ? 794 : 1123;

  if (scaleVal.value === 1) {
    return {
      width: `${widthPx}px`,
      minWidth: `${widthPx}px`,
      height: `${heightPx}px`,
    };
  }

  return {
    transform: `scale(${scaleVal.value})`,
    transformOrigin: "top center",
    width: `${widthPx}px`,
    minWidth: `${widthPx}px`,
    height: `${heightPx}px`,
    marginBottom: `-${heightPx * (1 - scaleVal.value)}px`,
  };
});

// Auto-generate verification code: YYYY-MM-DD-NISN
const verifCode = computed(() => {
  if (route.query?.verifikasi) {
    return route.query.verifikasi;
  }

  if (isJuaraKelas.value) {
    const nisn = route.query?.nisn || "";
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}-${nisn}`;
  }

  return "";
});

const sendCertificateData = async () => {
  if (isSending.value) return;
  isSending.value = true;
  try {
    const dataPayload = {
      timestamp: new Date().toISOString(),
      nomor: route.query.nomor || "",
      nama_lengkap: route.query.nama_lengkap || "",
      nisn: route.query.nisn || "",
      kelas: route.query.kelas || "",
      juara: route.query.juara || "",
      wali_kelas: route.query.wali_kelas || "",
      date: formatTanggalIndo(route.query.date || ""),
      verifikasi: verifCode.value,
      semester: currentSemester.value || "",
      tahun_pelajaran: currentAcademicYear.value || "",
    };

    const res = await postToApi("Sertifikat", dataPayload);

    if (res && res.success) {
      Notify.success("Data sertifikat berhasil disimpan ke database!");
    } else {
      Notify.failure("Gagal mengirim data: " + (res?.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Error sending data to database:", err);
    Notify.failure("Gagal mengirim data ke server proxy.");
  } finally {
    isSending.value = false;
  }
};

// watch route query type to set printOrientation
watch(
  () => route.query?.type,
  (newType) => {
    if (newType && templateMap[newType]) {
      printOrientation.value = templateMap[newType].orientation || "portrait";
    }
  },
  { immediate: true },
);

// Make template reactive so it updates automatically when route.query.type changes.
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

// expose the whole route.query as a reactive object with generated verification code for v-bind
const queryWithVerif = computed(() => {
  return {
    ...route.query,
    verifikasi: verifCode.value,
  };
});
</script>

<style>
@media print {
  /* Reset all layout wrappers to prevent scaling issues during print */
  html,
  body,
  #__nuxt,
  main,
  .max-w-7xl,
  .page-layout {
    width: 100% !important;
    max-width: none !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body * {
    visibility: hidden;
  }

  #print-area,
  #print-area * {
    visibility: visible;
  }

  #print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
  }

  .print\:hidden {
    display: none !important;
  }
}
</style>
