<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2" :style="{ color: 'var(--text-heading)' }">
              <GraduationCap class="w-7 h-7 text-emerald-400 shrink-0" />
              Data Siswa
            </h2>
            <p class="text-sm mt-1" style="color: var(--text-muted)">
              Manajemen dan informasi seluruh siswa madrasah
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Tambah Siswa Button (Admin Only) -->
            <BaseButton v-if="isAdmin" text="Tambah" @click="openCreateModal"
              class="!bg-emerald-600 !text-white hover:!bg-emerald-500 !border-emerald-600">
              <template #icon>
                <Plus class="w-4 h-4" />
              </template>
            </BaseButton>

            <!-- Upload Excel Button (Admin Only) -->
            <BaseButton v-if="isAdmin" text="Upload" @click="showUploadModal = true">
              <template #icon>
                <FileSpreadsheet class="w-4 h-4" />
              </template>
            </BaseButton>

            <!-- Export Excel Button -->
            <button @click="exportToExcel" :disabled="isExporting || sortedData.length === 0"
              class="flex items-center justify-center gap-1.5 border px-3 py-1.5 rounded-md text-sm hover:translate-y-[1px] focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              :style="{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }">
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

            <!-- Print Button -->
            <PrintButton>
              <div class="p-10 mx-auto bg-white text-black">
                <!-- Kop Surat -->
                <KopSurat class="mb-4" />

                <!-- Header -->
                <div class="text-center mb-6">
                  <h1 class="font-bold uppercase text-lg">Daftar Data Siswa</h1>
                  <p class="text-sm">Kelas/Rombel: {{ selectedClass }}</p>
                </div>

                <!-- Tabel Cetak -->
                <table class="w-full table-auto border border-gray-800 mb-4 text-xs">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="border border-gray-800 px-2 py-1.5 w-8">No</th>
                      <th class="border border-gray-800 px-2 py-1.5">Nama</th>
                      <th class="border border-gray-800 px-2 py-1.5 w-24">
                        NISN
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5 w-24">
                        NIS Lokal
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5 w-10">
                        L/P
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5 w-32">
                        Kelas / Rombel
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!sortedData || sortedData.length === 0">
                      <td colspan="6" class="border border-gray-800 px-2 py-4 text-center text-gray-500">
                        {{
                          isLoading
                            ? "Memuat data..."
                            : "Tidak ada data siswa tersedia"
                        }}
                      </td>
                    </tr>
                    <tr v-else v-for="(siswa, index) in sortedData" :key="siswa.nisn || index">
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ index + 1 }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 font-semibold">
                        {{ toTitleCase(siswa.nama) }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ siswa.nisn || "-" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ siswa.nis_lokal || "-" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ getJenisKelaminAbbr(siswa.jenis_kelamin) }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ getClassName(siswa.kelas) }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Footer Cetak -->
                <div class="flex justify-between items-end mt-8 text-xs">
                  <div>
                    <p class="italic">
                      Dicetak dari SopokDate pada pukul {{ currentTime }} WITA,
                      tanggal {{ currentDate }}
                    </p>
                  </div>
                  <div class="text-center w-48">
                    <p class="mb-16">Kepala Madrasah</p>
                    <p class="font-bold underline">{{ kepalaMadrasahName }}</p>
                    <p>NIP: {{ kepalaMadrasahNIP }}</p>
                  </div>
                </div>
              </div>
            </PrintButton>
          </div>
        </div>


        <!-- Tab switcher (Admin Only) -->
        <div v-if="isAdmin" class="flex border-b mb-2" style="border-color: var(--border-primary)">
          <button
            @click="activeTab = 'aktif'"
            :class="[
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all relative top-[1px]',
              activeTab === 'aktif'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent'
            ]"
            :style="activeTab !== 'aktif' ? { color: 'var(--text-muted)' } : {}"
          >
            Siswa Aktif
          </button>
          <button
            @click="activeTab = 'buku_induk'"
            :class="[
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all relative top-[1px]',
              activeTab === 'buku_induk'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent'
            ]"
            :style="activeTab !== 'buku_induk' ? { color: 'var(--text-muted)' } : {}"
          >
            Buku Induk
          </button>
        </div>

        <!-- Filter and Search Row -->
        <div v-if="activeTab === 'aktif'" class="flex flex-col md:flex-row gap-4 items-center w-full">
          <!-- Search Input -->
          <div class="w-full md:flex-1">
            <Search @searchUpdated="handleSearch" class="h-10 sm:h-11"
              placeholder="Cari nama, NISN, atau NIS lokal..." />
          </div>

          <!-- Class Dropdown Filter -->
          <div class="w-full md:w-64">
            <SearchableSelect
              v-model="selectedClass"
              :options="classOptionsWithAll"
              placeholder="Pilih Kelas..."
              searchPlaceholder="Cari kelas..."
              class="!h-10 sm:!h-11 text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="pt-2">
        <template v-if="activeTab === 'aktif'">
          <p v-if="isLoading" class="text-center text-lg font-semibold py-12" style="color: var(--text-muted)">
            Memuat data siswa secara realtime...
          </p>

          <div v-else-if="sortedData.length === 0"
            class="text-center py-16 rounded-xl border"
            style="background: var(--bg-secondary); border-color: var(--border-primary)">
            <Database class="w-16 h-16 mx-auto mb-4" style="color: var(--text-faint)" stroke-width="1.5" />
            <p class="text-lg font-medium" style="color: var(--text-secondary)">
              Tidak ada data siswa ditemukan
            </p>
            <p class="text-sm mt-1" style="color: var(--text-muted)">
              Coba sesuaikan kata kunci pencarian atau filter kelas Anda.
            </p>
          </div>

          <!-- Student Grid List -->
          <div v-else>
            <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <PersonCard v-for="(item, index) in visibleData" :key="item.id || index" :item="item" :title="item.nama"
                :subtitle="item.nisn ? 'NISN: ' + item.nisn : '-'" @click="navigateToDetail" />
            </ul>

            <!-- Pagination -->
            <Pagination
              :currentPage="currentPage"
              :totalPages="totalPages"
              @pageChanged="handlePageChange"
            />
          </div>
        </template>

        <template v-else-if="activeTab === 'buku_induk' && isAdmin">
          <!-- Top controls for Buku Induk -->
          <div class="flex flex-col md:flex-row gap-4 items-center mb-6">
            <div class="w-full md:flex-1">
              <Search @searchUpdated="(q) => searchQueryBukuInduk = q" class="h-10 sm:h-11"
                placeholder="Cari nama, NISN, atau NIS lokal di Buku Induk..." />
            </div>
            <div class="w-full md:w-64 flex gap-2">
              <select
                v-model="sortByNisLokal"
                class="w-full h-10 sm:h-11 px-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
              >
                <option value="desc">NIS Lokal: Tertinggi ke Terendah</option>
                <option value="asc">NIS Lokal: Terendah ke Tertinggi</option>
              </select>
            </div>
          </div>

          <p v-if="isLoading || isLoadingBukuInduk" class="text-center text-lg font-semibold py-12" style="color: var(--text-muted)">
            Memuat data Buku Induk...
          </p>

          <div v-else-if="filteredBukuIndukData.length === 0"
            class="text-center py-16 rounded-xl border"
            style="background: var(--bg-secondary); border-color: var(--border-primary)">
            <Database class="w-16 h-16 mx-auto mb-4" style="color: var(--text-faint)" stroke-width="1.5" />
            <p class="text-lg font-medium" style="color: var(--text-secondary)">
              Tidak ada data Buku Induk ditemukan
            </p>
            <p class="text-sm mt-1" style="color: var(--text-muted)">
              Coba sesuaikan kata kunci pencarian Anda.
            </p>
          </div>

          <div v-else>
            <div class="overflow-x-auto rounded-xl border" style="border-color: var(--border-primary); background: var(--bg-card)">
              <table class="w-full text-sm text-left">
                <thead class="border-b" style="background: var(--bg-secondary); border-color: var(--border-primary)">
                  <tr>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-10" style="color: var(--text-muted)">No</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">Nama</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">NIS Lokal</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">NISN</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style="color: var(--text-muted)">L/P</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">Rombel / Keterangan</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style="color: var(--text-muted)">Status</th>
                    <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center" style="color: var(--text-muted)">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in visibleBukuIndukData"
                    :key="item.id || index"
                    class="transition-colors border-b"
                    style="border-color: var(--border-subtle)"
                    :style="{ borderColor: 'var(--border-subtle)' }"
                    @mouseenter="$event.currentTarget.style.background = 'var(--bg-secondary)'"
                    @mouseleave="$event.currentTarget.style.background = ''"
                  >
                    <td class="px-4 py-3 text-xs" style="color: var(--text-muted)">
                      {{ (currentPageBukuInduk - 1) * ITEMS_PER_PAGE_BUKU_INDUK + index + 1 }}
                    </td>
                    <td class="px-4 py-3 font-semibold text-sm" style="color: var(--text-heading)">
                      {{ toTitleCase(item.nama) }}
                    </td>
                    <td class="px-4 py-3 font-mono text-xs" style="color: var(--text-secondary)">
                      {{ item.nis_lokal || '-' }}
                    </td>
                    <td class="px-4 py-3 font-mono text-xs" style="color: var(--text-secondary)">
                      {{ item.nisn || '-' }}
                    </td>
                    <td class="px-4 py-3 text-xs text-center" style="color: var(--text-secondary)">
                      {{ item.gender || '-' }}
                    </td>
                    <td class="px-4 py-3 text-xs" style="color: var(--text-muted)">
                      {{ item.kelas || '-' }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-semibold border',
                          item.status === 'Aktif'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : item.status === 'Alumni'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                        ]"
                      >
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <button
                        @click="navigateToBukuIndukDetail(item)"
                        class="px-2.5 py-1 rounded text-xs text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <Pagination
              :currentPage="currentPageBukuInduk"
              :totalPages="totalPagesBukuInduk"
              @pageChanged="handlePageChangeBukuInduk"
            />
          </div>
        </template>
      </div>

      <!-- CRUD Modal -->
      <CrudModal :show="showModal" :mode="modalMode" :title="modalMode === 'create' ? 'Tambah Data Siswa' : 'Edit Data Siswa'
        " :fields="siswaFields" :initialData="editingItem" :isSaving="isSaving" @submit="handleFormSubmit"
        @close="showModal = false" />

      <!-- Upload Excel Modal -->
      <UploadExcelModal :show="showUploadModal" :dataSiswa="dataSiswa" :dataKelas="dataKelas"
        @close="showUploadModal = false" @success="refreshData('data_siswa')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import {
  Database,
  GraduationCap,
  Plus,
  FileSpreadsheet,
} from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import UploadExcelModal from "~/components/siswa/UploadExcelModal.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import PersonCard from "~/components/data/PersonCard.vue";
import SearchableSelect from "~/components/ui/SearchableSelect.vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { fetchFromApi } from "~/utils/api";
import * as XLSX from "xlsx";

