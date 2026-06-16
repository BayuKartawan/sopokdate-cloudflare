<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <h2 class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2">
              <Building2 class="w-7 h-7 text-emerald-400" />
              Data Kelas
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              Informasi pembagian kelas, tingkat rombel, dan wali kelas masing-masing
            </p>
          </div>

          <!-- Tambah Kelas Button (Admin Only) -->
          <div v-if="isAdmin" class="ml-auto">
            <button
              @click="openCreateModal"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
            >
              <Plus class="w-4 h-4" />
              Tambah Kelas
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="pt-2">
        <p
          v-if="isLoading"
          class="text-center text-zinc-500 text-lg font-semibold py-12"
        >
          Memuat data kelas secara realtime...
        </p>

        <div
          v-else-if="dataKelas.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800"
        >
          <Database
            class="w-16 h-16 mx-auto mb-4 text-zinc-600"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 text-lg font-medium">
            Tidak ada data kelas ditemukan
          </p>
          <p class="text-zinc-500 text-sm mt-1">
            Pastikan sheet DataKelas di Google Sheets Anda sudah terisi.
          </p>
        </div>

        <!-- Class Grid List -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(item, index) in dataKelas"
            :key="item.idKelas || index"
            class="rounded-xl border p-5 bg-zinc-800/30 border-zinc-700/40 hover:border-emerald-500/30 transition-all duration-200 group"
          >
            <div class="flex items-start gap-4">
              <!-- Class Badge -->
              <div
                class="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-emerald-950/40 text-emerald-400 shrink-0 font-bold"
              >
                <span class="text-xs uppercase text-zinc-500 font-medium">Tkt</span>
                <span class="text-lg leading-tight">{{ item.tingkat || "-" }}</span>
              </div>

              <!-- Class Details -->
              <div class="flex-1 min-w-0">
                <h3
                  class="font-bold text-lg text-zinc-100 truncate group-hover:text-emerald-400 transition-colors"
                >
                  Kelas {{ item.namaKelas || "-" }}
                </h3>

                <div class="flex flex-col gap-1.5 mt-2.5 text-xs text-zinc-400">
                  <p class="flex items-center gap-1.5">
                    <span class="w-20 text-zinc-500 shrink-0">ID Kelas:</span>
                    <span class="font-mono text-zinc-300">{{ item.idKelas || "-" }}</span>
                  </p>
                  <p class="flex items-center gap-1.5">
                    <span class="w-20 text-zinc-500 shrink-0">Wali Kelas:</span>
                    <span class="bg-zinc-700/50 text-emerald-300 px-2 py-0.5 rounded text-[10px] w-fit font-medium">
                      {{ getTeacherName(item.waliKelas) }}
                    </span>
                  </p>
                  <p class="flex items-center gap-1.5">
                    <span class="w-20 text-zinc-500 shrink-0">Peg ID Wali:</span>
                    <span class="font-mono text-zinc-400">{{ item.waliKelas || "-" }}</span>
                  </p>
                </div>
              </div>

              <!-- Admin Actions -->
              <div v-if="isAdmin" class="flex items-center gap-1 shrink-0 mt-0.5">
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
            </div>
          </div>
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="modalMode === 'create' ? 'Tambah Data Kelas' : 'Edit Data Kelas'"
        :fields="kelasFields"
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
import { Database, Building2, Plus, Pencil, Trash2 } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import CrudModal from "~/components/ui/CrudModal.vue";

const { cardData: dataKelas, isLoading, loadData: loadDataKelas, refreshData: refreshDataKelas } = useTableData();
const { cardData: dataGtk, loadData: loadDataGtk } = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud("DataKelas", () => refreshDataKelas("DataKelas"));

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

// Field configuration for Kelas CRUD form
const kelasFields = [
  { key: "ID Kelas", label: "ID Kelas", required: true },
  { key: "Nama Kelas", label: "Nama Kelas", required: true },
  { key: "Tingkat", label: "Tingkat", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] },
  { key: "Wali Kelas", label: "Wali Kelas (Peg ID)" },
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
    "ID Kelas": item.idKelas || "",
    "Nama Kelas": item.namaKelas || "",
    "Tingkat": item.tingkat || "",
    "Wali Kelas": item.waliKelas || "",
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
  deleteItem(id, `Kelas ${item.namaKelas}`);
};

// Map teacher details by Peg ID
const teacherMap = computed(() => {
  const map = {};
  if (Array.isArray(dataGtk.value)) {
    dataGtk.value.forEach((teacher) => {
      if (teacher.PegID) {
        map[teacher.PegID] = teacher;
      }
    });
  }
  return map;
});

const getTeacherName = (pegId) => {
  if (!pegId) return "Belum Ditentukan";
  const teacher = teacherMap.value[pegId];
  return teacher ? teacher.title : pegId;
};

onMounted(() => {
  loadDataKelas("DataKelas");
  loadDataGtk("DataGtk");
});
</script>
