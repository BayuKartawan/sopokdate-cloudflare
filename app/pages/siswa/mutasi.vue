<!-- app/pages/siswa/mutasi.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div class="flex flex-col gap-4 sm:gap-5 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div class="flex-1 min-w-0">
            <h2
              class="text-lg sm:text-xl font-bold flex items-center gap-2"
              :style="{ color: 'var(--text-heading)' }"
            >
              <LogOut class="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-orange-400" />
              Data Mutasi Siswa
            </h2>
            <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Catatan siswa yang telah keluar / mutasi dari madrasah
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <!-- Export Excel Button -->
            <BaseButton
              :text="isExporting ? 'Mengekspor...' : 'Export'"
              @click="exportToExcel"
              :disabled="isExporting || sortedData.length === 0"
              class="!px-2.5 sm:!px-3 hover:bg-zinc-700"
            >
              <template #icon>
                <svg v-if="!isExporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </template>
            </BaseButton>
          </div>
        </div>

        <!-- Stats Widgets -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-3 sm:p-4 rounded-xl flex flex-col justify-between gap-2"
          >
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Total Mutasi</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-heading)]">{{ stats.total }}</span>
              <span class="text-xs text-orange-400 font-medium">siswa</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-3 sm:p-4 rounded-xl flex flex-col justify-between gap-2"
          >
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Pindah Keluar</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-400">{{ stats.pindah }}</span>
              <span class="text-xs text-zinc-500 font-medium">orang</span>
            </div>
          </div>
          <div
            class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 p-3 sm:p-4 rounded-xl flex flex-col justify-between gap-2 col-span-2 lg:col-span-1"
          >
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 leading-tight">Jenis Mutasi Terbanyak</span>
            <div class="flex items-baseline gap-1.5 flex-wrap">
              <span class="text-sm sm:text-base lg:text-lg font-bold text-rose-400 truncate max-w-full">{{ stats.topJenis }}</span>
            </div>
          </div>
        </div>

        <!-- Filter and Search Row -->
        <div class="flex flex-col gap-3 w-full">
          <div class="w-full">
            <Search
              @searchUpdated="handleSearch"
              class="h-10"
              placeholder="Cari nama, NISN, kelas..."
            />
          </div>
          <div class="grid grid-cols-2 gap-2 w-full">
            <!-- Jenis Mutasi Filter -->
            <select
              v-model="selectedJenis"
              class="w-full h-9 sm:h-10 px-2.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-xs sm:text-sm cursor-pointer"
            >
              <option value="Semua Jenis">Semua Jenis Mutasi</option>
              <option v-for="jenis in jenisOptions" :key="jenis" :value="jenis">
                {{ jenis }}
              </option>
            </select>

            <!-- Kelas Filter -->
            <select
              v-model="selectedKelas"
              class="w-full h-9 sm:h-10 px-2.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-xs sm:text-sm cursor-pointer"
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
        <p v-if="isLoading" class="text-center text-zinc-500 text-sm sm:text-base font-semibold py-12">
          Memuat data mutasi siswa...
        </p>

        <div
          v-else-if="sortedData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800"
        >
          <LogOut class="w-16 h-16 mx-auto mb-4 text-zinc-600" stroke-width="1.5" />
          <p class="text-zinc-400 text-sm sm:text-base font-medium">Tidak ada data mutasi ditemukan</p>
          <p class="text-zinc-500 text-xs sm:text-sm mt-1">
            Coba sesuaikan kata kunci pencarian atau filter.
          </p>
        </div>

        <!-- Mutasi Table -->
        <div v-else class="overflow-x-auto rounded-xl border border-zinc-800/60">
          <table class="w-full text-sm text-left">
            <thead class="bg-zinc-800/60 border-b border-zinc-700/60">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-10">No</th>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nama Siswa</th>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">NISN</th>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kelas</th>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jenis Mutasi</th>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tgl Mutasi</th>
                <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sekolah Tujuan</th>
                <th v-if="isAdmin" class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/40">
              <tr
                v-for="(item, index) in visibleData"
                :key="item.id || index"
                class="hover:bg-zinc-800/30 transition-colors"
              >
                <td class="px-4 py-3 text-zinc-500 text-xs">{{ index + 1 }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-orange-500/10 text-orange-400"
                    >
                      {{ getInitials(item.nama) }}
                    </div>
                    <div>
                      <p class="font-semibold text-zinc-100 text-sm leading-tight">{{ toTitleCase(item.nama) }}</p>
                      <p class="text-xs text-zinc-500">{{ item.nis_lokal || '-' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-zinc-300 font-mono text-xs">{{ item.nisn || '-' }}</td>
                <td class="px-4 py-3 text-zinc-300 text-xs">{{ item.kelas || '-' }}</td>
                <td class="px-4 py-3">
                  <span :class="getJenisBadgeClass(item.jenis_mutasi)" class="px-2 py-0.5 rounded text-xs font-semibold border">
                    {{ item.jenis_mutasi || 'Pindah Keluar' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-zinc-400 text-xs">{{ item.tanggal_mutasi || '-' }}</td>
                <td class="px-4 py-3 text-zinc-400 text-xs">{{ item.sekolah_tujuan || '-' }}</td>
                <td v-if="isAdmin" class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      @click="openEditModal(item)"
                      class="flex items-center gap-1 px-2 py-1 rounded text-xs text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
                    >
                      <Pencil class="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      @click="handleKembalikanSiswa(item)"
                      class="flex items-center gap-1 px-2 py-1 rounded text-xs text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
                    >
                      <Undo2 class="w-3 h-3" />
                      Kembalikan
                    </button>
                    <button
                      @click="handleHapus(item)"
                      class="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 class="w-3 h-3" />
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Load More Button -->
        <div v-if="sortedData.length > 15" class="text-center mt-6">
          <BaseButton
            :text="showAll ? 'Tampilkan Lebih Sedikit' : 'Tampilkan Semua (' + sortedData.length + ')'"
            @click="showAll = !showAll"
            class="hover:bg-zinc-800"
          />
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        title="Edit Data Mutasi"
        :fields="mutasiFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { LogOut, Pencil, Trash2, Undo2 } from "lucide-vue-next";
import Search from "~/components/ui/Search.vue";
import BaseButton from "~/components/ui/BaseButton.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import {
  useTableData,
  clearTableSessionCache,
} from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { fetchFromApi, postToApi, deleteFromApi } from "~/utils/api";
import * as XLSX from "xlsx";

const {
  cardData: dataMutasi,
  isLoading,
  loadData,
  refreshData,
} = useTableData();

const { isAdmin, isSaving, updateItem, deleteItem } = useCrud(
  "mutasi_siswa",
  () => refreshData("mutasi_siswa"),
);
const { Notify, Confirm } = useNotiflix();

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("edit");
const editingItem = ref({});

const mutasiFields = [
  { key: "nama", label: "Nama Lengkap", required: true },
  { key: "nisn", label: "NISN" },
  { key: "nis_lokal", label: "NIS Lokal" },
  { key: "nik", label: "NIK" },
  { key: "no_kk", label: "Nomor KK" },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir" },
  { key: "kelas", label: "Kelas Terakhir" },
  { key: "umur", label: "Umur" },
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
  const id = editingItem.value._id;
  const success = await updateItem(id, formData);
  if (success) {
    showModal.value = false;
  }
};

const handleHapus = (item) => {
  const id = item.id || item._id;
  deleteItem(id, toTitleCase(item.nama));
};

const handleKembalikanSiswa = (item) => {
  const id = item.id || item._id;

  Confirm?.show(
    "Kembalikan Siswa Aktif",
    `Apakah Anda yakin ingin mengembalikan ${toTitleCase(item.nama)} ke daftar siswa aktif? Data akan dihapus dari daftar mutasi.`,
    "Ya, Kembalikan",
    "Batal",
    async () => {
      try {
        const studentRecord = {
          nama: item.nama || "",
          nisn: item.nisn || "",
          nis_lokal: item.nis_lokal || "",
          nik: item.nik || "",
          no_kk: item.no_kk || "",
          tempat_lahir: item.tempat_lahir || "",
          tanggal_lahir: item.tanggal_lahir || "",
          kelas: item.kelas || "",
          umur: item.umur || "",
          jenis_kelamin: item.jenis_kelamin || "Laki-laki",
          alamat: item.alamat || "",
          no_hp: item.no_hp || "",
          no_kip: item.no_kip || "",
          nama_ayah_kandung: item.nama_ayah_kandung || "",
          nama_ibu_kandung: item.nama_ibu_kandung || "",
          nama_wali: item.nama_wali || "",
          status_promosi: "Belum",
        };

        await postToApi("data_siswa", studentRecord);
        await deleteFromApi("mutasi_siswa", id);

        Notify?.success?.(`${toTitleCase(item.nama)} berhasil dikembalikan ke daftar siswa aktif.`);
        clearTableSessionCache("data_siswa");
        clearTableSessionCache("mutasi_siswa");
        await refreshData("mutasi_siswa");
      } catch (err) {
        console.error("Gagal mengembalikan siswa:", err);
        Notify?.failure?.("Gagal mengembalikan siswa ke daftar aktif.");
      }
    },
  );
};

const selectedJenis = ref("Semua Jenis");
const selectedKelas = ref("Semua Kelas");
const searchQuery = ref("");
const showAll = ref(false);
const isExporting = ref(false);

const toTitleCase = (str) => {
  if (!str) return "";
  return String(str).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const getJenisBadgeClass = (jenis) => {
  const j = (jenis || "").toLowerCase();
  if (j.includes("pindah")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (j.includes("dikeluarkan")) return "bg-red-500/10 text-red-400 border-red-500/30";
  if (j.includes("mengundurkan")) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  if (j.includes("meninggal")) return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
  return "bg-orange-500/10 text-orange-400 border-orange-500/30";
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

const visibleData = computed(() =>
  showAll.value ? sortedData.value : sortedData.value.slice(0, 15),
);

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
      "Kelas Terakhir": item.kelas || "",
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
