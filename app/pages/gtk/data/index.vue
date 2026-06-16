<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Breadcrumb Components -->

      <!-- dataGtk Section -->

      <div class="flex flex-col gap-4 sm:gap-6">
        <!-- Title and Action Buttons Row -->
        <div class="flex flex-wrap items-center gap-4">
          <h2 class="text-xl text-white sm:text-2xl">Data GTK</h2>
          <div class="flex items-center gap-2 ml-auto">
            <!-- Tambah GTK Button (Admin Only) -->
            <BaseButton
              v-if="isAdmin"
              text="Tambah"
              @click="openCreateModal"
              class="!bg-emerald-600 !text-white hover:!bg-emerald-500"
            >
              <template #icon>
                <Plus class="w-4 h-4" />
              </template>
            </BaseButton>

            <!-- Export Excel Button -->
            <BaseButton
              :text="isExporting ? 'Mengekspor...' : 'Export'"
              @click="exportToExcel"
              :disabled="isExporting || sortedData.length === 0"
              class="!px-2.5 sm:!px-3"
            >
              <template #icon>
                <svg
                  v-if="!isExporting"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </template>
            </BaseButton>

            <!-- Print Button -->
            <PrintButton>
              <div class="p-10 mx-auto bg-white text-black">
                <!-- kop surat -->
                <KopSurat class="mb-4" />

                <!-- Header -->
                <div class="text-center mb-4">
                  <h1 class="font-bold uppercase">Data GTK</h1>
                  <p class="text-sm">( Guru dan Tenaga Kependidikan )</p>
                </div>

                <!-- Tabel -->
                <table
                  class="w-full table-auto border border-gray-800 mb-1 text-sm"
                >
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="border border-gray-800 px-2 py-1">No</th>
                      <th class="border border-gray-800 px-2 py-1">Nama</th>
                      <th class="border border-gray-800 px-2 py-1">Tugas</th>
                      <th class="border border-gray-800 px-2 py-1">
                        Jenis Kelamin
                      </th>
                      <th class="border border-gray-800 px-2 py-1">
                        Tempat, Tanggal Lahir
                      </th>
                      <th class="border border-gray-800 px-2 py-1">NUPTK</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Tampilkan pesan loading jika data belum tersedia -->
                    <tr v-if="!sortedData || sortedData.length === 0">
                      <td
                        colspan="6"
                        class="border border-gray-800 px-2 py-4 text-center text-gray-500"
                      >
                        {{
                          isLoading
                            ? "Memuat data..."
                            : "Tidak ada data guru tersedia"
                        }}
                      </td>
                    </tr>
                    <!-- Tampilkan data guru -->
                    <tr
                      v-else
                      v-for="(guru, index) in sortedData"
                      :key="guru.id || index"
                    >
                      <td class="border border-gray-800 px-2 py-1 text-center">
                        {{ index + 1 }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ toTitleCase(guru.title) }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ guru.Tugas }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ guru.JenisKelamin }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ guru.TempatLahir }}, {{ guru.TanggalLahir }}
                      </td>
                      <td class="border border-gray-800 px-2 py-1">
                        {{ guru.NUPTK }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div>
                  <p class="text-xs italic">
                    dicetak dari SopokDate pada pukul {{ currentTime }} WITA,
                    tanggal {{ currentDate }}
                  </p>
                </div>

                <!-- Tanda Tangan -->
                <div class="flex justify-end mt-4">
                  <div class="text-center">
                    <p class="mb-15">Kepala Madrasah</p>
                    <div v-if="kepalaMadrasah">
                      <p class="font-bold">{{ kepalaMadrasah.title }}</p>
                      <p class="text-sm">NUPTK: {{ kepalaMadrasah.NUPTK }}</p>
                    </div>
                    <div v-else>
                      <p class="underline font-semibold">_________________</p>
                      <p>NUPTK: _________________</p>
                    </div>
                  </div>
                </div>
              </div>
            </PrintButton>
          </div>
        </div>

        <!-- Search Row -->
        <div class="w-full">
          <Search @searchUpdated="handleSearch" class="h-10 sm:h-11" />
        </div>
      </div>

      <!-- dataGtk Content -->
      <div class="pt-5">
        <p
          v-if="isLoading"
          class="text-center text-gray-500 text-lg font-semibold"
        >
          Loading...
        </p>
        <div v-else-if="sortedData.length === 0" class="text-center py-12">
          <Database
            :class="[
              'w-16 h-16 mx-auto mb-4 transition-colors duration-300',
              'text-zinc-600',
            ]"
            stroke-width="1.5"
          />
          <p :class="['transition-colors duration-300', 'text-zinc-400']">
            Tidak ada file yang ditemukan
          </p>
        </div>

        <!-- Di bagian dataGtk Content, update pemanggilan CardSmall -->
        <ul
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <li
            v-for="(item, index) in visibleData"
            :key="index"
            class="cursor-pointer rounded-lg border p-4 transition-colors duration-150 shadow-sm bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-700/50"
          >
            <div class="flex items-center gap-3">
              <!-- Icon -->
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-700/50 text-emerald-400"
                @click="navigateToDetail(item)"
              >
                <UserCircle class="w-5 h-5" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0" @click="navigateToDetail(item)">
                <h3 class="font-medium text-base truncate text-zinc-100">
                  {{ toTitleCase(item.title) }}
                </h3>
                <p class="text-sm truncate text-zinc-400">
                  {{ item.Tugas || "Guru" }}
                </p>
              </div>

              <!-- Admin Actions -->
              <div v-if="isAdmin" class="flex items-center gap-1 shrink-0">
                <button
                  @click.stop="openEditModal(item)"
                  class="p-1.5 rounded-md text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/60 transition-all"
                  title="Edit"
                >
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button
                  @click.stop="handleDelete(item)"
                  class="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-700/60 transition-all"
                  title="Hapus"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <ChevronRight class="w-4 h-4 text-zinc-600" @click="navigateToDetail(item)" />
            </div>
          </li>
        </ul>

        <!-- Load More Button -->
        <div v-if="sortedData.length > 8" class="text-center mt-5">
          <BaseButton
            :text="
              showAll ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Lebih Banyak'
            "
            @click="showAll = !showAll"
          />
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="modalMode === 'create' ? 'Tambah Data GTK' : 'Edit Data GTK'"
        :fields="gtkFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

