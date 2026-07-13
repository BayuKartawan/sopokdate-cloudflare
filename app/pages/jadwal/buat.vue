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
              <Calendar class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              Susun Jadwal Pelajaran (Mode Draft)
            </h2>
            <p class="text-sm text-zinc-400 mt-1">
              Atur seluruh jadwal secara lokal terlebih dahulu untuk menghindari
              pemborosan kuota API. Tekan Simpan di bagian bawah jika sudah
              selesai.
            </p>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div
        class="bg-zinc-800/20 border border-zinc-700/40 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4"
      >
        <div class="flex flex-col gap-1.5 w-full sm:w-72">
          <label class="text-xs font-semibold text-zinc-400"
            >Pilih Rombongan Belajar (Kelas)</label
          >
          <select
            :value="selectedKelas"
            @change="onClassSelectChange($event.target.value)"
            class="w-full h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          >
            <option value="">-- Pilih Kelas --</option>
            <option
              v-for="k in kelasData"
              :key="k.id_kelas"
              :value="k.id_kelas"
            >
              {{ k.nama_kelas || k.id_kelas }}
            </option>
          </select>
        </div>

        <!-- Auto Generate Button (Admin Only) -->
        <div
          v-if="selectedKelas && isAdmin"
          class="flex flex-col gap-1.5 w-full sm:w-auto"
        >
          <label
            class="text-xs font-semibold text-zinc-400 opacity-0 sm:block hidden"
            >Aksi</label
          >
          <button
            @click="autoGenerateSchedule"
            class="flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-950/20"
          >
            <Sparkles class="w-4 h-4" />
            Auto Generate
          </button>
        </div>

        <!-- Toggle Slot Edit Mode Button (Admin Only) -->
        <div
          v-if="selectedKelas && isAdmin"
          class="flex flex-col gap-1.5 w-full sm:w-auto"
        >
          <label
            class="text-xs font-semibold text-zinc-400 opacity-0 sm:block hidden"
            >Mode</label
          >
          <button
            @click="isSlotEditMode = !isSlotEditMode; if(isSlotEditMode) selectedAllocationForPlacement = null"
            class="flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded-lg transition-all shadow-lg"
            :class="[
              isSlotEditMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/20 ring-2 ring-amber-400/40'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 shadow-zinc-950/20',
            ]"
          >
            <ToggleRight v-if="isSlotEditMode" class="w-4 h-4" />
            <ToggleLeft v-else class="w-4 h-4" />
            {{ isSlotEditMode ? 'Mode Atur Batas' : 'Atur Batas Jam' }}
          </button>
        </div>

        <div
          v-if="selectedKelas"
          class="text-xs text-zinc-500 dark:text-zinc-400 mt-2 sm:mt-0 flex flex-wrap gap-4 items-center sm:ml-auto"
        >
          <!-- Selection tip -->
          <span
            v-if="isSlotEditMode"
            class="text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg animate-pulse"
          >
            Mode Atur Batas Jam — Klik sel untuk toggle aktif/nonaktif
          </span>
          <span
            v-else-if="selectedAllocationForPlacement"
            class="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-pulse"
          >
            Menempatkan:
            {{ getMapelName(selectedAllocationForPlacement.mapel_id) }} ({{
              getGuruName(selectedAllocationForPlacement.guru_id)
            }})
          </span>
          <span
            v-else
            class="text-zinc-500 italic bg-zinc-800/40 border border-zinc-700/20 px-3 py-1.5 rounded-lg"
          >
            Tip: Klik sisa alokasi di kiri untuk mulai menempatkan jadwal.
          </span>

          <div class="flex gap-4">
            <span
              class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Terjadwal
            </span>
            <span class="flex items-center gap-1.5 text-zinc-500">
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
              Belum Terisi
            </span>
            <span class="flex items-center gap-1.5 text-amber-500">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              Nonaktif
            </span>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div v-if="selectedKelas" class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <!-- Sidebar: Alokasi Jam Terjadwal vs Total -->
        <div class="xl:col-span-1 flex flex-col gap-4">
          <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <h3
              class="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2"
            >
              <BookOpen class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Sisa Alokasi Kelas
            </h3>

            <p
              v-if="currentClassAllocations.length === 0"
              class="text-zinc-500 text-xs text-center py-4"
            >
              Belum ada alokasi jam mengajar di kelas ini. Silakan atur di menu
              Alokasi Jam.
            </p>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="alloc in currentClassAllocations"
                :key="alloc.id"
                class="p-3 rounded-lg border transition-all select-none"
                :class="[
                  selectedAllocationForPlacement?.id === alloc.id
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/10'
                    : 'bg-zinc-500/5 dark:bg-zinc-850 border-zinc-300 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-700/60',
                  getAllocatedCount(alloc.id) >= alloc.jam_mengajar
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer',
                ]"
                @click="handleSelectAllocation(alloc)"
              >
                <div
                  class="flex justify-between text-xs font-semibold text-zinc-200 mb-1"
                >
                  <span class="truncate pr-1">{{
                    getMapelName(alloc.mapel_id)
                  }}</span>
                  <span class="shrink-0 text-emerald-600 dark:text-emerald-400">
                    {{ getAllocatedCount(alloc.id) }} /
                    {{ alloc.jam_mengajar }} JP
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-[10px] text-zinc-500 truncate mr-2">
                    {{ getGuruName(alloc.guru_id) }}
                  </p>
                  <!-- Active Status Badge -->
                  <span
                    v-if="selectedAllocationForPlacement?.id === alloc.id"
                    class="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shrink-0"
                  >
                    Aktif
                  </span>
                </div>
                <!-- Progress Bar -->
                <div
                  class="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-2.5"
                >
                  <div
                    class="h-1.5 rounded-full transition-all duration-300"
                    :class="[
                      getAllocatedCount(alloc.id) >= alloc.jam_mengajar
                        ? 'bg-emerald-500'
                        : getAllocatedCount(alloc.id) > 0
                          ? 'bg-amber-500'
                          : 'bg-zinc-700',
                    ]"
                    :style="{
                      width: `${Math.min(100, (getAllocatedCount(alloc.id) / alloc.jam_mengajar) * 100)}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Grid (Table View) -->
        <div class="xl:col-span-3">
          <div
            class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
          >
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr
                    class="border-b border-zinc-800 bg-zinc-950/40 text-[11px] font-bold tracking-wider text-zinc-400 uppercase"
                  >
                    <th class="p-3 w-28 text-center border-r border-zinc-800">
                      Jam / Hari
                    </th>
                    <th
                      v-for="day in days"
                      :key="day"
                      class="p-3 text-center border-r border-zinc-800 min-w-[140px]"
                    >
                      {{ day }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/60">
                  <tr
                    v-for="hour in maxHours"
                    :key="hour"
                    class="hover:bg-zinc-900/10"
                  >
                    <!-- Hour Label -->
                    <td
                      class="p-3 font-semibold text-xs text-zinc-300 bg-zinc-950/20 text-center border-r border-zinc-800"
                    >
                      Jam ke-{{ hour }}
                    </td>

                    <!-- Grid Slots -->
                    <td
                      v-for="day in days"
                      :key="day"
                      class="p-2 border-r border-zinc-800 text-center relative group min-h-[72px]"
                      :class="{ 'slot-disabled-bg': isSlotDisabled(day, hour) }"
                    >
                      <!-- Disabled Slot (Non-active cell) -->
                      <div
                        v-if="isSlotDisabled(day, hour)"
                        class="w-full h-full min-h-[50px] flex flex-col items-center justify-center rounded-lg transition-all"
                        :class="[
                          isSlotEditMode && isAdmin
                            ? 'cursor-pointer hover:opacity-80'
                            : '',
                        ]"
                        @click="isSlotEditMode && isAdmin ? toggleSlotDisabled(day, hour) : null"
                      >
                        <Ban class="w-4 h-4 text-amber-600/60 mb-1" />
                        <span class="text-[9px] text-amber-600/60 font-medium">Nonaktif</span>
                      </div>

                      <!-- Slot Edit Mode: Toggle ON (enable/disable) -->
                      <div
                        v-else-if="isSlotEditMode && isAdmin"
                        class="w-full h-full min-h-[50px] flex items-center justify-center rounded-lg border border-dashed border-amber-500/30 bg-amber-950/5 hover:border-amber-500 hover:bg-amber-950/15 transition-all cursor-pointer"
                        @click="toggleSlotDisabled(day, hour)"
                      >
                        <div class="flex flex-col items-center gap-1">
                          <template v-if="getScheduleAt(day, hour)">
                            <div class="text-[9px] font-bold text-emerald-400 leading-tight">{{ getMapelName(getScheduleAt(day, hour).mapel_id) }}</div>
                            <div class="text-[8px] text-zinc-500">{{ getGuruName(getScheduleAt(day, hour).guru_id) }}</div>
                            <span class="text-[8px] text-amber-500 mt-0.5">Klik untuk nonaktifkan</span>
                          </template>
                          <template v-else>
                            <ToggleLeft class="w-4 h-4 text-amber-400/60" />
                            <span class="text-[8px] text-amber-400/60">Klik untuk nonaktifkan</span>
                          </template>
                        </div>
                      </div>

                      <!-- Scheduled Subject -->
                      <div
                        v-else-if="getScheduleAt(day, hour)"
                        class="p-2 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-left flex flex-col justify-between h-full group"
                      >
                        <div>
                          <div
                            class="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight"
                          >
                            {{
                              getMapelName(getScheduleAt(day, hour).mapel_id)
                            }}
                          </div>
                          <div
                            class="text-[9px] text-zinc-400 mt-1 line-clamp-1"
                          >
                            {{ getGuruName(getScheduleAt(day, hour).guru_id) }}
                          </div>
                        </div>

                        <!-- Remove Button (Admin Only) -->
                        <div v-if="isAdmin" class="flex justify-end mt-2">
                          <button
                            @click="handleRemoveSlot(getScheduleAt(day, hour))"
                            class="p-1 rounded bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[9px] font-medium"
                            title="Keluarkan dari draft"
                          >
                            <Trash2 class="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <!-- Empty Slot Button (Admin Only) -->
                      <div
                        v-else-if="isAdmin"
                        class="w-full h-full min-h-[50px] flex items-center justify-center rounded-lg border border-dashed transition-all cursor-pointer group"
                        :class="[
                          selectedAllocationForPlacement
                            ? 'border-emerald-500/40 bg-emerald-950/5 hover:border-emerald-500 hover:bg-emerald-950/20'
                            : 'border-zinc-800 hover:border-zinc-700/50 hover:bg-zinc-800/10',
                        ]"
                        @click="handleSlotClick(day, hour)"
                      >
                        <Plus
                          class="w-4 h-4 transition-colors"
                          :class="
                            selectedAllocationForPlacement
                              ? 'text-emerald-400'
                              : 'text-zinc-600 group-hover:text-emerald-400'
                          "
                        />
                      </div>

                      <!-- Read-only Empty for Guru -->
                      <div v-else class="text-[10px] text-zinc-600 py-3 italic">
                        Kosong
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Prompt select class -->
      <div
        v-else
        class="text-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800"
      >
        <Calendar
          class="w-16 h-16 mx-auto mb-4 text-zinc-700"
          stroke-width="1.5"
        />
        <p class="text-zinc-400 text-lg font-medium">
          Silakan Pilih Kelas Terlebih Dahulu
        </p>
        <p class="text-zinc-500 text-sm mt-1">
          Pilih salah satu kelas di atas untuk mulai menyusun jadwal.
        </p>
      </div>

      <!-- Floating Save Changes Bar (Admin Only) -->
      <div
        v-if="isAdmin && hasChanges"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/90 border border-emerald-500/30 px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl animate-fade-in"
      >
        <div class="flex flex-col">
          <span class="text-xs font-bold text-zinc-200"
            >Perubahan Draft Jadwal</span
          >
          <span class="text-[10px] text-zinc-400"
            >Ada perubahan yang belum disimpan ke server.</span
          >
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="discardChanges"
            :disabled="isSavingChanges"
            class="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            @click="saveChanges"
            :disabled="isSavingChanges"
            class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
          >
            <Loader2 v-if="isSavingChanges" class="w-3 h-3 animate-spin" />
            {{ isSavingChanges ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Ban,
} from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { postToApi, deleteFromApi } from "~/utils/api";

const { Notify, Confirm } = useNotiflix();

// Core DB data
const { cardData: kelasData, loadData: loadKelas } = useTableData();
const { cardData: alokasiData, loadData: loadAlokasi } = useTableData();
const { cardData: kurikulumData, loadData: loadKurikulum } = useTableData();
const { cardData: gtkData, loadData: loadGtk } = useTableData();
const {
  cardData: jadwalData,
  loadData: loadJadwal,
  refreshData: refreshJadwal,
} = useTableData();

const { isAdmin } = useCrud("jadwal_pelajaran");

// Selection states
const selectedKelas = ref("");
const selectedAllocationForPlacement = ref(null);

// Draft management states
const dbSchedules = ref([]); // Initial state from database
const localSchedules = ref([]); // Client draft state (modified locally)
const isSavingChanges = ref(false);

// Slot disabled management states
const isSlotEditMode = ref(false); // Toggle mode for enabling/disabling cells
const disabledSlots = ref(new Set()); // Set of "hari_jamKe" keys for current class
const dbDisabledSlots = ref(new Set()); // Snapshot from DB for change tracking
const { cardData: disabledSlotsData, loadData: loadDisabledSlots } = useTableData();

// Constant configurations
const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const maxHours = 8; // Jam ke-1 s/d Jam ke-8

// Sync local states with database when loaded/refreshed
const loadClassSchedules = (kelasId) => {
  if (!kelasId) {
    dbSchedules.value = [];
    localSchedules.value = [];
    dbDisabledSlots.value = new Set();
    disabledSlots.value = new Set();
    return;
  }
  const filtered = (jadwalData.value || []).filter(
    (sch) => sch.kelas_id === kelasId,
  );
  dbSchedules.value = JSON.parse(JSON.stringify(filtered));
  localSchedules.value = JSON.parse(JSON.stringify(filtered));

  // Load disabled slots for this class
  const disabledFiltered = (disabledSlotsData.value || []).filter(
    (slot) => slot.kelas_id === kelasId,
  );
  const dbSet = new Set(disabledFiltered.map((s) => `${s.hari}_${s.jam_ke}`));
  dbDisabledSlots.value = new Set(dbSet);
  disabledSlots.value = new Set(dbSet);
};

// Listen to global dataset fetches to update our view state
watch(
  jadwalData,
  () => {
    if (selectedKelas.value && !hasChanges.value) {
      loadClassSchedules(selectedKelas.value);
    }
  },
  { deep: true },
);

// Check if disabled slots have changed from DB state
const hasDisabledSlotChanges = computed(() => {
  if (dbDisabledSlots.value.size !== disabledSlots.value.size) return true;
  for (const key of disabledSlots.value) {
    if (!dbDisabledSlots.value.has(key)) return true;
  }
  return false;
});

// Check diff between local draft and database state
const hasChanges = computed(() => {
  // Check disabled slots changes
  if (hasDisabledSlotChanges.value) return true;

  if (dbSchedules.value.length !== localSchedules.value.length) return true;

  const dbKeys = dbSchedules.value
    .map((s) => `${s.kelas_id}_${s.hari}_${s.jam_ke}_${s.alokasi_id}`)
    .sort();
  const localKeys = localSchedules.value
    .map((s) => `${s.kelas_id}_${s.hari}_${s.jam_ke}_${s.alokasi_id}`)
    .sort();

  return JSON.stringify(dbKeys) !== JSON.stringify(localKeys);
});

// Helper: check if a slot is disabled
const isSlotDisabled = (day, hour) => {
  return disabledSlots.value.has(`${day}_${hour}`);
};

// Toggle a slot disabled/enabled
const toggleSlotDisabled = (day, hour) => {
  const key = `${day}_${hour}`;
  const newSet = new Set(disabledSlots.value);

  if (newSet.has(key)) {
    // Re-enable the slot
    newSet.delete(key);
    disabledSlots.value = newSet;
    Notify.info(`Sel ${day} jam ke-${hour} diaktifkan kembali.`);
  } else {
    // Check if there's a schedule in this slot — must remove first
    const existingSchedule = getScheduleAt(day, hour);
    if (existingSchedule) {
      Confirm.show(
        'Jadwal Akan Dihapus',
        `Sel ini berisi jadwal ${getMapelName(existingSchedule.mapel_id)}. Menonaktifkan sel ini akan menghapus jadwal tersebut dari draft. Lanjutkan?`,
        'Ya, Nonaktifkan',
        'Batal',
        () => {
          // Remove the schedule first
          localSchedules.value = localSchedules.value.filter((s) => s.id !== existingSchedule.id);
          const newSetInner = new Set(disabledSlots.value);
          newSetInner.add(key);
          disabledSlots.value = newSetInner;
          Notify.warning(`Sel ${day} jam ke-${hour} dinonaktifkan. Jadwal dihapus dari draft.`);
        },
        () => {},
      );
      return;
    }

    newSet.add(key);
    disabledSlots.value = newSet;
    Notify.warning(`Sel ${day} jam ke-${hour} dinonaktifkan.`);
  }
};

// Prompt class change if unsaved changes exist
const onClassSelectChange = (newKelas) => {
  if (hasChanges.value) {
    Confirm.show(
      "Perubahan Belum Disimpan",
      "Anda memiliki perubahan jadwal yang belum disimpan di kelas ini. Apakah Anda yakin ingin berpindah kelas dan membuang perubahan tersebut?",
      "Ya, Pindah & Buang",
      "Batal",
      () => {
        selectedAllocationForPlacement.value = null;
        isSlotEditMode.value = false;
        selectedKelas.value = newKelas;
        loadClassSchedules(newKelas);
      },
      () => {},
    );
  } else {
    selectedAllocationForPlacement.value = null;
    isSlotEditMode.value = false;
    selectedKelas.value = newKelas;
    loadClassSchedules(newKelas);
  }
};

// Filter allocations for current selected class
const currentClassAllocations = computed(() => {
  if (!selectedKelas.value) return [];
  return (alokasiData.value || []).filter(
    (alloc) => alloc.kelas_id === selectedKelas.value,
  );
});

// Count how many times an allocation is already assigned in draft state
const getAllocatedCount = (allocId) => {
  return localSchedules.value.filter(
    (sch) => sch.alokasi_id === Number(allocId),
  ).length;
};

// Find schedule item at a specific day and hour index in draft state
const getScheduleAt = (day, hour) => {
  return localSchedules.value.find(
    (sch) => sch.hari === day && Number(sch.jam_ke) === hour,
  );
};

// Helper name maps
const getMapelName = (id) => {
  const mapel = (kurikulumData.value || []).find((m) => m.id === Number(id));
  return mapel ? mapel.nama_mapel : `Mapel ID: ${id}`;
};

const getGuruName = (id) => {
  const guru = (gtkData.value || []).find((g) => g.id === Number(id));
  return guru ? guru.nama_lengkap : `Guru ID: ${id}`;
};

const handleSelectAllocation = (alloc) => {
  if (!isAdmin.value) return;

  // If already fully allocated, show warning and return
  if (getAllocatedCount(alloc.id) >= alloc.jam_mengajar) {
    Notify.warning(
      `Alokasi jam pelajaran untuk ${getMapelName(alloc.mapel_id)} sudah terpenuhi.`,
    );
    return;
  }

  // Toggle selection
  if (selectedAllocationForPlacement.value?.id === alloc.id) {
    selectedAllocationForPlacement.value = null;
  } else {
    selectedAllocationForPlacement.value = alloc;
  }
};

const handleSlotClick = (day, hour) => {
  if (!isAdmin.value) return;

  // Reject click on disabled slots
  if (isSlotDisabled(day, hour)) {
    Notify.warning('Sel ini telah dinonaktifkan. Aktifkan terlebih dahulu melalui mode "Atur Batas Jam".');
    return;
  }

  if (!selectedAllocationForPlacement.value) {
    Notify.warning(
      "Pilih mata pelajaran & guru terlebih dahulu pada panel Sisa Alokasi di sebelah kiri.",
    );
    return;
  }

  const allocation = selectedAllocationForPlacement.value;

  // Collision validation 1: Check if teacher is already teaching elsewhere (in DB other classes + local current class)
  const teacherConflict =
    (jadwalData.value || [])
      .filter((sch) => sch.kelas_id !== selectedKelas.value)
      .find(
        (sch) =>
          sch.hari === day &&
          Number(sch.jam_ke) === hour &&
          Number(sch.guru_id) === Number(allocation.guru_id),
      ) ||
    localSchedules.value.find(
      (sch) =>
        sch.hari === day &&
        Number(sch.jam_ke) === hour &&
        Number(sch.guru_id) === Number(allocation.guru_id),
    );

  if (teacherConflict) {
    Notify.failure(
      `Tabrakan Guru! ${getGuruName(allocation.guru_id)} sudah mengajar di kelas ${teacherConflict.kelas_id} pada hari ${day} jam ke-${hour}.`,
    );
    return;
  }

  // Collision validation 2: Exceeded allocation hours limit
  const currentCount = getAllocatedCount(allocation.id);
  if (currentCount >= allocation.jam_mengajar) {
    Notify.failure(
      `Batas jam pelajaran untuk ${getMapelName(allocation.mapel_id)} di kelas ini sudah terpenuhi.`,
    );
    selectedAllocationForPlacement.value = null; // reset selection
    return;
  }

  // Add temporary slot to local state
  const newSlot = {
    id: `temp_${Date.now()}_${Math.random()}`,
    alokasi_id: Number(allocation.id),
    kelas_id: selectedKelas.value,
    guru_id: Number(allocation.guru_id),
    mapel_id: Number(allocation.mapel_id),
    hari: day,
    jam_ke: Number(hour),
  };

  localSchedules.value.push(newSlot);

  // If fully allocated after this slot, clear placement selection automatically
  if (currentCount + 1 >= allocation.jam_mengajar) {
    selectedAllocationForPlacement.value = null;
    Notify.success(
      `Jadwal ditambahkan ke draft. Alokasi untuk ${getMapelName(allocation.mapel_id)} telah terpenuhi!`,
    );
  } else {
    Notify.success(
      `Jadwal ${getMapelName(allocation.mapel_id)} ditambahkan ke draft.`,
    );
  }
};

const handleRemoveSlot = (slot) => {
  if (!isAdmin.value) return;
  localSchedules.value = localSchedules.value.filter((s) => s.id !== slot.id);
  Notify.info(`Jadwal ${getMapelName(slot.mapel_id)} dikeluarkan dari draft.`);
};

// Auto generate schedule using backtracking solver with block constraints
const autoGenerateSchedule = () => {
  if (!selectedKelas.value) return;
  if (!isAdmin.value) return;

  if (currentClassAllocations.value.length === 0) {
    Notify.warning(
      "Belum ada alokasi jam mengajar di kelas ini. Silakan atur di menu Alokasi Jam terlebih dahulu.",
    );
    return;
  }

  // 1. Prepare allocations: group into size-based blocks (size 4, 2, or 1 JP)
  // For example:
  // - jp >= 4 -> one 4-JP block, and the rest as 2-JP or 1-JP blocks
  // - jp = 3 -> one 2-JP block + one 1-JP block
  // - jp = 2 -> one 2-JP block
  // - jp = 1 -> one 1-JP block
  const blocksToSchedule = [];

  currentClassAllocations.value.forEach((alloc) => {
    let jp = Number(alloc.jam_mengajar);
    const alokasiId = Number(alloc.id);
    const guruId = Number(alloc.guru_id);
    const mapelId = Number(alloc.mapel_id);

    if (jp >= 4) {
      blocksToSchedule.push({
        alokasi_id: alokasiId,
        guru_id: guruId,
        mapel_id: mapelId,
        size: 4,
        type: "morning_block"
      });
      jp -= 4;
    }

    while (jp >= 2) {
      blocksToSchedule.push({
        alokasi_id: alokasiId,
        guru_id: guruId,
        mapel_id: mapelId,
        size: 2,
        type: "double_block"
      });
      jp -= 2;
    }

    if (jp === 1) {
      blocksToSchedule.push({
        alokasi_id: alokasiId,
        guru_id: guruId,
        mapel_id: mapelId,
        size: 1,
        type: "single_block"
      });
    }
  });

  // Sort blocks: size 4 first, then size 2, then size 1
  // This is a powerful MRV (Minimum Remaining Values) CSP heuristic.
  blocksToSchedule.sort((a, b) => b.size - a.size);

  // 2. Prepare local grid structure
  const grid = {};
  days.forEach((day) => {
    for (let hour = 1; hour <= maxHours; hour++) {
      if (isSlotDisabled(day, hour)) {
        grid[`${day}_${hour}`] = 'DISABLED';
      } else {
        grid[`${day}_${hour}`] = null;
      }
    }
  });

  // Check teacher conflicts from other classes in DB
  const isTeacherConflictingExternally = (day, hour, guruId) => {
    return (jadwalData.value || [])
      .filter((sch) => sch.kelas_id !== selectedKelas.value)
      .some(
        (sch) =>
          sch.hari === day &&
          Number(sch.jam_ke) === hour &&
          Number(sch.guru_id) === guruId,
      );
  };

  // Safe Backtracking Solver state variables
  let iterations = 0;
  const MAX_ITERATIONS = 50000;
  let searchLimitExceeded = false;

  const solve = (blockIndex) => {
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      searchLimitExceeded = true;
      return false;
    }

    if (blockIndex >= blocksToSchedule.length) {
      return true; // All blocks successfully placed!
    }

    const block = blocksToSchedule[blockIndex];

    // Generate placement candidates (day, startHour)
    let candidates = [];
    if (block.size === 4) {
      // 4-JP morning block must start at hour 1
      days.forEach((day) => {
        candidates.push({ day, startHour: 1 });
      });
    } else if (block.size === 2) {
      // 2-JP double block
      days.forEach((day) => {
        // Preferred standard double-period alignments first
        candidates.push({ day, startHour: 1 });
        candidates.push({ day, startHour: 3 });
        candidates.push({ day, startHour: 5 });
        candidates.push({ day, startHour: 7 });

        // Non-standard backup alignments to avoid failures in tight schedules
        candidates.push({ day, startHour: 2 });
        candidates.push({ day, startHour: 4 });
        candidates.push({ day, startHour: 6 });
      });
    } else {
      // 1-JP single block can start at any hour
      days.forEach((day) => {
        for (let h = 1; h <= maxHours; h++) {
          candidates.push({ day, startHour: h });
        }
      });
    }

    // Try each candidate position
    for (let c = 0; c < candidates.length; c++) {
      const { day, startHour } = candidates[c];

      // 1. Check if all required slots are free
      let free = true;
      for (let h = 0; h < block.size; h++) {
        const hour = startHour + h;
        if (grid[`${day}_${hour}`] !== null) {
          free = false;
          break;
        }
      }
      if (!free) continue;

      // 2. Check teacher conflicts in external classes
      let conflict = false;
      for (let h = 0; h < block.size; h++) {
        const hour = startHour + h;
        if (isTeacherConflictingExternally(day, hour, block.guru_id)) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;

      // 3. Soft constraint: avoid having too many hours of the same subject on the same day.
      // If we are in the first half of iteration limits, enforce maximum of 2 hours per subject per day.
      // In the second half of iteration limits, relax this to allow a subject to be placed up to 4 hours per day (fallback).
      let currentHoursOnDay = 0;
      for (let h = 1; h <= maxHours; h++) {
        const cell = grid[`${day}_${h}`];
        if (cell && cell !== 'DISABLED' && cell.mapel_id === block.mapel_id) {
          currentHoursOnDay++;
        }
      }
      
      const maxAllowedDailyHours = iterations < (MAX_ITERATIONS / 2) ? 2 : 4;
      if (block.size < 4 && currentHoursOnDay + block.size > maxAllowedDailyHours) {
        continue;
      }

      // 4. Place the block
      for (let h = 0; h < block.size; h++) {
        const hour = startHour + h;
        grid[`${day}_${hour}`] = block;
      }

      // Recurse to place next blocks
      if (solve(blockIndex + 1)) return true;

      // Backtrack
      for (let h = 0; h < block.size; h++) {
        const hour = startHour + h;
        grid[`${day}_${hour}`] = null;
      }
    }

    return false;
  };

  const success = solve(0);

  if (success) {
    const newSchedules = [];
    Object.keys(grid).forEach((key) => {
      const item = grid[key];
      if (item && item !== 'DISABLED') {
        const [day, hourStr] = key.split("_");
        const hour = Number(hourStr);
        newSchedules.push({
          id: `temp_${Date.now()}_${Math.random()}`,
          alokasi_id: item.alokasi_id,
          kelas_id: selectedKelas.value,
          guru_id: item.guru_id,
          mapel_id: item.mapel_id,
          hari: day,
          jam_ke: hour,
        });
      }
    });

    localSchedules.value = newSchedules;
    Notify.success("Jadwal berhasil digenerate secara otomatis ke draft!");
  } else {
    if (searchLimitExceeded) {
      Notify.failure(
        "Gagal mengenerate jadwal. Batas pencarian terlampaui (terlalu banyak tabrakan jadwal atau batasan terlalu ketat). Silakan atur manual atau kurangi batasan.",
      );
    } else {
      Notify.failure(
        "Gagal mengenerate jadwal secara otomatis. Terjadi tabrakan jadwal guru yang tidak dapat dihindari.",
      );
    }
  }
};

// Reset local states to original database snapshot
const discardChanges = () => {
  localSchedules.value = JSON.parse(JSON.stringify(dbSchedules.value));
  disabledSlots.value = new Set(dbDisabledSlots.value);
  selectedAllocationForPlacement.value = null;
  isSlotEditMode.value = false;
  Notify.info("Perubahan draft dibatalkan.");
};

// Batch save local changes to database
const saveChanges = async () => {
  if (!selectedKelas.value) return;
  isSavingChanges.value = true;

  try {
    // 1. Identify deleted records (were in DB, but no longer in local draft)
    const deletes = dbSchedules.value
      .filter(
        (db) =>
          !localSchedules.value.some(
            (local) =>
              local.kelas_id === db.kelas_id &&
              local.hari === db.hari &&
              Number(local.jam_ke) === Number(db.jam_ke),
          ),
      )
      .map((item) => deleteFromApi("jadwal_pelajaran", item.id));

    // 2. Identify new inserted records (have temporary 'temp_' ID prefix)
    const inserts = localSchedules.value
      .filter((local) => String(local.id).startsWith("temp_"))
      .map((item) =>
        postToApi("jadwal_pelajaran", {
          alokasi_id: Number(item.alokasi_id),
          kelas_id: item.kelas_id,
          guru_id: Number(item.guru_id),
          mapel_id: Number(item.mapel_id),
          hari: item.hari,
          jam_ke: Number(item.jam_ke),
        }),
      );

    // 3. Disabled slots: identify inserts and deletes
    const disabledSlotDeletes = [];
    const disabledSlotInserts = [];

    if (hasDisabledSlotChanges.value) {
      // Find slots to delete (were in DB, no longer disabled)
      const dbSlotRecords = (disabledSlotsData.value || []).filter(
        (s) => s.kelas_id === selectedKelas.value,
      );
      for (const record of dbSlotRecords) {
        const key = `${record.hari}_${record.jam_ke}`;
        if (!disabledSlots.value.has(key)) {
          disabledSlotDeletes.push(deleteFromApi("jadwal_slot_disabled", record.id));
        }
      }

      // Find slots to insert (new disabled, not in DB)
      for (const key of disabledSlots.value) {
        if (!dbDisabledSlots.value.has(key)) {
          const [hari, jamKe] = key.split("_");
          disabledSlotInserts.push(
            postToApi("jadwal_slot_disabled", {
              kelas_id: selectedKelas.value,
              hari,
              jam_ke: Number(jamKe),
            }),
          );
        }
      }
    }

    // Execute all API operations
    await Promise.all([
      ...deletes,
      ...inserts,
      ...disabledSlotDeletes,
      ...disabledSlotInserts,
    ]);
    Notify.success("Semua perubahan jadwal berhasil disimpan ke database!");

    // Refresh raw database cache
    await Promise.all([
      refreshJadwal("jadwal_pelajaran"),
      loadDisabledSlots("jadwal_slot_disabled"),
    ]);

    // Update local base references
    isSlotEditMode.value = false;
    loadClassSchedules(selectedKelas.value);
  } catch (err) {
    console.error("Gagal menyimpan perubahan jadwal:", err);
    Notify.failure("Gagal menyimpan beberapa perubahan. Silakan coba kembali.");
  } finally {
    isSavingChanges.value = false;
  }
};

onMounted(() => {
  loadKelas("data_kelas");
  loadAlokasi("alokasi_jam");
  loadKurikulum("kurikulum");
  loadGtk("data_gtk");
  loadJadwal("jadwal_pelajaran");
  loadDisabledSlots("jadwal_slot_disabled");
});
</script>

<style scoped>
/* Floating bar enter/leave animations */
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

.bg-zinc-850 {
  background-color: rgb(24 24 27 / 0.5);
}

/* Disabled slot hatched background */
.slot-disabled-bg {
  background: repeating-linear-gradient(
    -45deg,
    rgba(245, 158, 11, 0.04),
    rgba(245, 158, 11, 0.04) 4px,
    rgba(245, 158, 11, 0.08) 4px,
    rgba(245, 158, 11, 0.08) 8px
  );
}
</style>
