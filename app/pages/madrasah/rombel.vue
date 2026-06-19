<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Grid View (Rombel List) -->
      <div v-if="!selectedRombel" class="space-y-6">
        <div class="flex flex-col gap-4 sm:gap-6 mb-6">
          <div class="flex flex-wrap items-center gap-4">
            <div>
              <h2
                class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2"
              >
                <Building2 class="w-7 h-7 text-emerald-400" />
                Data Rombel
              </h2>
              <p class="text-sm text-zinc-400 mt-1">
                Informasi pembagian rombel, tingkat rombel, dan wali kelas
                masing-masing
              </p>
            </div>

            <!-- Tambah Rombel Button (Admin Only) -->
            <div v-if="isAdmin" class="ml-auto">
              <button
                @click="openCreateModal"
                class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
              >
                <Plus class="w-4 h-4" />
                Tambah Rombel
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
            Memuat data rombel secara realtime...
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
              Tidak ada data rombel ditemukan
            </p>
            <p class="text-zinc-500 text-sm mt-1">
              Pastikan sheet DataKelas di Google Sheets Anda sudah terisi.
            </p>
          </div>

          <!-- Class Grid List -->
          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div
              v-for="(item, index) in dataKelas"
              :key="item.id_kelas || index"
              @click="selectedRombel = item"
              class="rounded-xl border p-5 bg-zinc-800/30 border-zinc-700/40 hover:border-emerald-500/30 transition-all duration-200 group cursor-pointer hover:bg-zinc-800/50"
            >
              <div class="flex items-start gap-4">
                <!-- Class Badge -->
                <div
                  class="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-emerald-950/40 text-emerald-400 shrink-0 font-bold"
                >
                  <span class="text-xs uppercase text-zinc-500 font-medium"
                    >Tkt</span
                  >
                  <span class="text-lg leading-tight">{{
                    item.tingkat || "-"
                  }}</span>
                </div>

                <!-- Class Details -->
                <div class="flex-1 min-w-0">
                  <h3
                    class="font-bold text-lg text-zinc-100 truncate group-hover:text-emerald-400 transition-colors"
                  >
                    {{ item.nama_kelas || "-" }}
                  </h3>

                  <div class="flex flex-col gap-1.5 mt-2 text-xs text-zinc-400">
                    <p class="flex items-center gap-1.5">
                      <span class="text-zinc-500 shrink-0">Wali Kelas:</span>
                      <span
                        class="bg-zinc-700/50 text-emerald-300 px-2 py-0.5 rounded text-[10px] w-fit font-medium"
                      >
                        {{ getTeacherName(item.wali_kelas) }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details View -->
      <div v-else class="space-y-6">
        <!-- Breadcrumb / Back Button -->
        <div class="mb-2">
          <button
            @click="selectedRombel = null"
            class="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft
              class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            />
            Kembali ke Daftar Rombel
          </button>
        </div>

        <!-- Header Panel -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 sm:p-6"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <span
                class="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-900/30"
              >
                Tingkat {{ selectedRombel.tingkat }}
              </span>
              <h2 class="text-xl sm:text-2xl font-bold text-white">
                Rombel {{ selectedRombel.nama_kelas }}
              </h2>
            </div>
            <p class="text-sm text-zinc-400 flex items-center gap-2">
              <span class="text-zinc-500">Wali Kelas:</span>
              <span class="font-medium text-zinc-300">{{
                getTeacherName(selectedRombel.wali_kelas)
              }}</span>
            </p>
          </div>

          <!-- Admin Actions in Details -->
          <div v-if="isAdmin" class="flex items-center gap-2">
            <button
              @click="openEditModal(selectedRombel)"
              class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-300 hover:text-amber-400 transition-all"
            >
              <Pencil class="w-3.5 h-3.5" />
              Edit Rombel
            </button>
            <button
              @click="handleDelete(selectedRombel)"
              class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 transition-all"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Hapus Rombel
            </button>
          </div>
        </div>

        <!-- Student List Container -->
        <div
          class="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 sm:p-6"
        >
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="text-lg font-semibold text-zinc-200">
                  Daftar Siswa
                </h3>
                <p class="text-xs text-zinc-500 mt-0.5">
                  Total: {{ studentsInRombel.length }} siswa
                </p>
              </div>
              <button
                v-if="isAdmin"
                @click="openAddStudentModal"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
              >
                <UserPlus class="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative w-full sm:w-64">
              <input
                v-model="searchStudentQuery"
                type="text"
                placeholder="Cari nama siswa..."
                class="w-full h-9 px-3.5 rounded-lg border border-zinc-755 bg-zinc-850/60 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto rounded-lg border border-zinc-800/80">
            <table
              class="w-full text-left border-collapse text-sm text-zinc-300"
            >
              <thead>
                <tr
                  class="border-b border-zinc-800 bg-zinc-800/30 text-zinc-400 font-medium"
                >
                  <th class="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAllStudents"
                      class="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th class="p-3.5 w-12 text-center">No</th>
                  <th class="p-3.5">Nama Lengkap</th>
                  <th class="p-3.5">NISN</th>
                  <th class="p-3.5">NIS Lokal</th>
                  <th class="p-3.5 w-16 text-center">L/P</th>
                  <th v-if="isAdmin" class="p-3.5 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingSiswa">
                  <td colspan="7" class="p-8 text-center text-zinc-500">
                    Memuat data siswa...
                  </td>
                </tr>
                <tr v-else-if="studentsInRombel.length === 0">
                  <td colspan="7" class="p-8 text-center text-zinc-500">
                    Tidak ada data siswa dalam rombel ini.
                  </td>
                </tr>
                <tr
                  v-else
                  v-for="(student, index) in studentsInRombel"
                  :key="student.id || index"
                  class="border-b border-zinc-800/30 hover:bg-zinc-800/10 transition-all"
                >
                  <td class="p-3.5 text-center">
                    <input
                      type="checkbox"
                      :checked="
                        selectedStudentIds.includes(student.id || student._id)
                      "
                      @change="toggleSelectStudent(student.id || student._id)"
                      class="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td class="p-3.5 text-center font-mono text-zinc-500">
                    {{ index + 1 }}
                  </td>
                  <td class="p-3.5 font-semibold text-zinc-200">
                    {{ toTitleCase(student.nama) }}
                  </td>
                  <td class="p-3.5 font-mono text-zinc-400">
                    {{ student.nisn || "-" }}
                  </td>
                  <td class="p-3.5 font-mono text-zinc-400">
                    {{ student.nis_lokal || "-" }}
                  </td>
                  <td class="p-3.5 text-center text-zinc-400">
                    {{ getJenisKelaminAbbr(student.jenis_kelamin) }}
                  </td>
                  <td v-if="isAdmin" class="p-3.5 text-center">
                    <button
                      @click="handleRemoveStudent(student)"
                      class="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 transition-all"
                      title="Keluarkan dari Rombel"
                    >
                      <UserMinus class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Promotion & Bulk Removal Panel -->
        <div
          v-if="selectedStudentIds.length > 0"
          class="bg-zinc-900/80 border border-zinc-850 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/40"
        >
          <div>
            <h4 class="text-sm font-semibold text-zinc-200">Aksi Massal</h4>
            <p class="text-xs text-zinc-400 mt-0.5">
              Telah memilih {{ selectedStudentIds.length }} siswa.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <!-- Bulk Remove Button -->
            <button
              v-if="isAdmin"
              @click="handleRemoveStudentsBulk"
              :disabled="isPromoting"
              class="px-4 py-2.5 text-sm font-medium rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
            >
              <UserMinus class="w-4 h-4" />
              Keluarkan
            </button>

            <div class="h-6 w-px bg-zinc-850 hidden md:block"></div>

            <!-- Kenaikan Controls -->
            <select
              v-model="targetRombelId"
              class="h-10 px-3.5 rounded-lg border border-zinc-750 bg-zinc-850 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all w-full sm:w-60"
            >
              <option value="">-- Pilih Rombel Tujuan Kenaikan --</option>
              <option
                v-for="rombel in higherTingkatRombels"
                :key="rombel.id_kelas"
                :value="rombel.id_kelas"
              >
                Tingkat {{ rombel.tingkat }} - {{ rombel.nama_kelas }}
              </option>
            </select>
            <button
              @click="handlePromoteStudents"
              :disabled="!targetRombelId || isPromoting"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
            >
              <Loader2 v-if="isPromoting" class="w-4 h-4 animate-spin" />
              Proses Kenaikan
            </button>
          </div>
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="
          modalMode === 'create' ? 'Tambah Data Rombel' : 'Edit Data Rombel'
        "
        :fields="kelasFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />

      <!-- Add Student Modal -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div
            v-if="showAddStudentModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            @click.self="showAddStudentModal = false"
          >
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/60" />

            <!-- Modal Content -->
            <div
              class="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <!-- Header -->
              <div
                class="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50 bg-zinc-800/50 shrink-0"
              >
                <div class="flex items-center gap-3 text-emerald-400">
                  <UserPlus class="w-5 h-5" />
                  <h3 class="text-lg font-semibold text-zinc-100">
                    Tambah Siswa ke Rombel
                  </h3>
                </div>
                <button
                  @click="showAddStudentModal = false"
                  class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Body -->
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <!-- Search & Count -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <p class="text-xs text-zinc-455">
                    Menampilkan
                    <span class="font-semibold text-zinc-250">{{
                      unassignedStudents.length
                    }}</span>
                    siswa tanpa rombel
                  </p>
                  <div class="relative w-full sm:w-60">
                    <input
                      v-model="searchUnassignedQuery"
                      type="text"
                      placeholder="Cari nama siswa..."
                      class="w-full h-9 px-3 rounded-lg border border-zinc-750 bg-zinc-850/60 text-zinc-100 text-sm outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <!-- List Table -->
                <div
                  class="overflow-x-auto rounded-lg border border-zinc-800/80 max-h-[40vh]"
                >
                  <table
                    class="w-full text-left border-collapse text-sm text-zinc-350"
                  >
                    <thead>
                      <tr
                        class="border-b border-zinc-800 bg-zinc-800/30 text-zinc-400 font-medium sticky top-0 z-10"
                      >
                        <th class="p-3 w-10 text-center bg-zinc-900">
                          <input
                            type="checkbox"
                            :checked="isAllUnassignedSelected"
                            @change="toggleSelectAllUnassigned"
                            class="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </th>
                        <th class="p-3 bg-zinc-900">Nama Siswa</th>
                        <th class="p-3 bg-zinc-900 w-32">NISN</th>
                        <th class="p-3 bg-zinc-900 w-16 text-center">L/P</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="unassignedStudents.length === 0">
                        <td colspan="4" class="p-8 text-center text-zinc-500">
                          Tidak ada siswa tanpa kelas ditemukan.
                        </td>
                      </tr>
                      <tr
                        v-else
                        v-for="student in unassignedStudents"
                        :key="student.id || student._id"
                        class="border-b border-zinc-800/30 hover:bg-zinc-800/10 transition-all"
                      >
                        <td class="p-3 text-center">
                          <input
                            type="checkbox"
                            :checked="
                              selectedUnassignedIds.includes(
                                student.id || student._id,
                              )
                            "
                            @change="
                              toggleSelectUnassigned(student.id || student._id)
                            "
                            class="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td class="p-3 font-semibold text-zinc-200">
                          {{ toTitleCase(student.nama) }}
                        </td>
                        <td class="p-3 font-mono text-zinc-400">
                          {{ student.nisn || "-" }}
                        </td>
                        <td class="p-3 text-center text-zinc-400">
                          {{ getJenisKelaminAbbr(student.jenis_kelamin) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700/50 bg-zinc-800/30 shrink-0"
              >
                <button
                  type="button"
                  @click="showAddStudentModal = false"
                  class="px-4 py-2 rounded-lg text-sm font-medium text-zinc-350 bg-zinc-700/50 hover:bg-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  @click="handleAssignStudents"
                  :disabled="
                    selectedUnassignedIds.length === 0 || isAddingStudents
                  "
                  class="px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Loader2
                    v-if="isAddingStudents"
                    class="w-4 h-4 animate-spin"
                  />
                  Tambahkan ({{ selectedUnassignedIds.length }})
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Database,
  Building2,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { putToApi } from "~/utils/api";
import CrudModal from "~/components/ui/CrudModal.vue";

const {
  cardData: dataKelas,
  isLoading,
  loadData: loadDataKelas,
  refreshData: refreshDataKelas,
} = useTableData();
const { cardData: dataGtk, loadData: loadDataGtk } = useTableData();
const {
  cardData: dataSiswa,
  isLoading: isLoadingSiswa,
  loadData: loadDataSiswa,
} = useTableData();

const handleSuccess = () => {
  refreshDataKelas("data_kelas");
  selectedRombel.value = null;
};

const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "data_kelas",
  handleSuccess,
);
const { Notify, Confirm } = useNotiflix();

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

// Detail & Promotion state
const selectedRombel = ref(null);
const searchStudentQuery = ref("");
const selectedStudentIds = ref([]);
const targetRombelId = ref("");
const isPromoting = ref(false);

// Add Student Modal state
const showAddStudentModal = ref(false);
const searchUnassignedQuery = ref("");
const selectedUnassignedIds = ref([]);
const isAddingStudents = ref(false);

// Teacher options for dropdown selection
const teacherOptions = computed(() => {
  if (!Array.isArray(dataGtk.value)) return [];
  return dataGtk.value
    .filter((teacher) => teacher.peg_id && teacher.nama_lengkap)
    .map((teacher) => ({
      value: teacher.peg_id,
      label: teacher.nama_lengkap,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

// Field configuration for Rombel CRUD form
const kelasFields = computed(() => [
  {
    key: "id_kelas",
    label: "ID Rombel",
    required: modalMode.value === "edit",
    disabled: true,
    placeholder:
      modalMode.value === "create" ? "Otomatis dibuat oleh sistem" : "",
  },
  { key: "nama_kelas", label: "Nama Rombel", required: true },
  {
    key: "tingkat",
    label: "Tingkat",
    type: "select",
    required: true,
    options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  },
  {
    key: "wali_kelas",
    label: "Wali Kelas",
    type: "select",
    options: teacherOptions.value,
  },
]);

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {};
  showModal.value = true;
};

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = {
    _id: item.id || item._id,
    id_kelas: item.id_kelas || "",
    nama_kelas: item.nama_kelas || "",
    tingkat: item.tingkat || "",
    wali_kelas: item.wali_kelas || "",
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  let success = false;
  if (modalMode.value === "create") {
    // Generate id_kelas automatically
    const cleanTingkat = String(formData.tingkat || "").trim();
    const cleanNama = String(formData.nama_kelas || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const generatedId = `kls_${cleanTingkat}_${cleanNama}`;

    // Validasi duplikasi ID kelas di frontend
    const isDuplicate = dataKelas.value.some((k) => k.id_kelas === generatedId);
    if (isDuplicate) {
      Notify?.failure?.(
        `Rombel dengan Tingkat ${cleanTingkat} dan Nama ${formData.nama_kelas} sudah terdaftar.`,
      );
      return;
    }

    formData.id_kelas = generatedId;
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
  deleteItem(id, `Rombel ${item.nama_kelas}`);
};

// Map teacher details by Peg ID
const teacherMap = computed(() => {
  const map = {};
  if (Array.isArray(dataGtk.value)) {
    dataGtk.value.forEach((teacher) => {
      if (teacher.peg_id) {
        map[teacher.peg_id] = teacher;
      }
    });
  }
  return map;
});

const getTeacherName = (pegId) => {
  if (!pegId) return "Belum Ditentukan";
  const teacher = teacherMap.value[pegId];
  return teacher ? teacher.nama_lengkap : pegId;
};

// Student filtering logic in active Rombel
const studentsInRombel = computed(() => {
  if (!selectedRombel.value || !Array.isArray(dataSiswa.value)) return [];

  return dataSiswa.value.filter((student) => {
    const matchClass = student.kelas === selectedRombel.value.id_kelas;
    const matchSearch =
      !searchStudentQuery.value.trim() ||
      String(student.nama || "")
        .toLowerCase()
        .includes(searchStudentQuery.value.toLowerCase().trim()) ||
      String(student.nisn || "").includes(searchStudentQuery.value.trim()) ||
      String(student.nis_lokal || "").includes(searchStudentQuery.value.trim());

    return matchClass && matchSearch;
  });
});

// Selection methods
const toggleSelectStudent = (id) => {
  const index = selectedStudentIds.value.indexOf(id);
  if (index > -1) {
    selectedStudentIds.value.splice(index, 1);
  } else {
    selectedStudentIds.value.push(id);
  }
};

const isAllSelected = computed(() => {
  if (studentsInRombel.value.length === 0) return false;
  return studentsInRombel.value.every((s) =>
    selectedStudentIds.value.includes(s.id || s._id),
  );
});

const toggleSelectAllStudents = () => {
  if (isAllSelected.value) {
    studentsInRombel.value.forEach((s) => {
      const id = s.id || s._id;
      const index = selectedStudentIds.value.indexOf(id);
      if (index > -1) {
        selectedStudentIds.value.splice(index, 1);
      }
    });
  } else {
    studentsInRombel.value.forEach((s) => {
      const id = s.id || s._id;
      if (!selectedStudentIds.value.includes(id)) {
        selectedStudentIds.value.push(id);
      }
    });
  }
};

// Target Rombel options with higher levels
const higherTingkatRombels = computed(() => {
  if (!selectedRombel.value || !Array.isArray(dataKelas.value)) return [];
  const currentTingkat = Number(selectedRombel.value.tingkat) || 0;
  return dataKelas.value
    .filter((rombel) => {
      const targetTingkat = Number(rombel.tingkat) || 0;
      return targetTingkat > currentTingkat;
    })
    .sort((a, b) => {
      const levelA = Number(a.tingkat) || 0;
      const levelB = Number(b.tingkat) || 0;
      if (levelA !== levelB) return levelA - levelB;
      return (a.nama_kelas || "").localeCompare(b.nama_kelas || "");
    });
});

// Student Promotion logic execution
const handlePromoteStudents = async () => {
  if (!targetRombelId.value) {
    Notify?.failure?.("Silakan pilih rombel tujuan terlebih dahulu.");
    return;
  }

  const targetRombel = dataKelas.value.find(
    (k) => k.id_kelas === targetRombelId.value,
  );
  if (!targetRombel) return;

  Confirm?.show(
    "Konfirmasi Kenaikan Rombel",
    `Apakah Anda yakin ingin menaikkan ${selectedStudentIds.value.length} siswa ke rombel ${targetRombel.nama_kelas}?`,
    "Ya, Proses",
    "Batal",
    async () => {
      isPromoting.value = true;
      let successCount = 0;
      let failCount = 0;

      try {
        const promises = selectedStudentIds.value.map(async (studentId) => {
          try {
            await putToApi("data_siswa", studentId, {
              kelas: targetRombelId.value,
            });
            successCount++;
          } catch (err) {
            console.error(`Gagal menaikkan siswa ID ${studentId}:`, err);
            failCount++;
          }
        });

        await Promise.all(promises);

        if (successCount > 0) {
          Notify?.success?.(
            `Berhasil menaikkan ${successCount} siswa ke rombel ${targetRombel.nama_kelas}.`,
          );
          selectedStudentIds.value = [];
          targetRombelId.value = "";
          await loadDataSiswa("data_siswa");
        }
        if (failCount > 0) {
          Notify?.failure?.(`Gagal memproses ${failCount} siswa.`);
        }
      } catch (err) {
        Notify?.failure?.("Terjadi kesalahan saat memproses kenaikan rombel.");
      } finally {
        isPromoting.value = false;
      }
    },
  );
};

// Filter unassigned students for the modal
const unassignedStudents = computed(() => {
  if (!Array.isArray(dataSiswa.value)) return [];
  return dataSiswa.value.filter((student) => {
    const isUnassigned =
      !student.kelas || student.kelas === "" || student.kelas === "-";
    const matchSearch =
      !searchUnassignedQuery.value.trim() ||
      String(student.nama || "")
        .toLowerCase()
        .includes(searchUnassignedQuery.value.toLowerCase().trim()) ||
      String(student.nisn || "").includes(searchUnassignedQuery.value.trim()) ||
      String(student.nis_lokal || "").includes(
        searchUnassignedQuery.value.trim(),
      );
    return isUnassigned && matchSearch;
  });
});

const openAddStudentModal = () => {
  searchUnassignedQuery.value = "";
  selectedUnassignedIds.value = [];
  showAddStudentModal.value = true;
};

const toggleSelectUnassigned = (id) => {
  const index = selectedUnassignedIds.value.indexOf(id);
  if (index > -1) {
    selectedUnassignedIds.value.splice(index, 1);
  } else {
    selectedUnassignedIds.value.push(id);
  }
};

const isAllUnassignedSelected = computed(() => {
  if (unassignedStudents.value.length === 0) return false;
  return unassignedStudents.value.every((s) =>
    selectedUnassignedIds.value.includes(s.id || s._id),
  );
});

const toggleSelectAllUnassigned = () => {
  if (isAllUnassignedSelected.value) {
    unassignedStudents.value.forEach((s) => {
      const id = s.id || s._id;
      const index = selectedUnassignedIds.value.indexOf(id);
      if (index > -1) {
        selectedUnassignedIds.value.splice(index, 1);
      }
    });
  } else {
    unassignedStudents.value.forEach((s) => {
      const id = s.id || s._id;
      if (!selectedUnassignedIds.value.includes(id)) {
        selectedUnassignedIds.value.push(id);
      }
    });
  }
};

const handleAssignStudents = async () => {
  if (selectedUnassignedIds.value.length === 0) return;

  isAddingStudents.value = true;
  let successCount = 0;
  let failCount = 0;

  try {
    const promises = selectedUnassignedIds.value.map(async (studentId) => {
      try {
        await putToApi("data_siswa", studentId, {
          kelas: selectedRombel.value.id_kelas,
        });
        successCount++;
      } catch (err) {
        console.error(`Gagal menunjuk siswa ID ${studentId} ke rombel:`, err);
        failCount++;
      }
    });

    await Promise.all(promises);

    if (successCount > 0) {
      Notify?.success?.(
        `Berhasil menambahkan ${successCount} siswa ke rombel.`,
      );
      showAddStudentModal.value = false;
      selectedUnassignedIds.value = [];
      await loadDataSiswa("data_siswa");
    }
    if (failCount > 0) {
      Notify?.failure?.(`Gagal memproses ${failCount} siswa.`);
    }
  } catch (err) {
    Notify?.failure?.("Terjadi kesalahan saat menambahkan siswa.");
  } finally {
    isAddingStudents.value = false;
  }
};

const handleRemoveStudent = (student) => {
  Confirm?.show(
    "Keluarkan Siswa",
    `Apakah Anda yakin ingin mengeluarkan ${toTitleCase(student.nama)} dari rombel ini? Status rombel siswa akan dikosongkan.`,
    "Ya, Keluarkan",
    "Batal",
    async () => {
      try {
        await putToApi("data_siswa", student.id || student._id, {
          kelas: "",
        });
        Notify?.success?.(
          `Berhasil mengeluarkan ${toTitleCase(student.nama)} dari rombel.`,
        );
        await loadDataSiswa("data_siswa");
      } catch (err) {
        Notify?.failure?.("Gagal mengeluarkan siswa.");
      }
    },
  );
};

const handleRemoveStudentsBulk = () => {
  Confirm?.show(
    "Keluarkan Siswa Terpilih",
    `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.value.length} siswa terpilih dari rombel ini?`,
    "Ya, Keluarkan",
    "Batal",
    async () => {
      isPromoting.value = true;
      let successCount = 0;
      let failCount = 0;

      try {
        const promises = selectedStudentIds.value.map(async (studentId) => {
          try {
            await putToApi("data_siswa", studentId, {
              kelas: "",
            });
            successCount++;
          } catch (err) {
            console.error(`Gagal mengeluarkan siswa ID ${studentId}:`, err);
            failCount++;
          }
        });

        await Promise.all(promises);

        if (successCount > 0) {
          Notify?.success?.(
            `Berhasil mengeluarkan ${successCount} siswa dari rombel.`,
          );
          selectedStudentIds.value = [];
          await loadDataSiswa("data_siswa");
        }
        if (failCount > 0) {
          Notify?.failure?.(`Gagal memproses ${failCount} siswa.`);
        }
      } catch (err) {
        Notify?.failure?.(
          "Terjadi kesalahan saat memproses pengeluaran siswa.",
        );
      } finally {
        isPromoting.value = false;
      }
    },
  );
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

onMounted(() => {
  loadDataKelas("data_kelas");
  loadDataGtk("data_gtk");
  loadDataSiswa("data_siswa");
});
</script>
