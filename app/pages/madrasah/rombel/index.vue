<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <div class="space-y-6 lg:space-y-8">
        <!-- Header Section -->
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div class="w-full lg:w-auto">
            <h2
              class="text-xl sm:text-2xl font-bold flex items-center gap-2.5"
              :style="{ color: 'var(--text-heading)' }"
            >
              <Building2 class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Data Rombel</span>
            </h2>
            <p class="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Informasi pembagian rombel, tingkat rombel, dan wali kelas masing-masing.
            </p>
          </div>

          <!-- Actions -->
          <div class="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Academic Year Dropdown -->
            <div class="flex items-center gap-2.5 w-full sm:w-auto bg-zinc-800/50 p-1.5 rounded-lg border border-zinc-700/50">
              <span class="text-[11px] sm:text-xs font-semibold text-zinc-400 ml-1.5 whitespace-nowrap">
                Tahun Pelajaran:
              </span>
              <select
                v-model="selectedTapel"
                class="h-9 w-full sm:w-auto px-2.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs sm:text-sm"
              >
                <option v-for="opt in tapelOptions" :key="opt" :value="opt">
                  {{ opt }}{{ opt === currentTapel ? " (Sekarang)" : "" }}
                </option>
              </select>
            </div>

            <!-- Admin Only Actions -->
            <template v-if="isAdmin">
              <div class="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <UiBaseButton
                  v-if="hasPromotedStudents"
                  text="Tahun Ajaran Baru"
                  :loading="isResetting"
                  :disabled="isResetting"
                  class="w-full sm:w-auto"
                  @click="handleResetPromotions"
                >
                  <template #icon>
                    <RefreshCw class="w-4 h-4 shrink-0" />
                  </template>
                </UiBaseButton>

                <UiBaseButton
                  text="Tambah Rombel"
                  class="w-full sm:w-auto"
                  @click="openCreateModal"
                >
                  <template #icon>
                    <Plus class="w-4 h-4 shrink-0" />
                  </template>
                </UiBaseButton>
              </div>
            </template>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="pt-2">
          <p
            v-if="isLoading"
            class="text-center text-zinc-500 text-sm sm:text-base font-semibold py-12"
          >
            Memuat data rombel secara realtime...
          </p>

          <div
            v-else-if="sortedDataKelas.length === 0"
            class="text-center py-16 px-4 bg-zinc-800/10 rounded-xl border border-zinc-800"
          >
            <Database
              class="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 text-zinc-600"
              stroke-width="1.5"
            />
            <p class="text-zinc-300 text-base sm:text-lg font-medium">
              Tidak ada data rombel ditemukan
            </p>
            <p class="text-zinc-500 text-xs sm:text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              Pastikan tabel data_kelas di database D1 sudah terisi.
            </p>
          </div>

          <!-- Class Grid List -->
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
          >
            <div
              v-for="(item, index) in sortedDataKelas"
              :key="item.id_kelas || index"
              @click="navigateToDetail(item)"
              class="rounded-xl border p-4 sm:p-5 bg-zinc-800/30 border-zinc-700/40 hover:border-emerald-500/40 transition-all duration-200 group cursor-pointer hover:bg-zinc-800/60 shadow-sm hover:shadow-md"
            >
              <div class="flex items-start gap-3 sm:gap-4">
                <!-- Class Badge -->
                <div
                  class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold"
                >
                  <span class="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Tkt</span>
                  <span class="text-lg sm:text-xl leading-none mt-0.5">{{ item.tingkat || "-" }}</span>
                </div>

                <!-- Class Details -->
                <div class="flex-1 min-w-0">
                  <h3
                    class="font-bold text-base sm:text-lg text-zinc-100 truncate group-hover:text-emerald-400 transition-colors"
                  >
                    {{ item.nama_kelas || "-" }}
                  </h3>

                  <div class="flex flex-col gap-2 mt-2.5 text-xs text-zinc-400">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span class="text-zinc-500 shrink-0">Wali Kelas:</span>
                      <span
                        class="bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px] w-fit font-medium truncate max-w-full"
                      >
                        {{ getTeacherName(item.wali_kelas) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-zinc-500 shrink-0">Jumlah Siswa:</span>
                      <span class="text-zinc-300 font-medium">
                        {{ isLoadingSiswa ? "..." : getStudentCount(item.id_kelas) }} siswa
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CRUD Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="modalMode === 'create' ? 'Tambah Data Rombel' : 'Edit Data Rombel'"
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
import { Database, Building2, Plus, RefreshCw } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { putToApi } from "~/utils/api";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";
import CrudModal from "~/components/ui/CrudModal.vue";

const router = useRouter();

const {
  cardData: dataKelas,
  isLoading,
  loadData: loadDataKelas,
  refreshData: refreshDataKelas,
} = useTableData();

const sortedDataKelas = computed(() => {
  if (!Array.isArray(dataKelas.value)) return [];
  return [...dataKelas.value].sort((a, b) => {
    const levelA = Number(a.tingkat) || 0;
    const levelB = Number(b.tingkat) || 0;
    if (levelA !== levelB) return levelA - levelB;
    return (a.nama_kelas || "").localeCompare(b.nama_kelas || "");
  });
});

const { cardData: dataGtk, loadData: loadDataGtk } = useTableData();
const {
  cardData: dataSiswa,
  isLoading: isLoadingSiswa,
  loadData: loadDataSiswa,
} = useTableData();

const { isAdmin, isSaving, createItem, updateItem } = useCrud(
  "data_kelas",
  () => refreshDataKelas("data_kelas"),
);
const { Notify, Confirm } = useNotiflix();

// Academic Year State
const selectedTapel = ref("");
const currentTapel = ref("");
const { cardData: dataRiwayat, loadData: loadDataRiwayat } = useTableData();

const tapelOptions = computed(() => {
  const years = new Set();
  if (currentTapel.value) {
    years.add(currentTapel.value);
  } else {
    const todayStr = new Date().toISOString().substring(0, 10);
    const currentInfo = dapatkanTahunDanSemester(todayStr);
    years.add(currentInfo.tahunPelajaran);
  }
  if (Array.isArray(dataRiwayat.value)) {
    dataRiwayat.value.forEach((r) => {
      if (r.tahun_pelajaran) years.add(r.tahun_pelajaran);
    });
  }
  return Array.from(years).sort((a, b) => a.localeCompare(b));
});

// CRUD Modal state
const showModal = ref(false);
const modalMode = ref("create");
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

const getStudentCount = (classId) => {
  if (!Array.isArray(dataSiswa.value)) return 0;
  return dataSiswa.value.filter((s) => s.kelas === classId).length;
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
  {
    key: "id_kelas",
    label: "ID Rombel",
    required: modalMode.value === "edit",
    disabled: true,
    placeholder: modalMode.value === "create" ? "Otomatis dibuat oleh sistem" : "",
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

const navigateToDetail = (item) => {
  router.push(`/akademik/rombel/${item.id_kelas}`);
};

const openCreateModal = () => {
  modalMode.value = "create";
  editingItem.value = {};
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  if (modalMode.value === "create") {
    const cleanTingkat = String(formData.tingkat || "").trim();
    const cleanNama = String(formData.nama_kelas || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const generatedId = `kls_${cleanTingkat}_${cleanNama}`;

    const isDuplicate = dataKelas.value.some((k) => k.id_kelas === generatedId);
    if (isDuplicate) {
      Notify?.failure?.(
        `Rombel dengan Tingkat ${cleanTingkat} dan Nama ${formData.nama_kelas} sudah terdaftar.`,
      );
      return;
    }

    formData.id_kelas = generatedId;
    const success = await createItem(formData);
    if (success) showModal.value = false;
  } else {
    const id = editingItem.value._id;
    const success = await updateItem(id, formData);
    if (success) showModal.value = false;
  }
};

// Admin Reset Promotion
const hasPromotedStudents = computed(() => {
  if (!Array.isArray(dataSiswa.value)) return false;
  return dataSiswa.value.some((s) => s.status_promosi === "Sudah");
});

const isResetting = ref(false);
const handleResetPromotions = () => {
  Confirm?.show(
    "Mulai Tahun Ajaran Baru",
    "Apakah Anda yakin ingin memulai tahun ajaran baru? Semua status kenaikan kelas siswa akan disetel ulang (reset).",
    "Ya, Mulai",
    "Batal",
    async () => {
      isResetting.value = true;
      try {
        await putToApi("data_siswa", "reset_promosi", {});
        Notify?.success?.("Berhasil mereset status kenaikan kelas seluruh siswa.");
        await loadDataSiswa("data_siswa");
      } catch (err) {
        Notify?.failure?.("Gagal mereset status kenaikan kelas.");
        console.error(err);
      } finally {
        isResetting.value = false;
      }
    },
  );
};

onMounted(() => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentInfo = dapatkanTahunDanSemester(todayStr);
  currentTapel.value = currentInfo.tahunPelajaran;
  selectedTapel.value = currentInfo.tahunPelajaran;

  loadDataKelas("data_kelas");
  loadDataGtk("data_gtk");
  loadDataSiswa("data_siswa");
  loadDataRiwayat("riwayat_kelas_siswa");
});
</script>
