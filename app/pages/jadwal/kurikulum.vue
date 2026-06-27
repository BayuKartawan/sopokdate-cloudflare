<template>
  <div class="min-h-screen">
    <div class="page-layout pb-24">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <h2
              class="text-xl sm:text-2xl font-bold flex items-center gap-2"
              :style="{ color: 'var(--text-heading)' }"
            >
              <BookOpen
                v-if="activeTab === 'kurikulum'"
                class="w-7 h-7 text-emerald-650 dark:text-emerald-400"
              />
              <CalendarRange v-else class="w-7 h-7 text-emerald-650 dark:text-emerald-400" />
              {{
                activeTab === "kurikulum"
                  ? "Kurikulum Pelajaran"
                  : "Mapping JP Mingguan"
              }}
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              {{
                activeTab === "kurikulum"
                  ? "Kelola mata pelajaran dan batasan alokasi jam mengajar dalam satu minggu langsung melalui tabel matriks"
                  : "Simulasikan dan visualisasikan total jam pelajaran (JP) dalam satu minggu secara interaktif"
              }}
            </p>
          </div>

          <!-- Tambah Mapel Button (Admin Only) -->
          <div v-if="isAdmin && activeTab === 'kurikulum'" class="ml-auto">
            <button
              @click="addSubjectRow"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/20"
            >
              <Plus class="w-4 h-4" />
              Tambah Mapel
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="flex border-b border-zinc-800 mb-6">
        <button
          @click="activeTab = 'kurikulum'"
          :class="[
            activeTab === 'kurikulum'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
        >
          <BookOpen class="w-4 h-4" />
          Alokasi Kurikulum
        </button>
        <button
          @click="activeTab = 'mapping'"
          :class="[
            activeTab === 'mapping'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
        >
          <CalendarRange class="w-4 h-4" />
          Mapping JP Mingguan
        </button>
      </div>

      <!-- Main Content -->
      <div class="pt-2">
        <template v-if="activeTab === 'kurikulum'">
          <p
            v-if="isLoading"
            class="text-center text-zinc-500 text-lg font-semibold py-12"
          >
            Memuat data kurikulum...
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
              alokasi kurikulum.
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
                    <th
                      class="p-4 w-12 text-center border-r border-zinc-800/60"
                    >
                      No
                    </th>
                    <th class="p-4 min-w-[220px] border-r border-zinc-800/60">
                      Nama Mata Pelajaran
                    </th>
                    <th class="p-4 w-40 border-r border-zinc-800/60">
                      Kode Abreviasi
                    </th>
                    <th
                      v-for="t in tingkatList"
                      :key="t"
                      class="p-4 text-center border-r border-zinc-800/60 min-w-[100px]"
                    >
                      Kelas {{ t }} (JP)
                    </th>
                    <th v-if="isAdmin" class="p-4 w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60">
                  <tr
                    v-for="(row, idx) in matrixRows"
                    :key="row.rowId"
                    :class="[
                      editingRowId === row.rowId
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-y border-emerald-500/30'
                        : 'hover:bg-zinc-900/10',
                      'transition-colors',
                    ]"
                  >
                    <!-- Index -->
                    <td
                      class="p-4 text-center text-sm font-medium text-zinc-500 border-r border-zinc-800/60"
                    >
                      {{ idx + 1 }}
                    </td>

                    <!-- Subject Name -->
                    <td class="p-3 border-r border-zinc-800/60">
                      <input
                        v-if="isAdmin && editingRowId === row.rowId"
                        type="text"
                        v-model="row.nama_mapel"
                        placeholder="Contoh: Matematika"
                        class="w-full px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
                      />
                      <span
                        v-else
                        class="text-zinc-200 text-sm font-semibold px-3 py-1.5 block"
                      >
                        {{ row.nama_mapel || "(Belum diisi)" }}
                      </span>
                    </td>

                    <!-- Subject Code -->
                    <td class="p-3 border-r border-zinc-800/60">
                      <input
                        v-if="isAdmin && editingRowId === row.rowId"
                        type="text"
                        v-model="row.kode_mapel"
                        placeholder="Contoh: MAT"
                        @input="
                          row.kode_mapel = $event.target.value.toUpperCase()
                        "
                        class="w-full px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <span
                        v-else
                        class="text-zinc-400 text-sm font-mono px-3 py-1.5 block"
                      >
                        {{ row.kode_mapel || "-" }}
                      </span>
                    </td>

                    <!-- Hourly allocations per Grade Level -->
                    <td
                      v-for="t in tingkatList"
                      :key="t"
                      class="p-3 text-center border-r border-zinc-800/60"
                    >
                      <input
                        v-if="isAdmin && editingRowId === row.rowId"
                        type="number"
                        min="0"
                        :value="getCellHours(row, t)"
                        @input="onHoursInput(row, t, $event.target.value)"
                        placeholder="0"
                        class="w-16 mx-auto px-2 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-zinc-100 text-sm text-center font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <span
                        v-else
                        class="text-zinc-300 text-sm font-bold block text-center"
                      >
                        {{ getCellHours(row, t) || "-" }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td v-if="isAdmin" class="p-3 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          v-if="editingRowId === row.rowId"
                          @click="editingRowId = null"
                          class="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title="Selesai Edit"
                        >
                          <Check class="w-4 h-4" />
                        </button>
                        <button
                          v-else
                          @click="editingRowId = row.rowId"
                          class="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title="Edit Baris"
                        >
                          <Pencil class="w-4 h-4" />
                        </button>
                        <button
                          @click="deleteSubjectRow(row, idx)"
                          class="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Hapus Baris"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <!-- Total JP per Kelas Row -->
                  <tr
                    v-if="matrixRows.length > 0"
                    class="bg-zinc-950/30 border-t border-zinc-800 font-semibold"
                  >
                    <td
                      colspan="3"
                      class="p-4 text-right text-sm font-semibold text-zinc-400 border-r border-zinc-800/60"
                    >
                      Total JP / Kelas (1 Minggu)
                    </td>
                    <td
                      v-for="t in tingkatList"
                      :key="t"
                      class="p-4 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-800/60"
                    >
                      {{ getTotalHours(t) }}
                    </td>
                    <td v-if="isAdmin" class="p-4"></td>
                  </tr>

                  <tr v-if="matrixRows.length === 0">
                    <td
                      :colspan="4 + tingkatList.length + (isAdmin ? 1 : 0)"
                      class="p-12 text-center text-zinc-500 italic text-sm"
                    >
                      Belum ada data mata pelajaran. Klik tombol "Tambah Mapel"
                      di atas untuk memulai.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'mapping'">
          <!-- Dashboard Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <!-- Total JP Card -->
            <div
              class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-lg flex items-center gap-4"
            >
              <div class="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Clock class="w-6 h-6" />
              </div>
              <div>
                <p
                  class="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                >
                  Total JP Terjadwal
                </p>
                <h3 class="text-2xl font-bold text-[var(--text-heading)] mt-1">
                  {{ totalSelectedJP }}
                  <span class="text-sm font-normal text-zinc-400">JP</span>
                </h3>
              </div>
            </div>

            <!-- Occupancy Card -->
            <div
              class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-center"
            >
              <div class="flex justify-between items-center mb-2">
                <p
                  class="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                >
                  Keterisian Slot Mingguan
                </p>
                <span class="text-xs font-bold text-emerald-650 dark:text-emerald-400"
                  >{{ occupancyPercentage }}%</span
                >
              </div>
              <div class="w-full bg-zinc-850 rounded-full h-2">
                <div
                  class="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${occupancyPercentage}%` }"
                ></div>
              </div>
              <p class="text-[10px] text-zinc-500 mt-1.5">
                {{ totalSelectedJP }} dari 48 total slot JP dalam seminggu
              </p>
            </div>

            <!-- Average / Action Card -->
            <div
              class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 shadow-lg flex items-center justify-between gap-4"
            >
              <div>
                <p
                  class="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                >
                  Rata-rata JP Harian
                </p>
                <h3 class="text-2xl font-bold text-[var(--text-heading)] mt-1">
                  {{ averageJPHarian }}
                  <span class="text-sm font-normal text-zinc-400"
                    >JP / hari</span
                  >
                </h3>
              </div>
              <button
                @click="resetSimulator"
                :disabled="totalSelectedJP === 0"
                class="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700/50"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                Reset Grid
              </button>
            </div>
          </div>

          <!-- Interactive Grid Table -->
          <div
            class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl select-none mb-6"
          >
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr
                    class="border-b border-zinc-800 bg-zinc-950/40 text-[11px] font-bold tracking-wider text-zinc-400 uppercase"
                  >
                    <th
                      class="p-4 w-28 text-center border-r border-zinc-800/60"
                    >
                      Jam Ke
                    </th>
                    <th
                      v-for="day in days"
                      :key="day"
                      class="p-4 text-center border-r border-zinc-800/60 min-w-[120px]"
                    >
                      {{ day }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60">
                  <tr
                    v-for="hour in maxHours"
                    :key="hour"
                    class="hover:bg-zinc-900/10 transition-colors"
                  >
                    <!-- Hour Label -->
                    <td
                      class="p-4 text-center text-sm font-bold text-zinc-400 bg-zinc-950/20 border-r border-zinc-800/60"
                    >
                      Jam ke-{{ hour }}
                    </td>

                    <!-- Cells for days -->
                    <td
                      v-for="day in days"
                      :key="day"
                      class="p-2 text-center border-r border-zinc-800/60 transition-all relative animate-none"
                    >
                      <div
                        @mousedown="startDrag(day, hour)"
                        @mouseenter="enterDrag(day, hour)"
                        :class="[
                          isSlotSelected(day, hour)
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg border-emerald-400/20 scale-[1.02]'
                            : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/50 hover:bg-zinc-850 hover:text-zinc-400 hover:border-zinc-700/50',
                          'w-full min-h-[52px] rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none',
                        ]"
                      >
                        <template v-if="isSlotSelected(day, hour)">
                          <Clock class="w-4 h-4 text-emerald-100 mb-0.5" />
                          <span class="text-xs font-bold tracking-wide"
                            >1 JP</span
                          >
                        </template>
                        <template v-else>
                          <span
                            class="text-xs font-medium opacity-0 hover:opacity-100 transition-opacity duration-200"
                            >+ JP</span
                          >
                        </template>
                      </div>
                    </td>
                  </tr>

                  <!-- Total JP Harian Row -->
                  <tr
                    class="bg-zinc-950/30 border-t border-zinc-800 font-semibold"
                  >
                    <td
                      class="p-4 text-center text-xs font-bold text-zinc-400 border-r border-zinc-800/60 uppercase"
                    >
                      Total JP Harian
                    </td>
                    <td
                      v-for="day in days"
                      :key="day"
                      class="p-4 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-800/60"
                    >
                      {{ getDailyTotal(day) }} JP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Instructions Card -->
          <div
            class="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-4 flex gap-3 text-zinc-400 text-xs"
          >
            <Sparkles class="w-5 h-5 text-emerald-605 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <p class="font-semibold text-zinc-300">Tips Simulasi</p>
              <p>
                Anda dapat mengklik satu kotak untuk mengaktifkan/menonaktifkan
                Jam Pelajaran. Anda juga dapat menekan klik kiri mouse dan
                menggeser (drag) kursor ke kotak lain untuk memilih atau
                menghapus pilihan beberapa slot JP secara cepat.
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Floating Save Changes Bar (Admin Only) -->
      <div
        v-if="isAdmin && hasChanges && activeTab === 'kurikulum'"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 border border-emerald-500/30 px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl animate-fade-in"
      >
        <div class="flex flex-col">
          <span class="text-xs font-bold text-zinc-200"
            >Perubahan Kurikulum</span
          >
          <span class="text-[10px] text-zinc-400"
            >Ada perubahan yang belum disimpan ke database D1.</span
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
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import {
  BookOpen,
  Database,
  Plus,
  Trash2,
  Loader2,
  Save,
  RotateCcw,
  Pencil,
  Check,
  CalendarRange,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { postToApi, putToApi, deleteFromApi } from "~/utils/api";

// Tab selection state
const activeTab = ref("kurikulum");

// Days and max hours for simulator
const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const maxHours = 8;

// Simulator State
const selectedSlots = ref({}); // key: 'Day-Hour', value: boolean
const isDragging = ref(false);
const dragMode = ref(null); // 'select' | 'deselect'

const isSlotSelected = (day, hour) => {
  return !!selectedSlots.value[`${day}-${hour}`];
};

const startDrag = (day, hour) => {
  isDragging.value = true;
  const key = `${day}-${hour}`;
  const nextState = !selectedSlots.value[key];
  selectedSlots.value[key] = nextState;
  dragMode.value = nextState ? "select" : "deselect";
};

const enterDrag = (day, hour) => {
  if (!isDragging.value) return;
  const key = `${day}-${hour}`;
  selectedSlots.value[key] = dragMode.value === "select";
};

const stopDrag = () => {
  isDragging.value = false;
  dragMode.value = null;
};

// Register/Unregister global mouse up event listeners for grid drag selection
onMounted(() => {
  window.addEventListener("mouseup", stopDrag);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", stopDrag);
});

// Statistics Calculations
const totalSelectedJP = computed(() => {
  return Object.values(selectedSlots.value).filter(Boolean).length;
});

const occupancyPercentage = computed(() => {
  const totalSlots = days.length * maxHours; // 48
  return Math.round((totalSelectedJP.value / totalSlots) * 100) || 0;
});

const averageJPHarian = computed(() => {
  const avg = totalSelectedJP.value / days.length;
  return Number(avg.toFixed(1));
});

const getDailyTotal = (day) => {
  let count = 0;
  for (let hour = 1; hour <= maxHours; hour++) {
    if (selectedSlots.value[`${day}-${hour}`]) {
      count++;
    }
  }
  return count;
};

const resetSimulator = () => {
  selectedSlots.value = {};
};

const { Notify, Confirm } = useNotiflix();

// Core DB datasets
const {
  cardData: kurikulumData,
  isLoading: isKurikulumLoading,
  loadData: loadKurikulum,
  refreshData: refreshKurikulum,
} = useTableData();
const {
  cardData: kelasData,
  isLoading: isKelasLoading,
  loadData: loadKelas,
} = useTableData();

// Combined loading state
const isLoading = computed(
  () => isKurikulumLoading.value || isKelasLoading.value,
);

// Get Admin role
const { isAdmin } = useCrud("kurikulum");

// Saving state
const isSaving = ref(false);

// Active editing row ID
const editingRowId = ref(null);

// Local state for interactive matrix
const matrixRows = ref([]);
const initialMatrixRowsJson = ref("[]"); // for change detection

// Dynamically compute unique grade levels (tingkat) from both classes and curriculum tables
const tingkatList = computed(() => {
  const levels = new Set();
  if (kelasData.value) {
    kelasData.value.forEach((k) => {
      if (k.tingkat) levels.add(k.tingkat);
    });
  }
  if (kurikulumData.value) {
    kurikulumData.value.forEach((m) => {
      if (m.tingkat) levels.add(m.tingkat);
    });
  }
  // Natural sorting for levels
  return Array.from(levels).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
});

// Group flat kurikulum records into unique subject matrix rows
const loadMatrixData = () => {
  if (!kurikulumData.value || kurikulumData.value.length === 0) {
    matrixRows.value = [];
    initialMatrixRowsJson.value = JSON.stringify([]);
    return;
  }

  const grouped = {};

  kurikulumData.value.forEach((item) => {
    const name = item.nama_mapel;
    if (!grouped[name]) {
      grouped[name] = {
        rowId: `db_${name}`,
        nama_mapel: name,
        kode_mapel: item.kode_mapel || "",
        hours: {},
      };

      // Initialize all levels with 0 alokasi_jam
      tingkatList.value.forEach((t) => {
        grouped[name].hours[t] = {
          alokasi_jam: 0,
        };
      });
    }

    if (item.tingkat) {
      grouped[name].hours[item.tingkat] = {
        id: item.id,
        alokasi_jam: item.alokasi_jam || 0,
      };
    }

    // Keep non-empty subject code if encountered
    if (item.kode_mapel && !grouped[name].kode_mapel) {
      grouped[name].kode_mapel = item.kode_mapel;
    }
  });

  const rows = Object.values(grouped);
  // Sort alphabetically by subject name
  rows.sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel));

  matrixRows.value = rows;
  initialMatrixRowsJson.value = JSON.stringify(rows);
};

