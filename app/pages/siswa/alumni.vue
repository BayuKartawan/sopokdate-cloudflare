<!-- app/pages/siswa/alumni.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2" :style="{ color: 'var(--text-heading)' }">
              <GraduationCap class="w-7 h-7 text-indigo-400 shrink-0" />
              Data Alumni
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              Informasi kelulusan dan penelusuran studi lanjut alumni madrasah
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Tambah Alumni Button (Admin Only) -->
            <BaseButton v-if="isAdmin" text="Tambah" @click="openCreateModal"
              class="!bg-indigo-600 !text-white hover:!bg-indigo-500 !border-indigo-600 shadow-md shadow-indigo-950/30">
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
                  <h1 class="font-bold uppercase text-lg">
                    Daftar Data Alumni
                  </h1>
                  <p class="text-sm">
                    Tahun Lulus: {{ selectedYear }} | Studi Lanjut:
                    {{ selectedDestination }}
                  </p>
                </div>

                <!-- Tabel Cetak -->
                <table class="w-full table-auto border border-gray-800 mb-4 text-xs">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="border border-gray-800 px-2 py-1.5 w-8">No</th>
                      <th class="border border-gray-800 px-2 py-1.5">
                        Nama Lengkap
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5 w-24">
                        NISN
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5 w-20">
                        Tahun Lulus
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5 w-24">
                        Melanjutkan Ke
                      </th>
                      <th class="border border-gray-800 px-2 py-1.5">Alamat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!sortedData || sortedData.length === 0">
                      <td colspan="6" class="border border-gray-800 px-2 py-4 text-center text-gray-500">
                        {{
                          isLoading
                            ? "Memuat data..."
                            : "Tidak ada data alumni tersedia"
                        }}
                      </td>
                    </tr>
                    <tr v-else v-for="(alumni, index) in sortedData" :key="alumni.id || index">
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ index + 1 }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 font-semibold">
                        {{ toTitleCase(alumni.nama) }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center font-mono">
                        {{ alumni.nisn || "-" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ alumni.thn_lulus || "-" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ alumni.menjutkan_ke || "Tidak Melanjutkan" }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ alumni.alamat || "-" }}
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

        <!-- Premium Stats Widgets -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            class="bg-zinc-900/40 border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5">
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Total Alumni</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-heading)]">{{ stats.total }}</span>
              <span class="text-xs text-indigo-400 font-medium">orang</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5">
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Melanjutkan Studi</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">{{ stats.continuing }}</span>
              <span class="text-xs text-zinc-500 font-medium">({{ stats.continuingPercent }}%)</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5">
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Tahun Lulus Terbanyak</span>
            <div class="flex items-baseline gap-1.5 flex-wrap">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-violet-400">{{ stats.topYear }}</span>
              <span class="text-[10px] sm:text-xs text-zinc-500 font-medium">({{ stats.topYearCount }} org)</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 border border-zinc-800/60 p-3.5 sm:p-4 rounded-xl flex flex-col justify-between gap-1.5">
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Tujuan Terpopuler</span>
            <div class="flex items-end">
              <span class="text-sm sm:text-base lg:text-lg font-bold text-amber-400 truncate max-w-full leading-snug"
                :title="stats.topDestination">
                {{ stats.topDestination }}
              </span>
            </div>
          </div>
        </div>

        <!-- Filter and Search Row -->
        <div class="flex flex-col md:flex-row gap-3 sm:gap-4 items-center w-full">
          <!-- Search Input -->
          <div class="w-full md:flex-1">
            <Search @searchUpdated="handleSearch" class="h-10 sm:h-11"
              placeholder="Cari nama alumni, NISN, alamat..." />
          </div>

          <!-- Filters Group -->
          <div class="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <!-- Year Filter -->
            <select v-model="selectedYear"
              class="w-full sm:w-48 h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm cursor-pointer">
              <option value="Semua Tahun">Semua Tahun Lulus</option>
              <option v-for="year in yearOptions" :key="year" :value="year">
                Lulus {{ year }}
              </option>
            </select>

            <!-- Destination Filter -->
            <select v-model="selectedDestination"
              class="w-full sm:w-56 h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm cursor-pointer">
              <option value="Semua Tujuan">Semua Studi Lanjut</option>
              <option v-for="dest in destinationOptions" :key="dest" :value="dest">
                {{ dest }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="pt-2">
        <p v-if="isLoading" class="text-center text-zinc-500 text-base font-semibold py-12">
          Memuat data alumni...
        </p>

        <div v-else-if="sortedData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800">
          <Database class="w-16 h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
          <p class="text-zinc-400 text-lg font-medium">
            Tidak ada data alumni ditemukan
          </p>
          <p class="text-zinc-500 text-sm mt-1">
            Coba sesuaikan kata kunci pencarian atau filter pilihan Anda.
          </p>
        </div>

        <!-- Alumni Grid List -->
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <PersonCard
              v-for="(item, index) in visibleData"
              :key="item.id || index"
              :item="item"
              :title="toTitleCase(item.nama)"
              :subtitle="`Lulus Tahun ${item.thn_lulus || '-'}`"
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
      <CrudModal :show="showModal" :mode="modalMode" :title="modalMode === 'create' ? 'Tambah Data Alumni' : 'Edit Data Alumni'
        " :fields="alumniFields" :initialData="editingItem" :isSaving="isSaving" @submit="handleFormSubmit"
        @close="showModal = false" />

      <!-- Upload Excel Modal -->
      <UploadExcelModal
        :show="showUploadModal"
        :dataSiswa="dataAlumni"
        targetTable="alumni"
        @close="showUploadModal = false"
        @success="refreshData('alumni')"
      />
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
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import UploadExcelModal from "~/components/siswa/UploadExcelModal.vue";
import PersonCard from "~/components/data/PersonCard.vue";
import Pagination from "~/components/ui/Pagination.vue";
import {
  useTableData,
  clearTableSessionCache,
} from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromApi, postToApi, deleteFromApi } from "~/utils/api";
import * as XLSX from "xlsx";

