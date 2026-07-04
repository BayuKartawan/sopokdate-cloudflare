<template>
  <div class="min-h-screen">
    <div class="page-layout space-y-4 sm:space-y-6">

      <!-- Loading / Not Found -->
      <div v-if="isLoading" class="text-center text-zinc-500 text-sm py-16">
        Memuat data rombel...
      </div>
      <div v-else-if="!selectedRombel" class="text-center py-16 px-4">
        <p class="text-zinc-300 text-base font-medium">Rombel tidak ditemukan.</p>
        <button @click="router.push('/akademik/rombel')" class="mt-4 text-sm text-emerald-400 hover:underline">
          Kembali ke Daftar Rombel
        </button>
      </div>

      <template v-else>
        <!-- Breadcrumb / Back Button -->
        <div>
          <button
            @click="router.push('/akademik/rombel')"
            class="inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors group px-2 py-1 -ml-2 rounded-lg hover:bg-zinc-800/50"
          >
            <ArrowLeft class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            Kembali ke Daftar Rombel
          </button>
        </div>

        <!-- Header Panel -->
        <div
          class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm"
        >
          <div class="space-y-2.5 w-full lg:w-auto">
            <div class="flex flex-wrap items-center gap-3">
              <span
                class="px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30"
              >
                Tingkat {{ selectedRombel.tingkat }}
              </span>
              <h2 class="text-xl sm:text-2xl font-bold text-[var(--text-heading)] break-words">
                Rombel {{ selectedRombel.nama_kelas }}
              </h2>
            </div>
            <p class="text-xs sm:text-sm text-zinc-400 flex flex-wrap items-center gap-2">
              <span class="text-zinc-500">Wali Kelas:</span>
              <span class="font-medium text-zinc-300">{{ getTeacherName(selectedRombel.wali_kelas) }}</span>
            </p>
          </div>

          <!-- Actions Panel -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0 w-full lg:w-auto">
            <!-- Academic Year Dropdown -->
            <div class="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-lg border border-zinc-700/50 w-full sm:w-auto">
              <span class="text-[11px] sm:text-xs font-semibold text-zinc-400 ml-1 whitespace-nowrap">Tahun Pelajaran:</span>
              <select
                v-model="selectedTapel"
                class="h-8 w-full sm:w-auto px-2.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-[11px] sm:text-xs cursor-pointer"
              >
                <option v-for="opt in tapelOptions" :key="opt" :value="opt">
                  {{ opt }}{{ opt === currentTapel ? " (Sekarang)" : "" }}
                </option>
              </select>
            </div>

            <!-- Admin Actions -->
            <div v-if="isAdmin" class="flex flex-row gap-2 w-full sm:w-auto">
              <button
                @click="openEditModal"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-300 hover:text-amber-400 transition-all shadow-sm"
              >
                <Pencil class="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                @click="handleDelete"
                class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-500/25 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all shadow-sm"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Student List Container -->
        <div class="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div class="flex flex-row items-center justify-between w-full md:w-auto gap-4">
              <div>
                <h3 class="text-base sm:text-lg font-semibold text-zinc-200">Daftar Siswa</h3>
                <p class="text-xs text-zinc-500 mt-0.5">Total: {{ studentsInRombel.length }} siswa</p>
              </div>
              <button
                v-if="isAdmin"
                @click="showAddStudentModal = true"
                class="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm whitespace-nowrap"
              >
                <UserPlus class="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <button
                v-if="isAdmin"
                @click="showAddStudentModal = true"
                class="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm whitespace-nowrap"
              >
                <UserPlus class="w-3.5 h-3.5" />
                Tambah Siswa
              </button>
              <div class="relative w-full sm:w-64">
                <input
                  v-model="searchStudentQuery"
                  type="text"
                  placeholder="Cari nama atau NISN..."
                  class="w-full h-9 px-3.5 rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto rounded-lg border border-zinc-800/80 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <table class="w-full text-left border-collapse text-xs sm:text-sm text-zinc-300 min-w-[700px]">
              <thead>
                <tr class="border-b border-zinc-800 bg-zinc-800/40 text-zinc-400 font-medium whitespace-nowrap">
                  <th class="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAllStudents"
                      class="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th class="p-3 w-12 text-center">No</th>
                  <th class="p-3">Nama Lengkap</th>
                  <th class="p-3 w-32">NISN</th>
                  <th class="p-3 w-28">NIS Lokal</th>
                  <th class="p-3 w-16 text-center">L/P</th>
                  <th v-if="isAdmin" class="p-3 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoadingSiswa">
                  <td colspan="7" class="p-8 text-center text-zinc-500">Memuat data siswa...</td>
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
                  class="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-all"
                >
                  <td class="p-3 text-center align-middle">
                    <input
                      type="checkbox"
                      :disabled="student.status_promosi === 'Sudah'"
                      :checked="selectedStudentIds.includes(student.id || student._id)"
                      @change="toggleSelectStudent(student.id || student._id)"
                      class="rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 w-4 h-4 disabled:opacity-30 disabled:cursor-not-allowed"
                      :class="student.status_promosi === 'Sudah' ? 'cursor-not-allowed' : 'cursor-pointer'"
                    />
                  </td>
                  <td class="p-3 text-center align-middle font-mono text-zinc-500 text-[11px] sm:text-xs">
                    {{ index + 1 }}
                  </td>
                  <td class="p-3 align-middle font-semibold text-zinc-200">
                    <div class="flex flex-wrap items-center gap-2">
                      <span>{{ toTitleCase(student.nama) }}</span>
                      <span
                        v-if="student.status_promosi === 'Sudah'"
                        class="bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 whitespace-nowrap"
                      >
                        Baru Naik Kelas
                      </span>
                      <button
                        v-if="student.status_promosi === 'Sudah' && isAdmin"
                        @click="handleCancelPromotion(student)"
                        class="bg-red-500/10 hover:bg-red-500/20 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-500/20 dark:border-red-900/30 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all shrink-0 cursor-pointer whitespace-nowrap"
                        title="Batalkan Kenaikan Kelas"
                      >
                        Batal Naik
                      </button>
                    </div>
                  </td>
                  <td class="p-3 align-middle font-mono text-zinc-400 whitespace-nowrap text-xs">
                    {{ student.nisn || "-" }}
                  </td>
                  <td class="p-3 align-middle font-mono text-zinc-400 whitespace-nowrap text-xs">
                    {{ student.nis_lokal || "-" }}
                  </td>
                  <td class="p-3 align-middle text-center text-zinc-400 font-medium">
                    {{ getJenisKelaminAbbr(student.jenis_kelamin) }}
                  </td>
                  <td v-if="isAdmin" class="p-3 align-middle text-center">
                    <button
                      @click="handleRemoveStudent(student)"
                      class="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all inline-flex items-center justify-center"
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
        <Transition name="fade">
          <div
            v-if="selectedStudentIds.length > 0"
            class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg sticky bottom-4 z-10"
          >
            <div>
              <h4 class="text-sm font-semibold text-zinc-200">Aksi Massal</h4>
              <p class="text-[11px] sm:text-xs text-zinc-400 mt-1">
                Telah memilih <strong class="text-emerald-400">{{ selectedStudentIds.length }}</strong> siswa.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <!-- Bulk Remove -->
              <button
                v-if="isAdmin"
                @click="handleRemoveStudentsBulk"
                :disabled="isPromoting || isGraduating"
                class="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-500/25 dark:border-red-900/40 text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <UserMinus class="w-4 h-4" />
                Keluarkan
              </button>

              <div class="h-6 w-px bg-zinc-800 hidden sm:block"></div>

              <!-- Graduation for Level 6 -->
              <template v-if="selectedRombel.tingkat === '6'">
                <button
                  v-if="isAdmin"
                  @click="showGraduationModal = true"
                  :disabled="isGraduating"
                  class="px-5 py-2.5 text-xs sm:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm w-full sm:w-auto"
                >
                  <GraduationCap class="w-4 h-4" />
                  Proses Kelulusan
                </button>
              </template>

              <!-- Kenaikan for non-Level 6 -->
              <template v-else>
                <select
                  v-model="targetRombelId"
                  class="h-10 px-3.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all w-full sm:w-64 cursor-pointer"
                >
                  <option value="">-- Pilih Rombel Kenaikan --</option>
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
                  class="px-5 py-2.5 text-xs sm:text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm w-full sm:w-auto"
                >
                  <Loader2 v-if="isPromoting" class="w-4 h-4 animate-spin" />
                  <span v-else>Proses Kenaikan</span>
                </button>
              </template>
            </div>
          </div>
        </Transition>
      </template>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        mode="edit"
        title="Edit Data Rombel"
        :fields="kelasFields"
        :initialData="editingItem"
        :isSaving="isSaving"
        @submit="handleFormSubmit"
        @close="showModal = false"
      />

      <!-- Add Student Modal -->
      <AddStudentModal
        :show="showAddStudentModal"
        :isLoading="isAddingStudents"
        :students="unassignedStudents"
        :kelasMap="kelasMap"
        @close="showAddStudentModal = false"
        @assign="handleAssignStudents"
      />

      <!-- Graduation Modal -->
      <GraduationModal
        :show="showGraduationModal"
        :isLoading="isGraduating"
        :selectedCount="selectedStudentIds.length"
        :rombelNama="selectedRombel?.nama_kelas ?? ''"
        @close="showGraduationModal = false"
        @confirm="handleGraduateStudents"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  ArrowLeft, Pencil, Trash2, UserMinus, UserPlus,
  GraduationCap, Loader2,
} from "lucide-vue-next";
import { useTableData, clearTableSessionCache } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { putToApi, postToApi, deleteFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";
import CrudModal from "~/components/ui/CrudModal.vue";
import AddStudentModal from "~/components/rombel/AddStudentModal.vue";
import GraduationModal from "~/components/rombel/GraduationModal.vue";

const route = useRoute();
const router = useRouter();
const rombelId = computed(() => route.params.id);

// --- Data Sources ---
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
const { cardData: dataRiwayat, loadData: loadDataRiwayat } = useTableData();

// --- Resolved Rombel ---
const selectedRombel = computed(() => {
  if (!Array.isArray(dataKelas.value)) return null;
  return dataKelas.value.find((k) => String(k.id_kelas) === String(rombelId.value)) ?? null;
});

// --- Academic Year ---
const selectedTapel = ref("");
const currentTapel = ref("");

const tapelOptions = computed(() => {
  const years = new Set();
  if (currentTapel.value) {
    years.add(currentTapel.value);
  } else {
    const todayStr = new Date().toISOString().substring(0, 10);
    years.add(dapatkanTahunDanSemester(todayStr).tahunPelajaran);
  }
  if (Array.isArray(dataRiwayat.value)) {
    dataRiwayat.value.forEach((r) => { if (r.tahun_pelajaran) years.add(r.tahun_pelajaran); });
  }
  return Array.from(years).sort((a, b) => a.localeCompare(b));
});

watch(selectedTapel, async (newTapel) => {
  if (newTapel) {
    try {
      await loadDataSiswa("data_siswa", true, { tahun_pelajaran: newTapel });
    } catch (err) {
      console.error("Gagal memuat data siswa:", err);
    }
  }
});

// --- CRUD ---
const { isAdmin, isSaving, updateItem } = useCrud("data_kelas", () => {
  refreshDataKelas("data_kelas");
});
const { Notify, Confirm } = useNotiflix();

const showModal = ref(false);
const editingItem = ref({});

// Teacher map (supports lookup by both ID and old Peg ID/PegID for compatibility)
const teacherMap = computed(() => {
  const map = {};
  if (Array.isArray(dataGtk.value)) {
    dataGtk.value.forEach((t) => {
      if (t.id) map[t.id] = t;
      if (t.peg_id) map[t.peg_id] = t;
      if (t.PegID) map[t.PegID] = t;
    });
  }
  return map;
});

const getTeacherName = (pegId) => {
  if (!pegId) return "Belum Ditentukan";
  const teacher = teacherMap.value[pegId];
  return teacher ? (teacher.title || teacher.nama_lengkap) : pegId;
};

// Teacher options for CRUD form (submits GTK ID as value)
const teacherOptions = computed(() => {
  if (!Array.isArray(dataGtk.value)) return [];
  return dataGtk.value
    .filter((t) => t.id && (t.title || t.nama_lengkap))
    .map((t) => ({ value: t.id, label: t.title || t.nama_lengkap }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const kelasFields = computed(() => [
  { key: "id_kelas", label: "ID Rombel", disabled: true },
  { key: "nama_kelas", label: "Nama Rombel", required: true },
  {
    key: "tingkat", label: "Tingkat", type: "select", required: true,
    options: ["1","2","3","4","5","6","7","8","9","10","11","12"],
  },
  { key: "wali_kelas", label: "Wali Kelas", type: "select", options: teacherOptions.value },
]);

const openEditModal = () => {
  if (!selectedRombel.value) return;
  editingItem.value = {
    _id: selectedRombel.value.id || selectedRombel.value._id,
    id_kelas: selectedRombel.value.id_kelas || "",
    nama_kelas: selectedRombel.value.nama_kelas || "",
    tingkat: selectedRombel.value.tingkat || "",
    wali_kelas: selectedRombel.value.wali_kelas || "",
  };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  const success = await updateItem(editingItem.value._id, formData);
  if (success) showModal.value = false;
};

const kelasMap = computed(() => {
  const map = {};
  if (Array.isArray(dataKelas.value)) {
    dataKelas.value.forEach((k) => {
      const id = k.id_kelas || k.idKelas;
      if (id) map[id] = k;
    });
  }
  return map;
});

const handleDelete = () => {
  if (!selectedRombel.value) return;
  const item = selectedRombel.value;
  const id = item.id || item._id;
  const classId = item.id_kelas;

  const studentsToClear = Array.isArray(dataSiswa.value)
    ? dataSiswa.value.filter((s) => s.kelas === classId || s.kelas_db === classId)
    : [];

  Confirm?.show(
    "Hapus Rombel",
    `Apakah Anda yakin ingin menghapus Rombel ${item.nama_kelas}? Semua (${studentsToClear.length}) siswa di rombel ini akan dikosongkan kelasnya.`,
    "Ya, Hapus", "Batal",
    async () => {
      isSaving.value = true;
      let failCount = 0;
      try {
        if (studentsToClear.length > 0) {
          await Promise.all(
            studentsToClear.map(async (s) => {
              try { await putToApi("data_siswa", s.id || s._id, { kelas: "" }); }
              catch { failCount++; }
            }),
          );
        }
        await deleteFromApi("data_kelas", id);
        if (failCount > 0) {
          Notify?.warning?.(`Rombel dihapus, tetapi gagal mengosongkan kelas ${failCount} siswa.`);
        } else {
          Notify?.success?.(`Rombel ${item.nama_kelas} berhasil dihapus.`);
        }
        router.push("/akademik/rombel");
      } catch (err) {
        Notify?.failure?.(err.message || "Gagal menghapus rombel");
      } finally {
        isSaving.value = false;
      }
    },
  );
};

// --- Students ---
const searchStudentQuery = ref("");
const selectedStudentIds = ref([]);
const targetRombelId = ref("");
const isPromoting = ref(false);

const studentsInRombel = computed(() => {
  if (!selectedRombel.value || !Array.isArray(dataSiswa.value)) return [];
  const q = searchStudentQuery.value.toLowerCase().trim();
  return dataSiswa.value.filter((s) => {
    if (s.kelas !== selectedRombel.value.id_kelas) return false;
    if (!q) return true;
    return (
      String(s.nama || "").toLowerCase().includes(q) ||
      String(s.nisn || "").includes(q) ||
      String(s.nis_lokal || "").includes(q)
    );
  });
});

const promotableStudents = computed(() =>
  studentsInRombel.value.filter((s) => s.status_promosi !== "Sudah"),
);

const isAllSelected = computed(() => {
  if (promotableStudents.value.length === 0) return false;
  return promotableStudents.value.every((s) =>
    selectedStudentIds.value.includes(s.id || s._id),
  );
});

const toggleSelectStudent = (id) => {
  const index = selectedStudentIds.value.indexOf(id);
  if (index > -1) selectedStudentIds.value.splice(index, 1);
  else selectedStudentIds.value.push(id);
};

const toggleSelectAllStudents = () => {
  if (isAllSelected.value) {
    promotableStudents.value.forEach((s) => {
      const id = s.id || s._id;
      const idx = selectedStudentIds.value.indexOf(id);
      if (idx > -1) selectedStudentIds.value.splice(idx, 1);
    });
  } else {
    promotableStudents.value.forEach((s) => {
      const id = s.id || s._id;
      if (!selectedStudentIds.value.includes(id)) selectedStudentIds.value.push(id);
    });
  }
};

const higherTingkatRombels = computed(() => {
  if (!selectedRombel.value || !Array.isArray(dataKelas.value)) return [];
  const current = Number(selectedRombel.value.tingkat) || 0;
  return dataKelas.value
    .filter((r) => Number(r.tingkat) === current + 1)
    .sort((a, b) => (a.nama_kelas || "").localeCompare(b.nama_kelas || ""));
});

const handlePromoteStudents = async () => {
  if (!targetRombelId.value) {
    Notify?.failure?.("Silakan pilih rombel tujuan terlebih dahulu.");
    return;
  }
  const targetRombel = dataKelas.value.find((k) => k.id_kelas === targetRombelId.value);
  if (!targetRombel) return;

  Confirm?.show(
    "Konfirmasi Kenaikan Rombel",
    `Apakah Anda yakin ingin menaikkan ${selectedStudentIds.value.length} siswa ke rombel ${targetRombel.nama_kelas}?`,
    "Ya, Proses", "Batal",
    async () => {
      isPromoting.value = true;
      let successCount = 0, failCount = 0;
      try {
        await Promise.all(
          selectedStudentIds.value.map(async (id) => {
            try {
              await putToApi("data_siswa", id, { kelas: targetRombelId.value, status_promosi: "Sudah" });
              successCount++;
            } catch { failCount++; }
          }),
        );
        if (successCount > 0) {
          Notify?.success?.(`Berhasil menaikkan ${successCount} siswa ke ${targetRombel.nama_kelas}.`);
          selectedStudentIds.value = [];
          targetRombelId.value = "";
          await loadDataSiswa("data_siswa");
          await loadDataRiwayat("riwayat_kelas_siswa", true);
        }
        if (failCount > 0) Notify?.failure?.(`Gagal memproses ${failCount} siswa.`);
      } catch {
        Notify?.failure?.("Terjadi kesalahan saat memproses kenaikan rombel.");
      } finally {
        isPromoting.value = false;
      }
    },
  );
};

const handleCancelPromotion = (student) => {
  Confirm?.show(
    "Batalkan Kenaikan Kelas",
    `Apakah Anda yakin ingin membatalkan kenaikan kelas untuk ${toTitleCase(student.nama)}?`,
    "Ya, Batalkan", "Batal",
    async () => {
      try {
        await putToApi("data_siswa", student.id || student._id, { status_promosi: "Belum" });
        Notify?.success?.(`Berhasil membatalkan kenaikan kelas ${toTitleCase(student.nama)}.`);
        await loadDataSiswa("data_siswa");
        await loadDataRiwayat("riwayat_kelas_siswa", true);
      } catch {
        Notify?.failure?.("Gagal membatalkan kenaikan kelas.");
      }
    },
  );
};

const handleRemoveStudent = (student) => {
  Confirm?.show(
    "Keluarkan Siswa",
    `Apakah Anda yakin ingin mengeluarkan ${toTitleCase(student.nama)} dari rombel ini?`,
    "Ya, Keluarkan", "Batal",
    async () => {
      try {
        await putToApi("data_siswa", student.id || student._id, { kelas: "" });
        Notify?.success?.(`Berhasil mengeluarkan ${toTitleCase(student.nama)} dari rombel.`);
        await loadDataSiswa("data_siswa");
      } catch {
        Notify?.failure?.("Gagal mengeluarkan siswa.");
      }
    },
  );
};

const handleRemoveStudentsBulk = () => {
  Confirm?.show(
    "Keluarkan Siswa Terpilih",
    `Apakah Anda yakin ingin mengeluarkan ${selectedStudentIds.value.length} siswa terpilih dari rombel ini?`,
    "Ya, Keluarkan", "Batal",
    async () => {
      isPromoting.value = true;
      let successCount = 0, failCount = 0;
      try {
        await Promise.all(
          selectedStudentIds.value.map(async (id) => {
            try { await putToApi("data_siswa", id, { kelas: "" }); successCount++; }
            catch { failCount++; }
          }),
        );
        if (successCount > 0) {
          Notify?.success?.(`Berhasil mengeluarkan ${successCount} siswa dari rombel.`);
          selectedStudentIds.value = [];
          await loadDataSiswa("data_siswa");
        }
        if (failCount > 0) Notify?.failure?.(`Gagal memproses ${failCount} siswa.`);
      } catch {
        Notify?.failure?.("Terjadi kesalahan saat memproses pengeluaran siswa.");
      } finally {
        isPromoting.value = false;
      }
    },
  );
};

// --- Add Student Modal ---
const showAddStudentModal = ref(false);
const isAddingStudents = ref(false);

const unassignedStudents = computed(() => {
  if (!Array.isArray(dataSiswa.value)) return [];
  return dataSiswa.value.filter(
    (s) => !s.kelas || s.kelas === "" || s.kelas === "-",
  );
});

const getKelasTingkat = (classId) => {
  if (!classId) return null;
  const match = dataKelas.value?.find((k) => k.id_kelas === classId || k.idKelas === classId);
  return match ? parseInt(match.tingkat) : null;
};

const handleAssignStudents = async (ids) => {
  if (!ids.length) return;
  const targetTingkat = parseInt(selectedRombel.value.tingkat);
  const anomalies = [];

  for (const studentId of ids) {
    const student = dataSiswa.value.find((s) => (s.id || s._id) === studentId);
    if (student?.kelas_db) {
      const prevTingkat = getKelasTingkat(student.kelas_db);
      if (prevTingkat !== null && targetTingkat !== prevTingkat && targetTingkat !== prevTingkat + 1) {
        anomalies.push({ nama: student.nama, prevTingkat, targetTingkat });
      }
    }
  }

  const proceed = async () => {
    isAddingStudents.value = true;
    let successCount = 0, failCount = 0;
    try {
      await Promise.all(
        ids.map(async (id) => {
          try {
            await putToApi("data_siswa", id, { kelas: selectedRombel.value.id_kelas });
            successCount++;
          } catch { failCount++; }
        }),
      );
      if (successCount > 0) {
        Notify?.success?.(`Berhasil menambahkan ${successCount} siswa ke rombel.`);
        showAddStudentModal.value = false;
        await loadDataSiswa("data_siswa", true, { tahun_pelajaran: selectedTapel.value });
      }
      if (failCount > 0) Notify?.failure?.(`Gagal memproses ${failCount} siswa.`);
    } catch {
      Notify?.failure?.("Terjadi kesalahan saat menambahkan siswa.");
    } finally {
      isAddingStudents.value = false;
    }
  };

  if (anomalies.length > 0) {
    const msg =
      `Beberapa siswa berikut terdeteksi tidak sesuai tingkatnya:\n` +
      anomalies.map((a) => `- ${toTitleCase(a.nama)} (Tingkat asal: ${a.prevTingkat} -> Target: ${a.targetTingkat})`).join("\n") +
      `\n\nApakah Anda yakin ingin tetap memasukkan mereka?`;
    Confirm?.show("Peringatan Tingkat Rombel", msg, "Ya, Lanjutkan", "Batal", proceed);
  } else {
    await proceed();
  }
};

// --- Graduation Modal ---
const showGraduationModal = ref(false);
const isGraduating = ref(false);

const handleGraduateStudents = async ({ gradYear, gradDestination }) => {
  if (!gradYear) { Notify?.failure?.("Tahun kelulusan wajib diisi."); return; }

  Confirm?.show(
    "Konfirmasi Kelulusan",
    `Apakah Anda yakin ingin meluluskan ${selectedStudentIds.value.length} siswa? Siswa akan dipindahkan ke tabel Alumni.`,
    "Ya, Luluskan", "Batal",
    async () => {
      isGraduating.value = true;
      let successCount = 0, failCount = 0;
      try {
        for (const studentId of selectedStudentIds.value) {
          const student = dataSiswa.value.find((s) => (s.id || s._id) === studentId);
          if (!student) continue;
          try {
            await postToApi("alumni", {
              nama: student.nama, foto: "",
              nis_lokal: student.nis_lokal || student["nis lokal"],
              nisn: student.nisn, nik: student.nik,
              no_kk: student.no_kk || student["no kk"] || "",
              tempat_lahir: student.tempat_lahir || student["tempat lahir"],
              tanggal_lahir: student.tanggal_lahir || student["tanggal lahir"],
              umur: student.umur,
              jenis_kelamin: student.jenis_kelamin || student["jenis kelamin"],
              status: "Lulus", thn_lulus: gradYear,
              menjutkan_ke: gradDestination || "Tidak Melanjutkan",
              alamat: student.alamat,
              no_hp: student.no_hp || student["no telepon"],
              no_kip: student.no_kip || student["no kip"],
              nama_ayah_kandung: student.nama_ayah_kandung || student["nama ayah kandung"],
              nama_ibu_kandung: student.nama_ibu_kandung || student["nama ibu kandung"],
              nama_wali: student.nama_wali || student["nama wali"],
            });
            await deleteFromApi("data_siswa", studentId);
            successCount++;
          } catch { failCount++; }
        }
        if (successCount > 0) {
          Notify?.success?.(`Berhasil meluluskan ${successCount} siswa ke Alumni.`);
          selectedStudentIds.value = [];
          showGraduationModal.value = false;
          await loadDataSiswa("data_siswa");
          clearTableSessionCache("alumni");
        }
        if (failCount > 0) Notify?.failure?.(`Gagal meluluskan ${failCount} siswa.`);
      } catch {
        Notify?.failure?.("Terjadi kesalahan saat memproses kelulusan.");
      } finally {
        isGraduating.value = false;
      }
    },
  );
};

// --- Helpers ---
const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const getJenisKelaminAbbr = (jk) => {
  if (!jk) return "-";
  const u = jk.toUpperCase();
  if (u.startsWith("L")) return "L";
  if (u.startsWith("P")) return "P";
  return jk;
};

onMounted(() => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const info = dapatkanTahunDanSemester(todayStr);
  currentTapel.value = info.tahunPelajaran;
  selectedTapel.value = info.tahunPelajaran;

  loadDataKelas("data_kelas");
  loadDataGtk("data_gtk");
  loadDataSiswa("data_siswa", true, { tahun_pelajaran: info.tahunPelajaran });
  loadDataRiwayat("riwayat_kelas_siswa");
});
</script>
