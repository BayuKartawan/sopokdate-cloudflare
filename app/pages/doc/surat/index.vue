<template>
  <div class="page-layout">
    <!-- Breadcrumb / Tab Components -->
    <div v-if="isAdmin && !isLoading" class="flex border-b border-zinc-700 mb-6 space-x-6">
      <button
        @click="activeTab = 'generator'"
        class="pb-3 text-sm font-semibold transition-all border-b-2 px-1 focus:outline-none flex items-center gap-2"
        :class="activeTab === 'generator' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'"
      >
        <FileText class="w-4 h-4" />
        Generator Surat
      </button>
      <button
        @click="activeTab = 'crud'"
        class="pb-3 text-sm font-semibold transition-all border-b-2 px-1 focus:outline-none flex items-center gap-2"
        :class="activeTab === 'crud' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-200'"
      >
        <Settings class="w-4 h-4" />
        Kelola Template (Admin)
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>

    <div v-else>
      <!-- Generator View -->
      <div v-if="activeTab === 'generator'" class="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <!-- On mobile: show sidebar first, then main form. On xl and up: original order restored -->
        <div class="xl:col-span-2 order-2 xl:order-1">
          <div
            class="rounded-xl shadow-sm border overflow-hidden bg-zinc-900 border-zinc-700"
          >
            <div class="p-6 md:p-8">
              <FormUniversal
                :suratConfigs="suratConfigs"
                @generateSurat="handleGenerateSurat"
                ref="formUniversalRef"
              />
            </div>
          </div>
        </div>

        <div class="xl:col-span-1 order-1 xl:order-2">
          <div class="sticky top-16 space-y-6">
            <div
              class="rounded-xl shadow-sm border overflow-hidden p-5 bg-zinc-900 border-zinc-700"
            >
              <BaseButton text="Buat banyak surat" to="/dokumen/surat/massal" />
            </div>

            <SuratNavigation
              :surat-configs="suratConfigs"
              :filtered-surat-configs="filteredSuratConfigs"
              :selected-surat-type="selectedSuratType"
              v-model:searchQuery="searchQuery"
              @select-surat-type="selectSuratType"
              @clear-search="clearSearch"
            />
          </div>
        </div>
      </div>

      <!-- Admin Template Manager -->
      <div v-else-if="activeTab === 'crud' && isAdmin">
        <SuratCrudManager @refresh="handleRefresh" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, onBeforeUnmount, nextTick } from "vue";
import { FileText, Settings } from "lucide-vue-next";
import { useNotiflix } from "~/composables/ui/useFeedback";
import FormUniversal from "~/components/form/FormUniversal.vue";
import SuratNavigation from "~/components/document/SuratNavigation.vue";
import SuratCrudManager from "~/components/document/SuratCrudManager.vue";
import { generateDocx } from "~/utils/generateDocx";
import { useTableData } from "~/composables/data/useTableData";

import BaseButton from "~/components/ui/BaseButton.vue";

const { Notify, Loading } = useNotiflix();
// Gunakan composable untuk localStorage
const { cardData, isLoading, loadData } = useTableData();
// Reference untuk FormUniversal component
const formUniversalRef = ref(null);
// State untuk tracking surat type yang dipilih
const selectedSuratType = ref("");
// State untuk search functionality
const searchQuery = ref("");
// Active tab state for admin
const activeTab = ref("generator");

const isAdmin = computed(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("user-role") === "admin";
});

const handleRefresh = () => {
  loadData("surat", true);
};
// Computed untuk filtered surat configs berdasarkan search query
const filteredSuratConfigs = computed(() => {
  if (!searchQuery.value) {
    return suratConfigs.value;
  }

  const query = searchQuery.value.toLowerCase();
  const filtered = {};

  Object.entries(suratConfigs.value).forEach(([jenis, config]) => {
    if (jenis.toLowerCase().includes(query)) {
      filtered[jenis] = config;
    }
  });

  return filtered;
});

// Computed untuk transform data menjadi format yang diperlukan
const suratConfigs = computed(() => {
  // Jika cardData adalah array (format lama), transform ke object
  if (Array.isArray(cardData.value)) {
    const configs = {};
    cardData.value.forEach((item) => {
      if (item.nama) {
        configs[item.nama] = item;
      }
    });
    return configs;
  }
  // Jika sudah dalam format object, gunakan langsung
  return cardData.value || {};
});

// Function untuk select surat type dari navigation
const selectSuratType = async (jenis) => {
  selectedSuratType.value = jenis;

  // Trigger selection in FormUniversal component if method exposed
  if (
    formUniversalRef.value &&
    typeof formUniversalRef.value.setSelectedJenis === "function"
  ) {
    formUniversalRef.value.setSelectedJenis(jenis);
  }

  // Only scroll the FormUniversal into view on mobile (below Tailwind's xl breakpoint)
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 1279px)").matches
  ) {
    await nextTick();
    try {
      const el = formUniversalRef.value && formUniversalRef.value.$el;
      if (el && typeof el.getBoundingClientRect === "function") {
        const rect = el.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        // Position the element 10px below the top of the viewport
        const target = Math.max(0, absoluteTop - 100);
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    } catch {
      // ignore scroll errors
    }
  }
};

// Function untuk clear search
const clearSearch = () => {
  searchQuery.value = "";
};

// Proses pembuatan surat
const handleGenerateSurat = async (jenisSurat, formData) => {
  try {
    const config = suratConfigs.value[jenisSurat];
    if (!config) {
      throw new Error(
        `Konfigurasi untuk jenis surat '${jenisSurat}' tidak ditemukan.`,
      );
    }

    const { templatePath } = config;
    if (!templatePath) {
      throw new Error(
        `Path template untuk '${jenisSurat}' tidak didefinisikan.`,
      );
    }

    Loading.circle("Sedang memproses surat...");

    const fileName = `${jenisSurat.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;

    // Start generation (silent in production)

    // Langsung panggil fungsi generateDocx karena semua template dipastikan docx
    await generateDocx(templatePath, formData, fileName);

    // Generation finished (silent in production)

    Loading.remove();
    Notify.success("Surat berhasil dibuat!");
  } catch (error) {
    Loading.remove();
    Notify.failure(`Gagal membuat surat: ${error.message}`);
  }
};

// Inisialisasi
onMounted(() => {
  loadData("surat"); // Load data surat dari localStorage
});
</script>
