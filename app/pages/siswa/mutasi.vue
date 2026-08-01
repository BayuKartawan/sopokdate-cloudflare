<!-- app/pages/siswa/mutasi.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="min-w-0 flex-1">
            <h2
              class="text-xl sm:text-2xl font-bold flex items-center gap-2"
              :style="{ color: 'var(--text-heading)' }"
            >
              <LogOut class="w-7 h-7 text-orange-400 shrink-0" />
              Data Mutasi Siswa
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              Catatan siswa yang telah keluar / mutasi dari madrasah
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Tambah Mutasi Button (Admin Only) -->
            <BaseButton v-if="isAdmin" text="Tambah" @click="openCreateModal"
              class="!bg-orange-600 !text-white hover:!bg-orange-500 !border-orange-600 shadow-md shadow-orange-950/30">
              <template #icon>
                <Plus class="w-4 h-4" />
              </template>
            </BaseButton>

            <!-- Upload Excel Button (Admin Only) -->
            <BaseButton v-if="isAdmin" text="Upload" @click="showUploadModal = true"
              class="!bg-zinc-800 hover:!bg-zinc-700 !text-zinc-200 !border-zinc-700">
              <template #icon>
                <FileSpreadsheet class="w-4 h-4" />
              </template>
            </BaseButton>

            <!-- Export Excel Button -->
            <button
              @click="exportToExcel"
              :disabled="isExporting || sortedData.length === 0"
              class="flex items-center justify-center gap-1.5 border px-3 py-1.5 rounded-md text-sm hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              :style="{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }"
            >
              <svg v-if="!isExporting" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-else class="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{{ isExporting ? 'Ekspor...' : 'Ekspor' }}</span>
            </button>
          </div>
        </div>

        <!-- Premium Stats Widgets -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5"
          >
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Total Mutasi</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-heading)]">{{ stats.total }}</span>
              <span class="text-xs text-orange-400 font-medium">siswa</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5"
          >
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Pindah Keluar</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-400">{{ stats.pindah }}</span>
              <span class="text-xs text-zinc-500 font-medium">orang</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5 col-span-2 lg:col-span-1"
          >
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Jenis Mutasi Terbanyak</span>
            <div class="flex items-baseline gap-1.5 flex-wrap">
              <span class="text-sm sm:text-base lg:text-lg font-bold text-rose-400 truncate max-w-full">{{ stats.topJenis }}</span>
            </div>
          </div>
        </div>

        <!-- Filter and Search Row -->
        <div class="flex flex-col md:flex-row gap-3 sm:gap-4 items-center w-full">
          <!-- Search Input -->
          <div class="w-full md:flex-1">
            <Search
              @searchUpdated="handleSearch"
              class="h-10 sm:h-11"
              placeholder="Cari nama, NISN, kelas..."
            />
          </div>

          <!-- Filters Group -->
          <div class="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <!-- Jenis Mutasi Filter -->
            <select
              v-model="selectedJenis"
              class="w-full sm:w-48 h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm cursor-pointer"
            >
              <option value="Semua Jenis">Semua Jenis Mutasi</option>
              <option v-for="jenis in jenisOptions" :key="jenis" :value="jenis">
                {{ jenis }}
              </option>
            </select>

            <!-- Kelas Filter -->
            <select
              v-model="selectedKelas"
              class="w-full sm:w-44 h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm cursor-pointer"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              <option v-for="kelas in kelasOptions" :key="kelas" :value="kelas">
                {{ kelas }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="pt-2">
        <p v-if="isLoading" class="text-center text-zinc-500 text-base font-semibold py-12">
          Memuat data mutasi siswa...
        </p>

        <div
          v-else-if="sortedData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800"
        >
          <LogOut class="w-16 h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
          <p class="text-zinc-400 text-lg font-medium">Tidak ada data mutasi ditemukan</p>
          <p class="text-zinc-500 text-sm mt-1">
            Coba sesuaikan kata kunci pencarian atau filter.
          </p>
        </div>

        <!-- Mutasi Grid List -->
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <PersonCard
              v-for="(item, index) in visibleData"
              :key="item.id || index"
              :item="item"
              :title="toTitleCase(item.nama)"
              :subtitle="`Mutasi: ${item.jenis_mutasi || 'Pindah Keluar'} (${item.kelas || '-'})`"
              @click="navigateToDetail"
            />
          </ul>

          <!-- Pagination -->
          <Pagination
            :currentPage="currentPage"
            :totalPages="totalPages"
            @pageChanged="handlePageChange"
          />
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="modalMode === 'create' ? 'Tambah Data Mutasi' : 'Edit Data Mutasi'"
        :fields="mutasiFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />

      <!-- Upload Excel Modal -->
      <UploadExcelModal
        :show="showUploadModal"
        :dataSiswa="dataMutasi"
        targetTable="mutasi_siswa"
        @close="showUploadModal = false"
        @success="refreshData('mutasi_siswa')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { LogOut, Plus, FileSpreadsheet } from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import PersonCard from "~/components/data/PersonCard.vue";
import Pagination from "~/components/ui/Pagination.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import UploadExcelModal from "~/components/siswa/UploadExcelModal.vue";
import {
  useTableData,
} from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import * as XLSX from "xlsx";

import { useAcademicYear } from "~/composables/utils/useAcademicYear";

const router = useRouter();
const { currentAcademicYear } = useAcademicYear();

const {
  cardData: dataMutasi,
  isLoading,
  loadData,
  refreshData,
} = useTableData();

const { isAdmin, isSaving, createItem, updateItem } = useCrud(
  "mutasi_siswa",
  () => refreshData("mutasi_siswa"),
);

// Modal states
const showModal = ref(false);
const showUploadModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

// Pagination state
const currentPage = ref(1);
const ITEMS_PER_PAGE = 12;

const mutasiFields = [
  { key: "nama", label: "Nama Lengkap", required: true },
  { key: "nisn", label: "NISN" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "Nomor KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
  { key: "kelas", label: "Tingkat Kelas" },
  { key: "tahun_ajaran", label: "Tahun Ajaran Mutasi" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-laki", "Perempuan"],
  },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No Telepon / WhatsApp" },
  { key: "no_kip", label: "Nomor KIP/PIP" },
  { key: "nama_ayah_kandung", label: "Nama Ayah Kandung" },
  { key: "nama_ibu_kandung", label: "Nama Ibu Kandung" },
  { key: "nama_wali", label: "Nama Wali" },
  {
    key: "jenis_mutasi",
    label: "Jenis Mutasi",
    type: "select",
    options: ["Pindah Keluar", "Dikeluarkan", "Mengundurkan Diri", "Meninggal Dunia"],
  },
  { key: "sekolah_tujuan", label: "Sekolah Tujuan" },
  { key: "tanggal_mutasi", label: "Tanggal Mutasi", type: "date" },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {
    tahun_ajaran: currentAcademicYear.value || "",
    jenis_mutasi: "Pindah Keluar",
    jenis_kelamin: "Laki-laki",
  };
  showModal.value = true;
};

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    nama: item.nama || "",
    nisn: item.nisn || "",
    nis_lokal: item.nis_lokal || "",
    nik: item.nik || "",
    no_kk: item.no_kk || "",
    tempat_lahir: item.tempat_lahir || "",
    tanggal_lahir: item.tanggal_lahir || "",
    kelas: item.kelas || "",
    tahun_ajaran: item.tahun_ajaran || "",
    jenis_kelamin: item.jenis_kelamin || "Laki-laki",
    alamat: item.alamat || "",
    no_hp: item.no_hp || "",
    no_kip: item.no_kip || "",
    nama_ayah_kandung: item.nama_ayah_kandung || "",
    nama_ibu_kandung: item.nama_ibu_kandung || "",
    nama_wali: item.nama_wali || "",
    jenis_mutasi: item.jenis_mutasi || "Pindah Keluar",
    sekolah_tujuan: item.sekolah_tujuan || "",
    tanggal_mutasi: item.tanggal_mutasi || "",
    keterangan: item.keterangan || "",
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  let success = false;
  if (modalMode.value === "create") {
    success = await createItem(formData);
  } else {
    const id = editingItem.value._id;
    success = await updateItem(id, formData);
  }
  if (success) {
    showModal.value = false;
  }
};

const navigateToDetail = (item) => {
  const nisLokal = item.nis_lokal || item["nis lokal"];
  if (nisLokal) {
    router.push(`/akademik/mutasi/detail/${nisLokal}`);
  }
};

const selectedJenis = ref("Semua Jenis");
const selectedKelas = ref("Semua Kelas");
const searchQuery = ref("");
const isExporting = ref(false);

const toTitleCase = (str) => {
  if (!str) return "";
  return String(str).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

// Dynamic filter options
const jenisOptions = computed(() => {
  if (!Array.isArray(dataMutasi.value)) return [];
  const all = dataMutasi.value.map((k) => k.jenis_mutasi).filter((j) => j && j.trim() !== "");
  return [...new Set(all)].sort();
});

const kelasOptions = computed(() => {
  if (!Array.isArray(dataMutasi.value)) return [];
  const all = dataMutasi.value.map((k) => k.kelas).filter((k) => k && k.trim() !== "");
  return [...new Set(all)].sort();
});

// Filtering
const filteredData = computed(() => {
  if (!Array.isArray(dataMutasi.value)) return [];
  return dataMutasi.value.filter((item) => {
    const matchJenis = selectedJenis.value === "Semua Jenis" || item.jenis_mutasi === selectedJenis.value;
    const matchKelas = selectedKelas.value === "Semua Kelas" || item.kelas === selectedKelas.value;
    const term = searchQuery.value.toLowerCase().trim();
    if (!term) return matchJenis && matchKelas;

    const nameMatch = (item.nama || "").toLowerCase().includes(term);
    const nisnMatch = String(item.nisn || "").toLowerCase().includes(term);
    const nisLokalMatch = String(item.nis_lokal || "").toLowerCase().includes(term);
    const kelasMatch = (item.kelas || "").toLowerCase().includes(term);

    return matchJenis && matchKelas && (nameMatch || nisnMatch || nisLokalMatch || kelasMatch);
  });
});

const sortedData = computed(() =>
  [...filteredData.value].sort((a, b) =>
    (b.tanggal_mutasi || "").localeCompare(a.tanggal_mutasi || ""),
  ),
);

const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / ITEMS_PER_PAGE);
});

