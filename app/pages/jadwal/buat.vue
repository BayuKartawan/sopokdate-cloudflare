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
              <Calendar class="w-7 h-7 text-emerald-400" />
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
        <div v-if="selectedKelas && isAdmin" class="flex flex-col gap-1.5 w-full sm:w-auto">
          <label class="text-xs font-semibold text-zinc-400 opacity-0 sm:block hidden">Aksi</label>
          <button
            @click="autoGenerateSchedule"
            class="flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-950/20"
          >
            <Sparkles class="w-4 h-4" />
            Auto Generate
          </button>
        </div>

        <div
          v-if="selectedKelas"
          class="text-xs text-zinc-400 mt-2 sm:mt-0 flex flex-wrap gap-4 items-center sm:ml-auto"
        >
          <!-- Selection tip -->
          <span
            v-if="selectedAllocationForPlacement"
            class="text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-pulse"
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
              class="flex items-center gap-1.5 text-emerald-400 font-medium"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Terjadwal
            </span>
            <span class="flex items-center gap-1.5 text-zinc-500">
              <span class="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
              Belum Terisi
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
              <BookOpen class="w-4 h-4 text-emerald-400" />
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
                    ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/10'
                    : 'bg-zinc-850 border-zinc-800/80 hover:border-zinc-700/60',
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
                  <span class="shrink-0 text-emerald-400">
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
                    class="bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shrink-0"
                  >
                    Aktif
                  </span>
                </div>
                <!-- Progress Bar -->
                <div
                  class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-2.5"
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
                    >
                      <!-- Scheduled Subject -->
                      <div
                        v-if="getScheduleAt(day, hour)"
                        class="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-left flex flex-col justify-between h-full group"
                      >
                        <div>
                          <div
                            class="text-xs font-bold text-emerald-400 leading-tight"
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
import { Calendar, BookOpen, Plus, Trash2, Loader2, Sparkles } from "lucide-vue-next";
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

// Constant configurations
const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const maxHours = 8; // Jam ke-1 s/d Jam ke-8

