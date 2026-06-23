<template>
  <div class="min-h-screen">
    <div class="page-layout pb-24">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <h2
              class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2"
            >
              <CalendarCheck class="w-7 h-7 text-emerald-400" />
              Alokasi Jam Mengajar
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              Atur penugasan guru pengajar untuk mata pelajaran di kelas
              tertentu sesuai kurikulum matriks
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="pt-2">
        <p
          v-if="isLoading"
          class="text-center text-zinc-500 text-lg font-semibold py-12"
        >
          Memuat data alokasi jam mengajar...
        </p>

        <div
          v-else-if="kelasData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800"
        >
          <Database
            class="w-16 h-16 mx-auto mb-4 text-zinc-600"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 text-lg font-medium">
            Tidak ada data rombongan belajar (kelas) ditemukan
          </p>
          <p class="text-zinc-500 text-sm mt-1">
            Silakan tambahkan rombel kelas terlebih dahulu sebelum mengatur
            alokasi jam mengajar.
          </p>
        </div>

        <div
          v-else-if="kurikulumData.length === 0"
          class="text-center py-16 bg-zinc-800/10 rounded-xl border border-zinc-800"
        >
          <Database
            class="w-16 h-16 mx-auto mb-4 text-zinc-600"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 text-lg font-medium">
            Tidak ada data kurikulum ditemukan
          </p>
          <p class="text-zinc-500 text-sm mt-1">
            Silakan tambahkan data kurikulum mata pelajaran terlebih dahulu.
          </p>
        </div>

        <!-- Matrix Table -->
        <div
          v-else
          class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
        >
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr
                  class="border-b border-zinc-800 bg-zinc-950/40 text-[11px] font-bold tracking-wider text-zinc-400 uppercase"
                >
                  <th class="p-4 w-12 text-center border-r border-zinc-800/60">
                    No
                  </th>
                  <th class="p-4 min-w-[240px] border-r border-zinc-800/60">
                    Mata Pelajaran
                  </th>
                  <th
                    v-for="k in sortedClasses"
                    :key="k.id_kelas"
                    class="p-4 text-center border-r border-zinc-800/60 min-w-[180px] text-zinc-200"
                  >
                    {{ k.nama_kelas || k.id_kelas }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                <tr
                  v-for="(subjectName, idx) in uniqueSubjects"
                  :key="subjectName"
                  class="hover:bg-zinc-900/10 transition-colors"
                >
                  <!-- Index -->
                  <td
                    class="p-4 text-center text-sm font-medium text-zinc-500 border-r border-zinc-800/60"
                  >
                    {{ idx + 1 }}
                  </td>

                  <!-- Subject Name -->
                  <td
                    class="p-4 border-r border-zinc-800/60 font-semibold text-zinc-200 text-sm"
                  >
                    {{ subjectName }}
                  </td>

                  <!-- Class Columns -->
                  <td
                    v-for="k in sortedClasses"
                    :key="k.id_kelas"
                    class="p-3 text-center border-r border-zinc-800/60"
                  >
                    <template v-if="getKurikulumForCell(subjectName, k)">
                      <div
                        class="flex flex-col gap-1.5 items-center justify-center"
                      >
                        <!-- Select dropdown for Admin -->
                        <select
                          v-if="isAdmin"
                          v-model="
                            localAllocations[
                              `${k.id_kelas}_${getKurikulumForCell(subjectName, k).id}`
                            ]
                          "
                          class="w-full px-2 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/50 text-zinc-200 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
                        >
                          <option value="">-- Pilih Guru --</option>
                          <option
                            v-for="g in guruOptions"
                            :key="g.value"
                            :value="g.value"
                          >
                            {{ g.label }}
                          </option>
                        </select>

                        <!-- Plain text for non-Admin -->
                        <span
                          v-else
                          class="text-xs font-semibold text-zinc-300 text-center line-clamp-1"
                        >
                          {{
                            getGuruName(
                              localAllocations[
                                `${k.id_kelas}_${getKurikulumForCell(subjectName, k).id}`
                              ],
                            ) || "-"
                          }}
                        </span>

                        <!-- Hour count badge from curriculum -->
                        <span
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 font-mono"
                        >
                          {{ getKurikulumForCell(subjectName, k).alokasi_jam }}
                          JP
                        </span>
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-zinc-600 text-sm">-</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Floating Save Changes Bar (Admin Only) -->
      <div
        v-if="isAdmin && hasChanges"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 border border-emerald-500/30 px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl animate-fade-in"
      >
        <div class="flex flex-col">
          <span class="text-xs font-bold text-zinc-200"
            >Perubahan Alokasi Guru</span
          >
          <span class="text-[10px] text-zinc-400"
            >Ada perubahan alokasi jam mengajar yang belum disimpan.</span
          >
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="discardChanges"
            :disabled="isSaving"
            class="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            Batal
          </button>
          <button
            @click="saveChanges"
            :disabled="isSaving"
            class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
          >
            <Loader2 v-if="isSaving" class="w-3 h-3 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            {{ isSaving ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  CalendarCheck,
  Database,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { postToApi, putToApi, deleteFromApi } from "~/utils/api";

const { Notify } = useNotiflix();

// Core DB datasets
const {
  cardData: alokasiData,
  isLoading: isAlokasiLoading,
  loadData: loadAlokasi,
  refreshData: refreshAlokasi,
} = useTableData();
const {
  cardData: kelasData,
  isLoading: isKelasLoading,
  loadData: loadKelas,
} = useTableData();
const {
  cardData: kurikulumData,
  isLoading: isKurikulumLoading,
  loadData: loadKurikulum,
} = useTableData();
const {
  cardData: gtkData,
  isLoading: isGtkLoading,
  loadData: loadGtk,
} = useTableData();

// Combined loading state
const isLoading = computed(
  () =>
    isAlokasiLoading.value ||
    isKelasLoading.value ||
    isKurikulumLoading.value ||
    isGtkLoading.value,
);

// Admin validation
const { isAdmin } = useCrud("alokasi_jam");

// Saving state
const isSaving = ref(false);

// Local state for allocations matrix
const localAllocations = ref({});
const initialAllocationsJson = ref("{}");

// Sort classes naturally by grade (tingkat) and then by name
const sortedClasses = computed(() => {
  return [...(kelasData.value || [])].sort((a, b) => {
    const levelA = Number(a.tingkat) || 0;
    const levelB = Number(b.tingkat) || 0;
    if (levelA !== levelB) return levelA - levelB;
    const nameA = a.nama_kelas || a.id_kelas || "";
    const nameB = b.nama_kelas || b.id_kelas || "";
    return nameA.localeCompare(nameB, undefined, { numeric: true });
  });
});

// Extract unique subject names from curriculum, sorted alphabetically
const uniqueSubjects = computed(() => {
  const subjects = new Set();
  if (kurikulumData.value) {
    kurikulumData.value.forEach((m) => {
      if (m.nama_mapel) subjects.add(m.nama_mapel);
    });
  }
  return Array.from(subjects).sort((a, b) => a.localeCompare(b));
});

// Format teachers list as dropdown options
const guruOptions = computed(() => {
  return (gtkData.value || [])
    .map((g) => ({ value: Number(g.id), label: g.nama_lengkap }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

// Lookup mapping helper for cells matching subject and class tingkat
const getKurikulumForCell = (subjectName, classObj) => {
  if (!kurikulumData.value || !classObj) return null;
  return kurikulumData.value.find(
    (m) =>
      m.nama_mapel === subjectName &&
      String(m.tingkat) === String(classObj.tingkat),
  );
};

// Get teacher name by ID
const getGuruName = (id) => {
  if (!id) return "";
  const guru = (gtkData.value || []).find((g) => Number(g.id) === Number(id));
  return guru ? guru.nama_lengkap : `Guru ID: ${id}`;
};

// Sync local matrix state from database snapshot
const loadLocalState = () => {
  const state = {};
  if (alokasiData.value) {
    alokasiData.value.forEach((item) => {
      const key = `${item.kelas_id}_${item.mapel_id}`;
      state[key] = item.guru_id ? Number(item.guru_id) : "";
    });
  }
  localAllocations.value = state;
  initialAllocationsJson.value = JSON.stringify(state);
};

// Detect if anything has been edited in matrix
const hasChanges = computed(() => {
  return (
    JSON.stringify(localAllocations.value) !== initialAllocationsJson.value
  );
});

// Populate matrix on initial load or updates
watch(
  alokasiData,
  (newData) => {
    if (newData && !hasChanges.value) {
      loadLocalState();
    }
  },
  { deep: true, immediate: true },
);

// Reset changes back to database values
const discardChanges = () => {
  loadLocalState();
  Notify.info("Perubahan alokasi jam mengajar dibatalkan.");
};

// Batch save allocations
const saveChanges = async () => {
  isSaving.value = true;

  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  // Build lookup mapping of existing database entries
  const dbLookup = {};
  (alokasiData.value || []).forEach((item) => {
    dbLookup[`${item.kelas_id}_${item.mapel_id}`] = item;
  });

  // Check all possible cells (curriculum entries per class)
  uniqueSubjects.value.forEach((subjectName) => {
    sortedClasses.value.forEach((classObj) => {
      const m = getKurikulumForCell(subjectName, classObj);
      if (!m) return; // subject not taught in this grade

      const key = `${classObj.id_kelas}_${m.id}`;
      const selectedGuruId = localAllocations.value[key];
      const dbRecord = dbLookup[key];

      if (selectedGuruId) {
        const guruIdNum = Number(selectedGuruId);
        if (!dbRecord) {
          // Create new record
          toCreate.push({
            kelas_id: classObj.id_kelas,
            mapel_id: Number(m.id),
            guru_id: guruIdNum,
            jam_mengajar: Number(m.alokasi_jam),
          });
        } else if (Number(dbRecord.guru_id) !== guruIdNum) {
          // Update existing record
          toUpdate.push({
            id: dbRecord.id,
            data: {
              kelas_id: classObj.id_kelas,
              mapel_id: Number(m.id),
              guru_id: guruIdNum,
              jam_mengajar: Number(m.alokasi_jam),
            },
          });
        }
      } else {
        // Teacher cleared/removed
        if (dbRecord) {
          toDelete.push(dbRecord.id);
        }
      }
    });
  });

  try {
    const deletePromises = toDelete.map((id) =>
      deleteFromApi("alokasi_jam", id),
    );
    const updatePromises = toUpdate.map((item) =>
      putToApi("alokasi_jam", item.id, item.data),
    );
    const createPromises = toCreate.map((data) =>
      postToApi("alokasi_jam", data),
    );

    await Promise.all([
      ...deletePromises,
      ...updatePromises,
      ...createPromises,
    ]);

    Notify.success("Semua alokasi jam mengajar berhasil disimpan!");
    await refreshAlokasi("alokasi_jam");
    loadLocalState();
  } catch (err) {
    console.error("Gagal menyimpan alokasi jam:", err);
    Notify.failure("Gagal menyimpan beberapa alokasi. Silakan coba kembali.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadAlokasi("alokasi_jam");
  loadKelas("data_kelas");
  loadKurikulum("kurikulum");
  loadGtk("data_gtk");
});
</script>

<style scoped>
/* Floating bar entrance animation */
.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 1.5rem);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