import { Database, UserCircle, ChevronRight, Plus, Pencil, Trash2 } from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import * as XLSX from "xlsx";

const router = useRouter();
const { cardData, isLoading, loadData, refreshData } = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud("DataGtk", () => refreshData("DataGtk"));

const searchQuery = ref("");
const showAll = ref(false);
const isExporting = ref(false);

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

// Field configuration for GTK CRUD form
const gtkFields = [
  { key: "Nama Lengkap", label: "Nama Lengkap", required: true },
  { key: "NIK", label: "NIK" },
  { key: "No KK", label: "No KK" },
  { key: "NUPTK", label: "NUPTK" },
  { key: "Peg ID", label: "Peg ID" },
  { key: "NPK", label: "NPK" },
  { key: "NRG", label: "NRG" },
  { key: "Pendidikan Terakhir", label: "Pendidikan Terakhir" },
  { key: "Jurusan", label: "Jurusan" },
  { key: "Jenis Kelamin", label: "Jenis Kelamin", type: "select", options: ["Laki-Laki", "Perempuan"] },
  { key: "Tempat Lahir", label: "Tempat Lahir" },
  { key: "Tanggal Lahir", label: "Tanggal Lahir", type: "date" },
  { key: "No HP", label: "No HP" },
  { key: "Email", label: "Email", type: "email" },
  { key: "Tugas", label: "Tugas" },
  { key: "No Rekening", label: "No Rekening" },
  { key: "Status Kepegawaian", label: "Status Kepegawaian" },
  { key: "NIP", label: "NIP" },
  { key: "Mata Pelajaran", label: "Mata Pelajaran" },
  { key: "Wali Kelas", label: "Wali Kelas" },
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
    "Nama Lengkap": item.title || "",
    "NIK": item.NIK || "",
    "No KK": item.NoKK || "",
    "NUPTK": item.NUPTK || "",
    "Peg ID": item.PegID || "",
    "NPK": item.NPK || "",
    "NRG": item.NRG || "",
    "Pendidikan Terakhir": item.PendTerakhir || "",
    "Jurusan": item.Jurusan || "",
    "Jenis Kelamin": item.JenisKelamin || "",
    "Tempat Lahir": item.TempatLahir || "",
    "Tanggal Lahir": item.TanggalLahir || "",
    "No HP": item.NomorHp || "",
    "Email": item.Email || "",
    "Tugas": item.Tugas || "",
    "No Rekening": item.NoRek || "",
    "Status Kepegawaian": item.StatusKepegawaian || "",
    "NIP": item.NIP || "",
    "Mata Pelajaran": item.MataPelajaran || "",
    "Wali Kelas": item.WaliKelas || "",
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
  deleteItem(id, toTitleCase(item.title));
};