// Check for any edits by comparing matrix JSON to initial state
const hasChanges = computed(() => {
  return JSON.stringify(matrixRows.value) !== initialMatrixRowsJson.value;
});

// Populate matrix on load or updates
watch(
  [kurikulumData, kelasData],
  ([newKurikulum, newKelas]) => {
    if (newKelas && newKelas.length > 0 && !hasChanges.value) {
      loadMatrixData();
    }
  },
  { deep: true, immediate: true },
);

// Safe cell hours accessor to prevent TypeErrors during loading states
const getCellHours = (row, t) => {
  if (!row.hours || !row.hours[t]) return "";
  const val = row.hours[t].alokasi_jam;
  return val === 0 ? "" : val;
};

// Calculate total hours for a grade level
const getTotalHours = (t) => {
  return matrixRows.value.reduce((sum, row) => {
    const hours = row.hours?.[t]?.alokasi_jam || 0;
    return sum + hours;
  }, 0);
};

// Format numeric inputs properly on typing and ensure key exists
const onHoursInput = (row, t, val) => {
  if (!row.hours) row.hours = {};
  if (!row.hours[t]) {
    row.hours[t] = { alokasi_jam: 0 };
  }
  const parsed = parseInt(val, 10);
  row.hours[t].alokasi_jam = isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

// Add a new empty row to matrix table
const addSubjectRow = () => {
  const tempId = `temp_${Date.now()}_${Math.random()}`;
  const newRow = {
    rowId: tempId,
    nama_mapel: "",
    kode_mapel: "",
    hours: {},
  };

  tingkatList.value.forEach((t) => {
    newRow.hours[t] = {
      alokasi_jam: 0,
    };
  });

  matrixRows.value.push(newRow);

  // Auto-edit newly added row
  editingRowId.value = tempId;
};

// Remove a subject row with a confirmation check if there are database entries
const deleteSubjectRow = (row, index) => {
  const hasDbRecords =
    row.hours && Object.values(row.hours).some((h) => h && h.id !== undefined);

  if (hasDbRecords) {
    Confirm.show(
      "Hapus Mata Pelajaran",
      `Apakah Anda yakin ingin menghapus "${row.nama_mapel || "mapel ini"}" dari seluruh tingkat? Ini juga akan menghapus data guru pengajar (alokasi jam) dan jadwal pelajaran terkait.`,
      "Ya, Hapus",
      "Batal",
      () => {
        matrixRows.value.splice(index, 1);
      },
      () => {},
    );
  } else {
    matrixRows.value.splice(index, 1);
  }
};

// Reset matrix table back to database snapshot
const discardChanges = () => {
  loadMatrixData();
  editingRowId.value = null;
  Notify.info("Perubahan kurikulum dibatalkan.");
};

// Input validation
const validateMatrix = () => {
  const names = new Set();
  for (let i = 0; i < matrixRows.value.length; i++) {
    const row = matrixRows.value[i];
    const name = row.nama_mapel.trim();
    if (!name) {
      Notify.failure(
        `Baris ke-${i + 1}: Nama mata pelajaran tidak boleh kosong.`,
      );
      return false;
    }
    if (names.has(name.toLowerCase())) {
      Notify.failure(`Mata pelajaran "${row.nama_mapel}" terduplikasi.`);
      return false;
    }
    names.add(name.toLowerCase());
  }
  return true;
};

// Batch save modifications to Cloudflare D1
const saveChanges = async () => {
  if (!validateMatrix()) return;

  isSaving.value = true;

  const toDelete = [];
  const toUpdate = [];
  const toCreate = [];

  const dbRecords = kurikulumData.value || [];

  // 1. Find deleted records (existed in DB but are no longer in matrix rows with hours > 0)
  dbRecords.forEach((rec) => {
    const stillExists = matrixRows.value.some(
      (row) =>
        row.hours &&
        Object.values(row.hours).some(
          (h) => h && h.id === rec.id && h.alokasi_jam > 0,
        ),
    );

    if (!stillExists) {
      toDelete.push(rec.id);
    }
  });

  // 2. Find records to update or insert
  matrixRows.value.forEach((row) => {
    if (row.hours) {
      Object.entries(row.hours).forEach(([t, cell]) => {
        if (cell && cell.alokasi_jam > 0) {
          if (cell.id !== undefined) {
            const original = dbRecords.find((r) => r.id === cell.id);
            if (original) {
              const hasChanged =
                original.nama_mapel !== row.nama_mapel.trim() ||
                original.kode_mapel !== row.kode_mapel.trim().toUpperCase() ||
                original.alokasi_jam !== cell.alokasi_jam;

              if (hasChanged) {
                toUpdate.push({
                  id: cell.id,
                  data: {
                    nama_mapel: row.nama_mapel.trim(),
                    kode_mapel: row.kode_mapel.trim().toUpperCase(),
                    alokasi_jam: cell.alokasi_jam,
                    tingkat: t,
                  },
                });
              }
            }
          } else {
            toCreate.push({
              nama_mapel: row.nama_mapel.trim(),
              kode_mapel: row.kode_mapel.trim().toUpperCase(),
              alokasi_jam: cell.alokasi_jam,
              tingkat: t,
            });
          }
        }
      });
    }
  });

  try {
    const deletePromises = toDelete.map((id) => deleteFromApi("kurikulum", id));
    const updatePromises = toUpdate.map((item) =>
      putToApi("kurikulum", item.id, item.data),
    );
    const createPromises = toCreate.map((data) => postToApi("kurikulum", data));

    await Promise.all([
      ...deletePromises,
      ...updatePromises,
      ...createPromises,
    ]);

    Notify.success("Semua perubahan kurikulum berhasil disimpan!");
    await refreshKurikulum("kurikulum");
    loadMatrixData();
    editingRowId.value = null;
  } catch (err) {
    console.error("Gagal menyimpan perubahan kurikulum:", err);
    Notify.failure("Gagal menyimpan beberapa perubahan. Silakan coba kembali.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadKurikulum("kurikulum");
  loadKelas("data_kelas");
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