// Sync local states with database when loaded/refreshed
const loadClassSchedules = (kelasId) => {
  if (!kelasId) {
    dbSchedules.value = [];
    localSchedules.value = [];
    return;
  }
  const filtered = (jadwalData.value || []).filter(
    (sch) => sch.kelas_id === kelasId,
  );
  dbSchedules.value = JSON.parse(JSON.stringify(filtered));
  localSchedules.value = JSON.parse(JSON.stringify(filtered));
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

// Check diff between local draft and database state
const hasChanges = computed(() => {
  if (dbSchedules.value.length !== localSchedules.value.length) return true;

  const dbKeys = dbSchedules.value
    .map((s) => `${s.kelas_id}_${s.hari}_${s.jam_ke}_${s.alokasi_id}`)
    .sort();
  const localKeys = localSchedules.value
    .map((s) => `${s.kelas_id}_${s.hari}_${s.jam_ke}_${s.alokasi_id}`)
    .sort();

  return JSON.stringify(dbKeys) !== JSON.stringify(localKeys);
});

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
        selectedKelas.value = newKelas;
        loadClassSchedules(newKelas);
      },
      () => {},
    );
  } else {
    selectedAllocationForPlacement.value = null;
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
      "Belum ada alokasi jam mengajar di kelas ini. Silakan atur di menu Alokasi Jam terlebih dahulu."
    );
    return;
  }

  // 1. Prepare allocations to schedule: split into morning blocks and individual hours
  const morningBlocks = [];
  const individualHours = [];

  currentClassAllocations.value.forEach((alloc) => {
    const jp = Number(alloc.jam_mengajar);
    if (jp >= 4) {
      // Exactly 4 JP goes as a single block for morning (hours 1-4)
      morningBlocks.push({
        alokasi_id: Number(alloc.id),
        guru_id: Number(alloc.guru_id),
        mapel_id: Number(alloc.mapel_id),
        jam_mengajar: jp,
        type: "morning_block",
      });
      // Sisa JP goes to afternoon (hours 5-8)
      for (let i = 0; i < jp - 4; i++) {
        individualHours.push({
          alokasi_id: Number(alloc.id),
          guru_id: Number(alloc.guru_id),
          mapel_id: Number(alloc.mapel_id),
          jam_mengajar: jp,
          type: "afternoon_hour",
        });
      }
    } else if (jp === 2) {
      // 2 JP goes to afternoon (hours 5-8)
      for (let i = 0; i < jp; i++) {
        individualHours.push({
          alokasi_id: Number(alloc.id),
          guru_id: Number(alloc.guru_id),
          mapel_id: Number(alloc.mapel_id),
          jam_mengajar: jp,
          type: "afternoon_hour",
        });
      }
    } else {
      // Other durations (e.g. JP 1, 3) go as flexible hours
      for (let i = 0; i < jp; i++) {
        individualHours.push({
          alokasi_id: Number(alloc.id),
          guru_id: Number(alloc.guru_id),
          mapel_id: Number(alloc.mapel_id),
          jam_mengajar: jp,
          type: "flexible_hour",
        });
      }
    }
  });

  // Sort individual hours: place afternoon ones first
  individualHours.sort((a, b) => {
    if (a.type === "afternoon_hour" && b.type !== "afternoon_hour") return -1;
    if (a.type !== "afternoon_hour" && b.type === "afternoon_hour") return 1;
    return 0;
  });

  // 2. Prepare local grid structure
  const grid = {};
  days.forEach((day) => {
    for (let hour = 1; hour <= maxHours; hour++) {
      grid[`${day}_${hour}`] = null;
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
          Number(sch.guru_id) === guruId
      );
  };

  // Helper constraint check: each block on any day can contain at most one unique subject
  const doesBlockViolateSingleSubject = (gridState, day, hour, mapelId) => {
    let blockHours = [];
    if (hour >= 1 && hour <= 4) {
      blockHours = [1, 2, 3, 4];
    } else if (hour >= 5 && hour <= 6) {
      blockHours = [5, 6];
    } else if (hour >= 7 && hour <= 8) {
      blockHours = [7, 8];
    }

    for (let i = 0; i < blockHours.length; i++) {
      const h = blockHours[i];
      if (h === hour) continue;
      const existing = gridState[`${day}_${h}`];
      if (existing !== null && Number(existing.mapel_id) !== Number(mapelId)) {
        return true; // Different subject already in this block
      }
    }
    return false;
  };

  // 3. Solver Phase 1: Place morning blocks (hours 1-4)
  const solveMorningBlocks = (index) => {
    if (index >= morningBlocks.length) {
      // All blocks placed, move to Phase 2: Place individual hours
      return solveIndividualHours(0);
    }

    const item = morningBlocks[index];

    // Try each day
    for (let d = 0; d < days.length; d++) {
      const day = days[d];

      // Check if hours 1-4 are free in current class
      let free = true;
      for (let h = 1; h <= 4; h++) {
        if (grid[`${day}_${h}`] !== null) {
          free = false;
          break;
        }
      }
      if (!free) continue;

      // Check if teacher has conflicts in other classes for hours 1-4
      let conflict = false;
      for (let h = 1; h <= 4; h++) {
        if (isTeacherConflictingExternally(day, h, item.guru_id)) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;

      // Place block (occupies hours 1-4)
      for (let h = 1; h <= 4; h++) {
        grid[`${day}_${h}`] = item;
      }

      // Recurse
      if (solveMorningBlocks(index + 1)) return true;

      // Backtrack
      for (let h = 1; h <= 4; h++) {
        grid[`${day}_${h}`] = null;
      }
    }

    return false;
  };

  // 4. Solver Phase 2: Place individual hours
  const solveIndividualHours = (index) => {
    if (index >= individualHours.length) {
      return true;
    }

    const item = individualHours[index];

    // Allowed hours constraints
    let allowedHours = [];
    if (item.type === "afternoon_hour") {
      allowedHours = [5, 6, 7, 8];
    } else {
      allowedHours = [1, 2, 3, 4, 5, 6, 7, 8];
    }

    // Try placing this item
    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      
      const currentHoursOnDay = Object.keys(grid)
        .filter((key) => key.startsWith(`${day}_`) && grid[key]?.mapel_id === item.mapel_id)
        .length;

      // Soft constraint: avoid having more than 2 hours of this mapel on other days
      if (currentHoursOnDay >= 2) {
        continue;
      }

      for (let h = 0; h < allowedHours.length; h++) {
        const hour = allowedHours[h];
        const key = `${day}_${hour}`;

        if (grid[key] !== null) continue;
        if (isTeacherConflictingExternally(day, hour, item.guru_id)) continue;
        
        // Single subject per block per day constraint check
        if (doesBlockViolateSingleSubject(grid, day, hour, item.mapel_id)) continue;

        grid[key] = item;
        if (solveIndividualHours(index + 1)) return true;
        grid[key] = null;
      }
    }

    // Fallback: solve without soft constraint (but keep day hours limit < 4 to not stack on block day)
    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      
      const currentHoursOnDay = Object.keys(grid)
        .filter((key) => key.startsWith(`${day}_`) && grid[key]?.mapel_id === item.mapel_id)
        .length;

      if (currentHoursOnDay >= 4) {
        continue;
      }

      for (let h = 0; h < allowedHours.length; h++) {
        const hour = allowedHours[h];
        const key = `${day}_${hour}`;

        if (grid[key] !== null) continue;
        if (isTeacherConflictingExternally(day, hour, item.guru_id)) continue;
        
        // Single subject per block per day constraint check
        if (doesBlockViolateSingleSubject(grid, day, hour, item.mapel_id)) continue;

        grid[key] = item;
        if (solveIndividualHours(index + 1)) return true;
        grid[key] = null;
      }
    }

    return false;
  };

  const success = solveMorningBlocks(0);

  if (success) {
    const newSchedules = [];
    Object.keys(grid).forEach((key) => {
      const item = grid[key];
      if (item) {
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
    Notify.failure(
      "Gagal mengenerate jadwal secara otomatis. Terjadi tabrakan jadwal guru yang tidak dapat dihindari."
    );
  }
};

// Reset local states to original database snapshot
const discardChanges = () => {
  localSchedules.value = JSON.parse(JSON.stringify(dbSchedules.value));
  selectedAllocationForPlacement.value = null;
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

    // Execute all API operations
    await Promise.all([...deletes, ...inserts]);
    Notify.success("Semua perubahan jadwal berhasil disimpan ke database!");

    // Refresh raw database cache
    await refreshJadwal("jadwal_pelajaran");

    // Update local base references
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
</style>
