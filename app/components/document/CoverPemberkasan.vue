<template>
  <div
    class="cover-pemberkasan-root w-full max-w-[210mm] print:max-w-none mx-auto bg-white text-black p-4 sm:p-8 md:p-16 shadow-lg border border-neutral-300 print:shadow-none print:border-none">
    <!-- Header with logos -->
    <div
      class="flex justify-center items-center mb-6 sm:mb-10 space-x-4 sm:space-x-8 border-b-2 border-emerald-600 pb-2">
      <img src="/assets/images/logo-kemenag.svg" alt="Logo Kemenag" height="100" width="100"
        class="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain" />
      <img src="/assets/images/logo-madrasah.svg" alt="Logo Madrasah" height="95" width="95"
        class="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain" />
    </div>

    <!-- Title section -->
    <div class="text-center mb-10 sm:mb-20">
      <h1 class="text-lg sm:text-xl md:text-2xl mb-2 font-bold leading-snug text-black">
        <span>BERKAS PENCAIRAN</span><br />
        <span>TUNJANGAN PROFESI GURU NON PNS</span><br />
        <span>BULAN {{ bulan }} {{ getCurrentYear() }}</span>
      </h1>
    </div>

    <!-- Main content -->
    <div
      class="max-w-lg mx-auto mb-10 sm:mb-20 text-sm sm:text-base md:text-lg border-2 border-emerald-600 rounded-2xl p-4 sm:p-5 text-black">
      <div v-if="!dataMadrasah" class="text-center text-red-600 font-bold">
        Data tidak ditemukan - MOHON REFRESH HALAMAN ATAU HUBUNGI ADMIN -
      </div>

      <table class="w-full text-black" v-else>
        <tbody>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">Madrasah</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">
              {{ dataMadrasah?.madrasah || "N/A" }}
            </td>
          </tr>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">NSM</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">
              {{ dataMadrasah?.nsm || "N/A" }}
            </td>
          </tr>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">Siap Id Lembaga</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">
              {{ dataMadrasah?.siap_id || "N/A" }}
            </td>
          </tr>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">NPSN</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">
              {{ dataMadrasah?.npsn || "N/A" }}
            </td>
          </tr>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">Akreditasi</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">
              {{ dataMadrasah?.akreditasi || "N/A" }}
            </td>
          </tr>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">No HP Kamad</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">
              {{ dataMadrasah?.no_hp_kamad || "N/A" }}
            </td>
          </tr>
          <tr>
            <td class="w-1/3 py-1 align-top text-left font-medium text-black">Website</td>
            <td class="w-4 text-center py-1 align-top text-black">:</td>
            <td class="py-1 align-top text-left font-semibold text-black">{{ linkApp }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="text-center mb-6 sm:mb-10">
      <h2 class="text-sm sm:text-base md:text-xl font-bold leading-snug text-black">
        <span>KEMENTRIAN AGAMA KABUPATEN LOMBOK TIMUR</span><br />
        <span>SEKSI PENDIDIKAN MADRASAH</span><br />
        <span>TAHUN ANGGARAN {{ getCurrentYear() }}</span>
      </h2>
    </div>

    <!-- VERIF CODE QR -->
    <div v-if="verifikasi" class="w-full flex gap-4 sm:gap-10 justify-center items-center">
      <div class="text-center">
        <QrcodeVue :value="verifikasi" :size="100" render-as="svg" class="mx-auto" />
        <p class="text-xs sm:text-sm md:text-base text-black rounded_sans_serif_7 mt-1">
          Soft_File
        </p>
      </div>
      <div class="text-center">
        <QrcodeVue :value="linkApp" :size="100" render-as="svg" class="mx-auto" />
        <p class="text-xs sm:text-sm md:text-base text-black rounded_sans_serif_7 mt-1">
          Website_
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import QrcodeVue from "qrcode.vue";
import { useTableData } from "~/composables/data/useTableData";

interface MadrasahData {
  madrasah?: string;
  nsm?: string;
  siap_id?: string;
  npsn?: string;
  akreditasi?: string;
  no_hp_kamad?: string;
  [key: string]: unknown;
}

const { cardData, loadData } = useTableData();
const dataMadrasah = ref<MadrasahData | null>(null);
const runtimeConfig = useRuntimeConfig();
const linkApp = computed<string>(() => {
  const configured = runtimeConfig.public.appMadrasah || runtimeConfig.public.appLink;
  if (configured) return configured as string;
  if (typeof window !== "undefined") return `https://${window.location.host}`;
  return "";
});

const getCurrentYear = (): number => new Date().getFullYear();

onMounted(async () => {
  await loadData("DataMadrasah");
  const data = cardData.value as MadrasahData[] | null;
  if (data && data.length > 0) {
    dataMadrasah.value = data[0];
  }
});

defineProps<{
  bulan?: string;
  verifikasi?: string;
}>();
</script>

<style>
.cover-pemberkasan-root {
  background-color: #ffffff !important;
  color: #000000 !important;
}

.cover-pemberkasan-root h1,
.cover-pemberkasan-root h2,
.cover-pemberkasan-root table,
.cover-pemberkasan-root td,
.cover-pemberkasan-root p,
.cover-pemberkasan-root span:not(.text-red-600):not(.text-red-500) {
  color: #000000 !important;
}

@media screen {
  #print-area {
    width: 100% !important;
  }
}

@media print {
  @page {
    size: portrait;
    margin: 0;
  }

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

  .cover-pemberkasan-root {
    width: 100% !important;
    max-width: none !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 10mm !important;
    box-sizing: border-box !important;
    background-color: #ffffff !important;
    color: #000000 !important;
  }
}
</style>