const router = useRouter();
const {
  cardData: dataSiswa,
  isLoading,
  loadData,
  refreshData,
} = useTableData();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "data_siswa",
  () => refreshData("data_siswa"),
);

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("create");
const showUploadModal = ref(false);
const editingItem = ref({});

// Field configuration for Siswa CRUD form
const siswaFields = [
  { key: "nama", label: "Nama", required: true },
  { key: "nisn", label: "NISN" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "No KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
  { key: "kelas", label: "Kelas" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-Laki", "Perempuan"],
  },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No HP" },
  { key: "no_kip", label: "No KIP" },
  { key: "nama_ayah_kandung", label: "Nama Ayah Kandung" },
  { key: "nama_ibu_kandung", label: "Nama Ibu Kandung" },
  { key: "nama_wali", label: "Nama Wali" },
];

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {};
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
    jenis_kelamin: item.jenis_kelamin || "",
    alamat: item.alamat || "",
    no_hp: item.no_hp || "",
    no_kip: item.no_kip || "",
    nama_ayah_kandung: item.nama_ayah_kandung || "",
    nama_ibu_kandung: item.nama_ibu_kandung || "",
    nama_wali: item.nama_wali || "",
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

const handleDelete = (item) => {
  const id = item.id || item._id;
  deleteItem(id, toTitleCase(item.nama));
};

// Map kelas ID to its details
const kelasMap = computed(() => {
  const map = {};
  if (Array.isArray(dataKelas.value)) {
    dataKelas.value.forEach((k) => {
      if (k.id_kelas) {
        map[k.id_kelas] = k;
      }
    });
  }
  return map;
});

const getClassName = (classId) => {
  if (!classId) return "-";
  const classInfo = kelasMap.value[classId];
  return classInfo ? classInfo.nama_kelas : classId;
};

const kepalaMadrasah = ref(null);
const selectedClass = ref("Semua Kelas");
const searchQuery = ref("");
const currentPage = ref(1);
const ITEMS_PER_PAGE = 12;
const isExporting = ref(false);

// Tab states & Buku Induk states
const activeTab = ref("aktif");
const sortByNisLokal = ref("desc");
const searchQueryBukuInduk = ref("");
const currentPageBukuInduk = ref(1);
const ITEMS_PER_PAGE_BUKU_INDUK = 15;

// State for Print timestamp
const currentDate = ref("");
const currentTime = ref("");

const updateDateTime = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  currentDate.value = `${day}/${month}/${year}`;

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const upper = jk.toUpperCase();
  if (upper.startsWith("L")) return "L";
  if (upper.startsWith("P")) return "P";
  return jk;
};