const router = useRouter();
const {
  cardData: dataAlumni,
  isLoading,
  loadData,
  refreshData,
} = useTableData();

const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "alumni",
  () => refreshData("alumni"),
);
const { Notify, Confirm } = useNotiflix();

// CRUD Modal state
const showModal = ref(false);
const showUploadModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

// Pagination state
const currentPage = ref(1);
const ITEMS_PER_PAGE = 12;

// Field configuration for Alumni CRUD form
const alumniFields = [
  { key: "nama", label: "Nama Lengkap", required: true },
  { key: "foto", label: "Tautan Foto (URL)" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nisn", label: "NISN" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "Nomor KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "text" },
  {
    key: "jenis_kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-laki", "Perempuan"],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Lulus", "Berhenti", "Pindah"],
  },
  { key: "thn_lulus", label: "Tahun Lulus", required: true },
  { key: "menjutkan_ke", label: "Melanjutkan Ke (Studi Lanjut)" },
  { key: "alamat", label: "Alamat", type: "textarea" },
  { key: "no_hp", label: "No Telepon / WhatsApp" },
  { key: "no_kip", label: "Nomor KIP/PIP" },
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
    foto: item.foto || "",
    nis_lokal: item.nis_lokal || "",
    nisn: item.nisn || "",
    nik: item.nik || "",
    no_kk: item.no_kk || "",
    tempat_lahir: item.tempat_lahir || "",
    tanggal_lahir: item.tanggal_lahir || "",
    jenis_kelamin: item.jenis_kelamin || "Laki-laki",
    status: item.status || "Lulus",
    thn_lulus: item.thn_lulus || "",
    menjutkan_ke: item.menjutkan_ke || "",
    alamat: item.alamat || "",
    no_hp: item.no_hp || "",
    no_kip: item.no_kip || "",
    nama_ayah_kandung: item.nama_ayah_kandung || "",
    nama_ibu_kandung: item.nama_ibu_kandung || "",
    nama_wali: item.nama_wali || "",
  };
  showModal.value = true;
};

