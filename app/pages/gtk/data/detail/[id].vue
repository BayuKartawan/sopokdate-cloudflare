<!-- \src\views\gtk\GtkDetailView.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Breadcrumb Components -->

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 animate-spin text-gray-500"
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
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span class="text-gray-500">Memuat detail...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center p-4 rounded-lg bg-red-900/20 text-red-400"
      >
        <h3 class="text-lg font-medium mb-1">Data tidak ditemukan</h3>
        <p class="text-sm">{{ error }}</p>
      </div>

      <!-- Detail Content -->
      <div v-else-if="gtkDetail" class="space-y-6">
        <!-- Header -->
        <div class="rounded-lg p-6 bg-zinc-800">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <UserCircle class="h-8 w-8 text-emerald-400" />
              <div>
                <h1 class="text-2xl font-semibold mb-1 text-white">
                  {{ gtkDetail.title }}
                </h1>
                <p class="text-sm text-zinc-400">
                  {{ gtkDetail.Tugas }}
                </p>
              </div>
            </div>

            <!-- Admin Actions -->
            <div v-if="isAdmin" class="flex items-center gap-2">
              <button
                @click="openEditModal(gtkDetail)"
                class="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                title="Edit"
              >
                <Pencil class="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                @click="handleDelete(gtkDetail)"
                class="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                title="Hapus"
              >
                <Trash2 class="w-4 h-4" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- Left Column - Details -->
          <div class="lg:col-span-3">
            <!-- Information Card -->
            <div class="rounded-lg p-6 bg-zinc-800">
              <div class="flex items-center gap-2 mb-4">
                <Info class="w-5 h-5 text-emerald-400" />
                <h2 class="text-lg font-medium text-white">Informasi Detail</h2>
              </div>

              <div class="divide-y divide-zinc-700">
                <!-- Nama -->
                <div class="py-3 grid grid-cols-3 gap-4 text-sm">
                  <dt class="text-zinc-300">Nama</dt>
                  <dd class="col-span-2 flex items-center gap-2">
                    <span
                      class="flex-1 select-all cursor-pointer text-white"
                      @click="copyToClipboard(gtkDetail.title)"
                      title="Klik untuk menyalin"
                    >
                      {{ gtkDetail.title }}
                    </span>
                  </dd>
                </div>

                <!-- Dynamic Fields -->
                <div
                  v-for="(item, index) in biodataFields"
                  :key="index"
                  class="py-3 grid grid-cols-3 gap-4 text-sm"
                >
                  <dt class="text-zinc-300">
                    {{ item.label }}
                  </dt>
                  <dd class="col-span-2 flex items-center gap-2">
                    <span
                      class="flex-1 select-all cursor-pointer text-white"
                      @click="copyToClipboard(gtkDetail[item.key] || '-')"
                      title="Klik untuk menyalin"
                    >
                      {{ gtkDetail[item.key] || "-" }}
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Related Items -->
          <div>
            <div class="rounded-lg p-4 bg-zinc-800">
              <h3 class="text-sm font-medium mb-3 text-white">GTK Terkait</h3>
              <div class="space-y-2">
                <button
                  v-for="(item, index) in relatedItems"
                  :key="index"
                  @click="navigateToDetail(item)"
                  class="w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-zinc-700 text-zinc-300"
                >
                  {{ item.displayTitle }}
                </button>

                <p
                  v-if="relatedItems.length === 0"
                  class="text-sm text-center py-2 text-zinc-500"
                >
                  Tidak ada item terkait
                </p>
              </div>
            </div>
          </div>
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
import { Info, UserCircle, Pencil, Trash2 } from "lucide-vue-next";

import { ref, computed, onMounted, watch } from "vue";

import { useTableData } from "~/composables/data/useTableData";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { useCrud } from "~/composables/data/useCrud";
import CrudModal from "~/components/ui/CrudModal.vue";

const { cardData, loadData } = useTableData();
const route = useRoute();
const router = useRouter();
const { Notify } = useNotiflix();
const gtkDetail = ref(null);
const loading = ref(true);
const error = ref(null);
const dataGtk = ref([]);

const showModal = ref(false);
const modalMode = ref("edit");
const editingItem = ref({});
let isDeletingOp = false;

const { isAdmin, isSaving, updateItem, deleteItem } = useCrud(
  "DataGtk",
  async () => {
    if (isDeletingOp) {
      router.push("/akademik/gtk");
    } else {
      await loadGtkDetail();
    }
  },
);

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
  {
    key: "Jenis Kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-Laki", "Perempuan"],
  },
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

