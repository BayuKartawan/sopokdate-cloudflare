<!-- \src\views\gtk\GtkDetailView.vue -->
<template>
  <div class="min-h-screen">
    <div class="page-layout">

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="flex items-center gap-3">
          <svg
            class="w-5 h-5 animate-spin text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span class="text-gray-500 text-sm">Memuat detail...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center p-5 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 max-w-md mx-auto mt-8"
      >
        <h3 class="text-base font-semibold mb-1">Data tidak ditemukan</h3>
        <p class="text-sm text-zinc-400">{{ error }}</p>
      </div>

      <!-- Detail Content -->
      <div v-else-if="gtkDetail" class="space-y-4">

        <!-- Header Card -->
        <div class="rounded-xl p-4 sm:p-5 bg-zinc-800 shadow-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <!-- Avatar + Name -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                <UserCircle class="h-7 w-7" />
              </div>
              <div class="min-w-0">
                <h1 class="text-base sm:text-lg font-semibold text-[var(--text-heading)] leading-tight truncate">
                  {{ gtkDetail.title }}
                </h1>
                <p class="text-xs text-zinc-400 mt-0.5 truncate">{{ gtkDetail.Tugas || "-" }}</p>
              </div>
            </div>

            <!-- Admin Actions -->
            <div v-if="isAdmin" class="flex items-center gap-2 flex-shrink-0">
              <BaseButton
                text="Edit"
                title="Edit data GTK ini"
                @click="openEditModal(gtkDetail)"
              >
                <template #icon>
                  <Pencil class="w-3.5 h-3.5" />
                </template>
              </BaseButton>
              <BaseButton
                text="Hapus"
                title="Hapus data GTK ini secara permanen"
                @click="handleDelete(gtkDetail)"
              >
                <template #icon>
                  <Trash2 class="w-3.5 h-3.5" />
                </template>
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-4">

          <!-- Left Column - Details (3/4) -->
          <div class="xl:col-span-3">
            <div class="rounded-xl bg-zinc-800 shadow-sm overflow-hidden">

              <!-- Card Header -->
              <div class="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-zinc-700/60">
                <Info class="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <h2 class="text-sm font-semibold text-[var(--text-heading)]">Informasi Detail</h2>
              </div>

              <!-- Fields — 2-col grid on md+, stacked on mobile -->
              <div class="p-4 sm:p-5">
                <!-- Nama row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 divide-y divide-zinc-700/40 md:divide-y-0">
                  <!-- Nama -->
                  <div class="py-2.5 md:border-b md:border-zinc-700/40">
                    <dt class="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mb-0.5">Nama</dt>
                    <dd>
                      <span
                        class="text-sm text-[var(--text-primary)] select-all cursor-pointer hover:text-emerald-400 transition-colors font-medium"
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
                    class="py-2.5 md:border-b md:border-zinc-700/40"
                  >
                    <dt class="text-[11px] uppercase tracking-wide text-zinc-500 font-medium mb-0.5">
                      {{ item.label }}
                    </dt>
                    <dd>
                      <span
                        class="text-sm text-[var(--text-primary)] select-all cursor-pointer hover:text-emerald-400 transition-colors font-medium break-all"
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
          </div>

          <!-- Right Column - Related Items (1/4) -->
          <div class="xl:col-span-1">
            <div class="rounded-xl bg-zinc-800 shadow-sm xl:sticky xl:top-20">
              <!-- Sidebar Header -->
              <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-700/60">
                <h3 class="text-xs font-semibold text-[var(--text-heading)]">GTK Lainnya</h3>
                <span class="ml-auto text-[10px] text-zinc-500 font-mono">{{ relatedItems.length }}</span>
              </div>

              <!-- List -->
              <div class="p-2 max-h-64 xl:max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                <button
                  v-for="(item, index) in relatedItems"
                  :key="index"
                  @click="navigateToDetail(item)"
                  class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-zinc-700/50 text-zinc-400 hover:text-emerald-400 truncate block"
                >
                  {{ item.displayTitle }}
                </button>

                <p
                  v-if="relatedItems.length === 0"
                  class="text-xs text-center py-8 text-zinc-500"
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
import BaseButton from "~/components/ui/BaseButton.vue";

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

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadGtkDetail();
    }
  },
);

async function loadGtkDetail() {
  loading.value = true;
  error.value = null;

  try {
    await loadData("DataGtk");

    if (cardData.value && cardData.value.length > 0) {
      dataGtk.value = cardData.value;
    } else {
      const storedDataGtk = localStorage.getItem("DataGtk");
      if (storedDataGtk) {
        dataGtk.value = JSON.parse(storedDataGtk);
      }
    }

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

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

const relatedItems = computed(() => {
  if (!gtkDetail.value) return [];

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