const navigateToDetail = (item) => {
  const nisLokal = item.nis_lokal;
  if (nisLokal) {
    router.push(`/akademik/alumni/detail/${nisLokal}`);
  }
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

  Confirm?.show(
    "Kembalikan Alumni Menjadi Siswa Aktif",
    `Apakah Anda yakin ingin membatalkan status kelulusan ${toTitleCase(item.nama)}? Siswa ini akan dipindahkan kembali ke Kelas 6 aktif dan dihapus dari data Alumni.`,
    "Ya, Kembalikan",
    "Batal",
    async () => {
      try {
        // 1. Fetch data kelas untuk mencari tingkat 6
        const classes = await fetchFromApi("data_kelas");
        let targetClassId = "VI-A"; // default fallback

        if (Array.isArray(classes)) {
          // Cari kelas tingkat 6 (bisa berupa "6" atau "VI")
          const level6Class = classes.find(
            (c) =>
              String(c.tingkat) === "6" ||
              String(c.tingkat).toUpperCase() === "VI",
          );
          if (level6Class && level6Class.id_kelas) {
            targetClassId = level6Class.id_kelas;
          }
        }

        // 2. Buat record siswa baru di data_siswa
        const studentRecord = {
          nama: item.nama,
          nisn: item.nisn || "",
          nis_lokal: item.nis_lokal || "",
          nik: item.nik || "",
          no_kk: item.no_kk || "",
          tempat_lahir: item.tempat_lahir || "",
          tanggal_lahir: item.tanggal_lahir || "",
          kelas: targetClassId,
          jenis_kelamin: item.jenis_kelamin || "Laki-laki",
          alamat: item.alamat || "",
          no_hp: item.no_hp || "",
          no_kip: item.no_kip || "",
          nama_ayah_kandung: item.nama_ayah_kandung || "",
          nama_ibu_kandung: item.nama_ibu_kandung || "",
          nama_wali: item.nama_wali || "",
          status_promosi: "Belum",
        };

        // Post ke data_siswa
        await postToApi("data_siswa", studentRecord);

        // 3. Hapus dari alumni
        await deleteFromApi("alumni", id);

        Notify?.success?.(
          `Berhasil mengembalikan ${toTitleCase(item.nama)} ke kelas ${targetClassId}.`,
        );

        // 4. Refresh data alumni
        await refreshData("alumni");
        // Clear cached data_siswa session cache so it reloads fresh in other pages
        clearTableSessionCache("data_siswa");
      } catch (err) {
        console.error("Gagal memproses pengembalian alumni:", err);
        Notify?.failure?.("Gagal mengembalikan data alumni ke siswa aktif.");
      }
    },
  );
};

const kepalaMadrasah = ref(null);
const selectedYear = ref("Semua Tahun");
const selectedDestination = ref("Semua Tujuan");
const searchQuery = ref("");
const isExporting = ref(false);

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
  return String(str)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

// Generate options for filtering years dynamically
const yearOptions = computed(() => {
  if (!Array.isArray(dataAlumni.value)) return [];
  const years = dataAlumni.value
    .map((k) => k.thn_lulus)
    .filter((y) => y && String(y).trim() !== "");
  return [...new Set(years)].sort((a, b) => b - a); // descending order
});

// Generate options for filtering continuing destination dynamically
const destinationOptions = computed(() => {
  if (!Array.isArray(dataAlumni.value)) return [];
  const dests = dataAlumni.value
    .map((k) => k.menjutkan_ke)
    .filter(
      (d) =>
        d &&
        String(d).trim() !== "" &&
        String(d).toLowerCase() !== "tidak melanjutkan",
    );

  const uniqueDests = [...new Set(dests)].sort();
  return [...uniqueDests, "Tidak Melanjutkan"];
});