const parseIndonesianDate = (dateStr) => {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s);
  }
  const monthsMap = {
    jan: 'Jan', januari: 'Jan',
    feb: 'Feb', peb: 'Feb', februari: 'Feb', pebruari: 'Feb',
    mar: 'Mar', maret: 'Mar',
    apr: 'Apr', april: 'Apr',
    mei: 'May',
    jun: 'Jun', juni: 'Jun',
    jul: 'Jul', juli: 'Jul',
    agt: 'Aug', agu: 'Aug', agustus: 'Aug',
    sep: 'Sep', september: 'Sep',
    okt: 'Oct', oktober: 'Oct',
    nov: 'Nov', nop: 'Nov', november: 'Nov', nopember: 'Nov',
    des: 'Dec', desember: 'Dec'
  };
  for (const [indo, eng] of Object.entries(monthsMap)) {
    const regex = new RegExp(`\\b${indo}\\b`, 'i');
    if (regex.test(s)) {
      s = s.replace(regex, eng);
      break;
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const calculateAge = (birthDateString) => {
  if (!birthDateString) return "-";
  if (typeof birthDateString === "string" && birthDateString.includes("Tahun")) {
    return birthDateString;
  }
  const birthDate = parseIndonesianDate(birthDateString);
  if (!birthDate) return "-";
  
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years} Tahun, ${months} Bulan, ${days} Hari`;
};

// Generate options for filtering classes dynamically using Nama Kelas
const classOptions = computed(() => {
  if (!Array.isArray(dataKelas.value)) return [];
  return dataKelas.value
    .map((k) => k.nama_kelas)
    .filter((name) => name && String(name).trim() !== "")
    .sort();
});

// Options dengan "Semua Kelas" di awal untuk SearchableSelect
const classOptionsWithAll = computed(() => {
  return ["Semua Kelas", ...classOptions.value];
});

// Dynamic Kepala Madrasah from GTK data (local storage cache lookup or highly optimized filtered fetch)
const loadKepalaMadrasah = async () => {
  try {
    const storedGtk = localStorage.getItem("data_gtk");
    if (storedGtk) {
      const parsed = JSON.parse(storedGtk);
      if (Array.isArray(parsed)) {
        const kamad = parsed.find(
          (guru) =>
            guru.tugas && guru.tugas.toLowerCase().includes("kepala madrasah"),
        );
        if (kamad) {
          kepalaMadrasah.value = kamad;
          return;
        }
      }
    }

    // Fetch only the Kepala Madrasah row (highly optimized!)
    const response = await fetchFromApi("data_gtk", false, null, {
      filter_col: "tugas",
      filter_val: "Kepala Madrasah",
    });
    if (Array.isArray(response) && response.length > 0) {
      kepalaMadrasah.value = response[0];
    }
  } catch (err) {
    console.error("Gagal memuat data Kepala Madrasah:", err);
  }
};

const kepalaMadrasahName = computed(() => {
  return kepalaMadrasah.value
    ? toTitleCase(kepalaMadrasah.value.nama_lengkap)
    : "_________________";
});

const kepalaMadrasahNIP = computed(() => {
  return kepalaMadrasah.value
    ? kepalaMadrasah.value.nip || kepalaMadrasah.value.nuptk || "-"
    : "_________________";
});

// Filtering logic
const filteredData = computed(() => {
  if (!Array.isArray(dataSiswa.value)) return [];
  return dataSiswa.value.filter((item) => {
    const studentClassName = getClassName(item.kelas);
    const matchClass =
      selectedClass.value === "Semua Kelas" ||
      studentClassName === selectedClass.value;
    const term = searchQuery.value.toLowerCase().trim();
    if (!term) return matchClass;

    const nameMatch = (item.nama || "").toLowerCase().includes(term);
    const nisnMatch = String(item.nisn || "")
      .toLowerCase()
      .includes(term);
    const nisLokalMatch = String(item.nis_lokal || "")
      .toLowerCase()
      .includes(term);

    return matchClass && (nameMatch || nisnMatch || nisLokalMatch);
  });
});

// Sorting alphabetically
const sortedData = computed(() => {
  return [...filteredData.value].sort((a, b) =>
    (a.nama || "").localeCompare(b.nama || ""),
  );
});

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

// Reset page when filter or search changes
watch([searchQuery, selectedClass], () => {
  currentPage.value = 1;
});

const handleSearch = (query) => {
  searchQuery.value = query;
};

const navigateToDetail = (item) => {
  const nisLokal = item.nis_lokal;
  if (nisLokal) {
    router.push(`/akademik/siswa/detail/${nisLokal}`);
  }
};

// Buku Induk Lazy Load and calculations
const { cardData: dataAlumni, loadData: loadDataAlumni } = useTableData();
const { cardData: dataMutasi, loadData: loadDataMutasi } = useTableData();
const isLoadingBukuInduk = ref(false);

const loadBukuIndukData = async () => {
  isLoadingBukuInduk.value = true;
  try {
    await Promise.all([
      loadDataAlumni("alumni"),
      loadDataMutasi("mutasi_siswa"),
    ]);
  } catch (err) {
    console.error("Gagal memuat data Buku Induk:", err);
  } finally {
    isLoadingBukuInduk.value = false;
  }
};

watch(activeTab, (newTab) => {
  if (newTab === "buku_induk" && dataAlumni.value.length === 0 && dataMutasi.value.length === 0) {
    loadBukuIndukData();
  }
});

const bukuIndukData = computed(() => {
  const list = [];
  
  if (Array.isArray(dataSiswa.value)) {
    dataSiswa.value.forEach(item => {
      list.push({
        id: item.id || item._id,
        nama: item.nama || "",
        nisn: item.nisn || "",
        nis_lokal: item.nis_lokal || item["nis lokal"] || "",
        kelas: getClassName(item.kelas),
        status: "Aktif",
        gender: getJenisKelaminAbbr(item.jenis_kelamin),
        originalItem: item
      });
    });
  }
  
  if (Array.isArray(dataAlumni.value)) {
    dataAlumni.value.forEach(item => {
      list.push({
        id: item.id || item._id,
        nama: item.nama || "",
        nisn: item.nisn || "",
        nis_lokal: item.nis_lokal || item["nis lokal"] || "",
        kelas: "Alumni (Lulus " + (item.thn_lulus || "") + ")",
        status: "Alumni",
        gender: getJenisKelaminAbbr(item.jenis_kelamin),
        originalItem: item
      });
    });
  }
  
  if (Array.isArray(dataMutasi.value)) {
    dataMutasi.value.forEach(item => {
      list.push({
        id: item.id || item._id,
        nama: item.nama || "",
        nisn: item.nisn || "",
        nis_lokal: item.nis_lokal || item["nis lokal"] || "",
        kelas: "Mutasi (" + (item.kelas || "") + ")",
        status: "Mutasi",
        gender: getJenisKelaminAbbr(item.jenis_kelamin),
        originalItem: item
      });
    });
  }
  
  return list;
});

const filteredBukuIndukData = computed(() => {
  let list = bukuIndukData.value;
  
  const query = searchQueryBukuInduk.value.toLowerCase().trim();
  if (query) {
    list = list.filter(item => 
      (item.nama || "").toLowerCase().includes(query) ||
      (item.nisn || "").toLowerCase().includes(query) ||
      (item.nis_lokal || "").toLowerCase().includes(query)
    );
  }
  
  return list.sort((a, b) => {
    const nisA = String(a.nis_lokal).trim();
    const nisB = String(b.nis_lokal).trim();
    
    if (sortByNisLokal.value === "asc") {
      return nisA.localeCompare(nisB, undefined, { numeric: true });
    } else {
      return nisB.localeCompare(nisA, undefined, { numeric: true });
    }
  });
});

const totalPagesBukuInduk = computed(() => {
  return Math.ceil(filteredBukuIndukData.value.length / ITEMS_PER_PAGE_BUKU_INDUK);
});

const visibleBukuIndukData = computed(() => {
  const start = (currentPageBukuInduk.value - 1) * ITEMS_PER_PAGE_BUKU_INDUK;
  const end = start + ITEMS_PER_PAGE_BUKU_INDUK;
  return filteredBukuIndukData.value.slice(start, end);
});

const handlePageChangeBukuInduk = (page) => {
  currentPageBukuInduk.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

watch([searchQueryBukuInduk, sortByNisLokal], () => {
  currentPageBukuInduk.value = 1;
});

const navigateToBukuIndukDetail = (item) => {
  const nisLokal = item.nis_lokal;
  if (!nisLokal) return;
  
  if (item.status === "Alumni") {
    router.push(`/akademik/alumni/detail/${nisLokal}`);
  } else {
    router.push(`/akademik/siswa/detail/${nisLokal}`);
  }
};

// Export to Excel function using xlsx
const exportToExcel = async () => {
  if (sortedData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  try {
    isExporting.value = true;

    // Mapping fields to user friendly headers
    const exportData = sortedData.value.map((item, index) => ({
      No: index + 1,
      Nama: item.nama || "",
      NISN: item.nisn || "",
      "NIS Lokal": item.nis_lokal || "",
      NIK: item.nik || "",
      "No KK": item.no_kk || "",
      "Tempat Lahir": item.tempat_lahir || "",
      "Tanggal Lahir": item.tanggal_lahir || "",
      "Tingkat - Rombel": getClassName(item.kelas),
      Umur: calculateAge(item.tanggal_lahir || item["tanggal lahir"]),
      "Jenis Kelamin": item.jenis_kelamin || "",
      Alamat: item.alamat || "",
      "No Telepon": item.no_hp || "",
      "No KIP": item.no_kip || "",
      "Nama Ayah Kandung": item.nama_ayah_kandung || "",
      "Nama Ibu Kandung": item.nama_ibu_kandung || "",
      "Nama Wali": item.nama_wali || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set Column Widths
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 15 }, // NISN
      { wch: 15 }, // NIS Lokal
      { wch: 20 }, // NIK
      { wch: 20 }, // No KK
      { wch: 15 }, // Tempat Lahir
      { wch: 15 }, // Tanggal Lahir
      { wch: 18 }, // Tingkat - Rombel
      { wch: 8 }, // Umur
      { wch: 15 }, // Jenis Kelamin
      { wch: 30 }, // Alamat
      { wch: 15 }, // No Telepon
      { wch: 15 }, // No KIP
      { wch: 20 }, // Nama Ayah Kandung
      { wch: 20 }, // Nama Ibu Kandung
      { wch: 20 }, // Nama Wali
    ];
    ws["!cols"] = colWidths;

    // Apply header style (emerald-600 background color)
    const headerRange = [
      "A1",
      "B1",
      "C1",
      "D1",
      "E1",
      "F1",
      "G1",
      "H1",
      "I1",
      "J1",
      "K1",
      "L1",
      "M1",
      "N1",
      "O1",
      "P1",
      "Q1",
    ];
    headerRange.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `Data_Siswa_${selectedClass.value.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      alert(`Data berhasil diekspor ke file: ${filename}`);
    }, 100);
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat mengekspor data");
  } finally {
    isExporting.value = false;
  }
};

let timeInterval = null;

onMounted(() => {
  loadData("data_siswa");
  loadDataKelas("data_kelas");
  loadKepalaMadrasah();
  updateDateTime();
  timeInterval = setInterval(updateDateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>