// State untuk tanggal dan waktu print
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

const navigateToDetail = (item) => {
  const pegId = item.PegID;
  if (pegId) {
    router.push(`/akademik/gtk/detail/${pegId}`);
  }
};

const kepalaMadrasah = computed(() => {
  if (!sortedData.value || sortedData.value.length === 0) {
    return null;
  }
  return cardData.value.find((guru) => {
    return guru.Tugas && guru.Tugas.toLowerCase().includes("kepala madrasah");
  });
});

// Data yang sudah difilter dan diurutkan (logika ini tetap di komponen karena bersifat presentasional)
const sortedData = computed(() => {
  return cardData.value
    .filter((item) =>
      item.title?.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
    .sort((a, b) => a.title?.localeCompare(b.title));
});

const visibleData = computed(() => {
  return showAll.value ? sortedData.value : sortedData.value.slice(0, 9);
});

const handleSearch = (query) => {
  searchQuery.value = query;
};

// Fungsi untuk export ke Excel
const exportToExcel = async () => {
  if (sortedData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  try {
    isExporting.value = true;

    // Siapkan data untuk export
    const exportData = sortedData.value.map((item, index) => ({
      No: index + 1,
      Nama: item.title || "",
      NIK: item.NIK || "",
      "No KK": item.NoKK || "",
      "No Rekening": item.NoRek || "",
      NUPTK: item.NUPTK || "",
      "Peg ID": item.PegID || "",
      NPK: item.NPK || "",
      NRG: item.NRG || "",
      "Pendidikan Terakhir": item.PendTerakhir || "",
      Jurusan: item.Jurusan || "",
      "Setatus Kepegawaian": item.StatusKepegawaian || "",
      NIP: item.NIP || "",
      "Jenis Kelamin": item.JenisKelamin || "",
      "Tempat Lahir": item.TempatLahir || "",
      TanggalLahir: item.TanggalLahir || "",
      "Nomor Hp": item.NomorHp || "",
      Email: item.Email || "",
      Tugas: item.Tugas || "",
      "Mata Pelajaran": item.MataPelajaran || "",
      "Wali Kelas": item.WaliKelas || "",
    }));

    // Buat workbook dan worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set lebar kolom
    const colWidths = [
      { wch: 5 }, // No
      { wch: 25 }, // Nama
      { wch: 20 }, // NIP
      { wch: 20 }, // NUPTK
      { wch: 20 }, // Tempat Lahir
      { wch: 15 }, // Tanggal Lahir
      { wch: 15 }, // Jenis Kelamin
      { wch: 20 }, // Status Kepegawaian
      { wch: 15 }, // Jenis PTK
      { wch: 15 }, // Status Keaktifan
      { wch: 20 }, // Tugas Tambahan
      { wch: 25 }, // Mapel yang Diajar
      { wch: 30 }, // Sekolah Induk
      { wch: 20 }, // SK CPNS
      { wch: 15 }, // TMT CPNS
      { wch: 25 }, // SK Pengangkatan
      { wch: 20 }, // TMT Pengangkatan
      { wch: 25 }, // Lembaga Pengangkat
      { wch: 20 }, // Pangkat Golongan
      { wch: 15 }, // Sumber Gaji
      { wch: 20 }, // Kartu Pegawai
      { wch: 15 }, // Karpeg
      { wch: 10 }, // Tahun
    ];
    ws["!cols"] = colWidths;

    // Style header
    const headerCells = [
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
      "T1",
      "U1",
      "V1",
      "W1",
    ];
    headerCells.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "059669" } }, // emerald-600
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    });

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Data GTK");

    // Generate filename dengan tanggal
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/[:.]/g, "-");
    const filename = `Data_GTK_${dateStr}.xlsx`;

    // Export file
    XLSX.writeFile(wb, filename);

    // Show success message
    setTimeout(() => {
      alert(`Data berhasil diekspor ke file: ${filename}`);
    }, 100);
  } catch {
    alert("Terjadi kesalahan saat mengekspor data");
  } finally {
    isExporting.value = false;
  }
};

let timeInterval = null;

onMounted(() => {
  // Panggil loadData saat komponen pertama kali dimuat
  loadData("DataGtk");

  updateDateTime();
  timeInterval = setInterval(updateDateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>