// Dynamic Kepala Madrasah lookup from GTK data
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
  if (!Array.isArray(dataAlumni.value)) return [];
  return dataAlumni.value.filter((item) => {
    // 1. Year Filter
    const matchYear =
      selectedYear.value === "Semua Tahun" ||
      String(item.thn_lulus).trim() === String(selectedYear.value).trim();

    // 2. Destination Filter
    let matchDest = false;
    if (selectedDestination.value === "Semua Tujuan") {
      matchDest = true;
    } else if (selectedDestination.value === "Tidak Melanjutkan") {
      matchDest =
        !item.menjutkan_ke ||
        String(item.menjutkan_ke).toLowerCase().includes("tidak");
    } else {
      matchDest =
        String(item.menjutkan_ke).trim().toLowerCase() ===
        String(selectedDestination.value).trim().toLowerCase();
    }

    // 3. Search query
    const term = searchQuery.value.toLowerCase().trim();
    if (!term) return matchYear && matchDest;

    const nameMatch = (item.nama || "").toLowerCase().includes(term);
    const nisnMatch = String(item.nisn || "")
      .toLowerCase()
      .includes(term);
    const nisLokalMatch = String(item.nis_lokal || "")
      .toLowerCase()
      .includes(term);
    const addressMatch = (item.alamat || "").toLowerCase().includes(term);

    return (
      matchYear &&
      matchDest &&
      (nameMatch || nisnMatch || nisLokalMatch || addressMatch)
    );
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
watch([searchQuery, selectedYear, selectedDestination], () => {
  currentPage.value = 1;
});

// Statistics Computation
const stats = computed(() => {
  const list = Array.isArray(dataAlumni.value) ? dataAlumni.value : [];
  const total = list.length;

  // Continuing count
  const continuingList = list.filter(
    (item) =>
      item.menjutkan_ke &&
      !String(item.menjutkan_ke).toLowerCase().includes("tidak"),
  );
  const continuing = continuingList.length;
  const continuingPercent =
    total > 0 ? Math.round((continuing / total) * 100) : 0;

  // Year frequency
  const yearCounts = {};
  list.forEach((item) => {
    if (item.thn_lulus) {
      yearCounts[item.thn_lulus] = (yearCounts[item.thn_lulus] || 0) + 1;
    }
  });
  let topYear = "-";
  let topYearCount = 0;
  for (const [y, count] of Object.entries(yearCounts)) {
    if (count > topYearCount) {
      topYear = y;
      topYearCount = count;
    }
  }

  // Destination frequency
  const destCounts = {};
  continuingList.forEach((item) => {
    if (item.menjutkan_ke) {
      const cleanDest = String(item.menjutkan_ke).trim().toUpperCase();
      destCounts[cleanDest] = (destCounts[cleanDest] || 0) + 1;
    }
  });
  let topDestination = "-";
  let topDestCount = 0;
  for (const [d, count] of Object.entries(destCounts)) {
    if (count > topDestCount) {
      topDestination = d;
      topDestCount = count;
    }
  }

  return {
    total,
    continuing,
    continuingPercent,
    topYear,
    topYearCount,
    topDestination,
  };
});

const handleSearch = (query) => {
  searchQuery.value = query;
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
      "Nama Lengkap": item.nama || "",
      NISN: item.nisn || "",
      "NIS Lokal": item.nis_lokal || "",
      NIK: item.nik || "",
      "No KK": item.no_kk || "",
      "Tempat Lahir": item.tempat_lahir || "",
      "Tanggal Lahir": item.tanggal_lahir || "",
      Umur: calculateAge(item.tanggal_lahir),
      "Jenis Kelamin": item.jenis_kelamin || "",
      Status: item.status || "",
      "Tahun Lulus": item.thn_lulus || "",
      "Melanjutkan Ke": item.menjutkan_ke || "Tidak Melanjutkan",
      Alamat: item.alamat || "",
      "No Telepon": item.no_hp || "",
      "No KIP/PIP": item.no_kip || "",
      "Nama Ayah Kandung": item.nama_ayah_kandung || "",
      "Nama Ibu Kandung": item.nama_ibu_kandung || "",
      "Nama Wali": item.nama_wali || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set Column Widths
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama Lengkap
      { wch: 15 }, // NISN
      { wch: 15 }, // NIS Lokal
      { wch: 20 }, // NIK
      { wch: 20 }, // No KK
      { wch: 15 }, // Tempat Lahir
      { wch: 15 }, // Tanggal Lahir
      { wch: 8 }, // Umur
      { wch: 15 }, // Jenis Kelamin
      { wch: 10 }, // Status
      { wch: 12 }, // Tahun Lulus
      { wch: 18 }, // Melanjutkan Ke
      { wch: 30 }, // Alamat
      { wch: 15 }, // No Telepon
      { wch: 15 }, // No KIP
      { wch: 20 }, // Nama Ayah
      { wch: 20 }, // Nama Ibu
      { wch: 20 }, // Nama Wali
    ];
    ws["!cols"] = colWidths;

    // Apply header style
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
      "R1",
      "S1",
    ];
    headerRange.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600 header
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Data Alumni");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `Data_Alumni_${selectedYear.value.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      alert(`Data alumni berhasil diekspor ke file: ${filename}`);
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
  loadData("alumni");
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

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgb(63 63 70);
  border-radius: 2px;
}

.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background-color: rgb(82 82 91);
}
</style>