const visibleData = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return sortedData.value.slice(start, end);
});

const handlePageChange = (page) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Reset page when search or filters change
watch([searchQuery, selectedJenis, selectedKelas], () => {
  currentPage.value = 1;
});

const stats = computed(() => {
  const list = Array.isArray(dataMutasi.value) ? dataMutasi.value : [];
  const total = list.length;
  const pindah = list.filter((i) => (i.jenis_mutasi || "").toLowerCase().includes("pindah")).length;

  const jenisCounts = {};
  list.forEach((i) => {
    if (i.jenis_mutasi) {
      jenisCounts[i.jenis_mutasi] = (jenisCounts[i.jenis_mutasi] || 0) + 1;
    }
  });
  let topJenis = "-";
  let topCount = 0;
  for (const [j, count] of Object.entries(jenisCounts)) {
    if (count > topCount) { topJenis = j; topCount = count; }
  }

  return { total, pindah, topJenis };
});

const handleSearch = (query) => {
  searchQuery.value = query;
};

const exportToExcel = async () => {
  if (sortedData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }
  try {
    isExporting.value = true;
    const exportData = sortedData.value.map((item, index) => ({
      No: index + 1,
      "Nama Lengkap": item.nama || "",
      NISN: item.nisn || "",
      "NIS Lokal": item.nis_lokal || "",
      NIK: item.nik || "",
      "Tingkat Kelas": item.kelas || "",
      "Tahun Ajaran Mutasi": item.tahun_ajaran || "",
      "Jenis Kelamin": item.jenis_kelamin || "",
      "Jenis Mutasi": item.jenis_mutasi || "",
      "Tanggal Mutasi": item.tanggal_mutasi || "",
      "Sekolah Tujuan": item.sekolah_tujuan || "",
      Keterangan: item.keterangan || "",
      Alamat: item.alamat || "",
      "No Telepon": item.no_hp || "",
      "Nama Ayah Kandung": item.nama_ayah_kandung || "",
      "Nama Ibu Kandung": item.nama_ibu_kandung || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [
      { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Data Mutasi Siswa");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Data_Mutasi_Siswa_${dateStr}.xlsx`);
    setTimeout(() => alert("Data mutasi berhasil diekspor."), 100);
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat mengekspor data.");
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  loadData("mutasi_siswa");
});
</script>
