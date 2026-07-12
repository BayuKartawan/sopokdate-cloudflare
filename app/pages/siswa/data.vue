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
            <p class="text-sm text-zinc-400 mt-1">
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


        <!-- Filter and Search Row -->
        <div class="flex flex-col md:flex-row gap-4 items-center w-full">
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
        <p v-if="isLoading" class="text-center text-zinc-500 text-lg font-semibold py-12">
          Memuat data siswa secara realtime...
        </p>

        <div v-else-if="sortedData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800">
          <Database class="w-16 h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
          <p class="text-zinc-400 text-lg font-medium">
            Tidak ada data siswa ditemukan
          </p>
          <p class="text-zinc-500 text-sm mt-1">
            Coba sesuaikan kata kunci pencarian atau filter kelas Anda.
          </p>
        </div>

        <!-- Student Grid List -->
        <div v-else>
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <PersonCard v-for="(item, index) in visibleData" :key="item.id || index" :item="item" :title="item.nama"
              :subtitle="item.nisn ? 'NISN: ' + item.nisn : '-'" @click="navigateToDetail" />
          </ul>

          <!-- Load More Button -->
          <div v-if="sortedData.length > 9" class="text-center mt-8">
            <BaseButton :text="showAll ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lebih Banyak'
              " @click="showAll = !showAll" />
          </div>
        </div>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
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
  { key: "umur", label: "Umur" },
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
    umur: item.umur || "",
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
const showAll = ref(false);
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
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const upper = jk.toUpperCase();
  if (upper.startsWith("L")) return "L";
  if (upper.startsWith("P")) return "P";
  return jk;
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

const visibleData = computed(() => {
  return showAll.value ? sortedData.value : sortedData.value.slice(0, 9);
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
      Umur: item.umur || "",
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