const openEditModal = (item) => {
  isDeletingOp = false;
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    "Nama Lengkap": item.title || "",
    NIK: item.NIK || "",
    "No KK": item.NoKK || "",
    NUPTK: item.NUPTK || "",
    "Peg ID": item.PegID || "",
    NPK: item.NPK || "",
    NRG: item.NRG || "",
    "Pendidikan Terakhir": item.PendTerakhir || "",
    Jurusan: item.Jurusan || "",
    "Jenis Kelamin": item.JenisKelamin || "",
    "Tempat Lahir": item.TempatLahir || "",
    "Tanggal Lahir": item.TanggalLahir || "",
    "No HP": item.NomorHp || "",
    Email: item.Email || "",
    Tugas: item.Tugas || "",
    "No Rekening": item.NoRek || "",
    "Status Kepegawaian": item.StatusKepegawaian || "",
    NIP: item.NIP || "",
    "Mata Pelajaran": item.MataPelajaran || "",
    "Wali Kelas": item.WaliKelas || "",
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

const handleDelete = (item) => {
  isDeletingOp = true;
  const id = item.id || item._id;
  deleteItem(id, toTitleCase(item.title));
};

// TAMBAHKAN BLOK DI BAWAH INI
watch(
  () => route.params.id,
  (newId, oldId) => {
    // Pastikan fungsi untuk memuat data dipanggil lagi saat ID berubah
    // Pengecekan newId !== oldId mencegah pemanggilan ulang yang tidak perlu.
    if (newId && newId !== oldId) {
      loadGtkDetail();
    }
  },
);
async function loadGtkDetail() {
  loading.value = true;
  error.value = null;

  try {
    // Tunggu sampai data selesai dimuat oleh komposabel
    await loadData("DataGtk");

    // Gunakan data dari komposabel jika tersedia
    if (cardData.value && cardData.value.length > 0) {
      dataGtk.value = cardData.value;
    } else {
      // Fallback ke local storage langsung jika komposabel tidak berhasil
      const storedDataGtk = localStorage.getItem("DataGtk");
      if (storedDataGtk) {
        dataGtk.value = JSON.parse(storedDataGtk);
      }
    }

    // Cari item berdasarkan parameter route (PegID atau database ID)
    const pegId = route.params.id;

    let foundItem = null;

    if (pegId !== undefined && pegId !== null) {
      foundItem = dataGtk.value.find(
        (item) =>
          item &&
          (String(item.PegID).trim() === String(pegId).trim() ||
            String(item.id).trim() === String(pegId).trim()),
      );
    }

    if (foundItem) {
      gtkDetail.value = foundItem;
    } else {
      error.value = "Item GTK tidak ditemukan";
    }
  } catch (err) {
    error.value = "Gagal memuat detail GTK: " + err.message;
  } finally {
    loading.value = false;
  }
}

// Format teks menjadi huruf besar di awal kata
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

// Menampilkan SEMUA item terkait dengan format teks yang dimodifikasi
const relatedItems = computed(() => {
  if (!gtkDetail.value) return [];

  // Hapus .slice(0, 3) untuk menampilkan semua data yang relevan
  // Kita tetap menggunakan .filter agar item yang sedang dibuka tidak muncul lagi di daftar "terkait".
  return dataGtk.value
    .filter((item) => item.title !== gtkDetail.value.title)
    .map((item) => ({
      ...item,
      displayTitle: toTitleCase(item.title),
    }));
});

function navigateToDetail(item) {
  const pegId = item.PegID;
  if (pegId) {
    router.push(`/akademik/gtk/detail/${pegId}`);
  }
}

const biodataFields = [
  { label: "Tugas", key: "Tugas" },
  { label: "Wali Kelas", key: "WaliKelas" },
  { label: "NPK", key: "NPK" },
  { label: "NUPTK", key: "NUPTK" },
  { label: "NRG", key: "NRG" },
  { label: "PegID", key: "PegID" },
  { label: "NIK", key: "NIK" },
  { label: "No Kartu Keluarga", key: "NoKK" },
  { label: "No Rekening", key: "NoRek" },
  { label: "Pendidikan Terakhir", key: "PendTerakhir" },
  { label: "Jurusan", key: "Jurusan" },
  { label: "Status Kepegawaian", key: "StatusKepegawaian" },
  { label: "NIP", key: "NIP" },
  { label: "Jenis Kelamin", key: "JenisKelamin" },
  { label: "Tempat Lahir", key: "TempatLahir" },
  { label: "Tanggal Lahir", key: "TanggalLahir" },
  { label: "Nomor Hp", key: "NomorHp" },
  { label: "Email", key: "Email" },
  { label: "Mata Pelajaran", key: "MataPelajaran" },
];

// Fungsi untuk menyalin teks ke clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    Notify.success("Teks berhasil disalin!");
  } catch {
    Notify.failure("Gagal menyalin!");
  }
};

onMounted(() => {
  loadGtkDetail();
});
</script>
