<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title and Actions -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6"
      >
        <div>
          <h2
            class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2"
          >
            <Calendar class="w-7 h-7 text-emerald-400" />
            Kalender Pendidikan
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Kelola hari libur nasional, libur sekolah, dan agenda kegiatan
            madrasah
          </p>
        </div>

        <!-- Add Button (Admin Only) -->
        <BaseButton
          v-if="isAdmin"
          text="Tambah Agenda / Libur"
          @click="openCreateModal"
          class="!bg-emerald-600 !text-white hover:!bg-emerald-500 shadow-lg shadow-emerald-900/20 self-start sm:self-auto"
        >
          <template #icon>
            <Plus class="w-4 h-4" />
          </template>
        </BaseButton>
      </div>

      <!-- Filters & Stats Section -->
      <div
        class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6"
      >
        <!-- Academic Year Selector -->
        <div class="flex flex-col gap-1.5 min-w-[180px]">
          <label class="text-xs font-semibold text-zinc-400"
            >Tahun Pelajaran</label
          >
          <select
            v-model="selectedTapel"
            class="h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          >
            <option v-for="opt in tapelOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <!-- Weekly Holiday Setting -->
        <div class="flex flex-col gap-1.5 min-w-[220px]">
          <label class="text-xs font-semibold text-zinc-400"
            >Hari Libur Mingguan</label
          >
          <div class="flex items-center gap-2">
            <select
              v-model="hariLiburMingguan"
              :disabled="!isAdmin || isSavingSettings"
              class="h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option :value="0">Minggu</option>
              <option :value="1">Senin</option>
              <option :value="2">Selasa</option>
              <option :value="3">Rabu</option>
              <option :value="4">Kamis</option>
              <option :value="5">Jumat</option>
              <option :value="6">Sabtu</option>
            </select>
            <BaseButton
              v-if="isAdmin"
              :text="isSavingSettings ? '...' : 'Simpan'"
              @click="saveWeeklyHoliday"
              :disabled="isSavingSettings"
              class="!bg-zinc-700 !text-zinc-200 hover:!bg-zinc-600 !h-10 !px-4 !py-0 shrink-0"
            />
          </div>
        </div>

        <!-- Search Filter -->
        <div class="flex-1 md:max-w-xs flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-400">Cari Agenda</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Ketik keterangan agenda..."
            class="h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
        </div>
      </div>

      <!-- Main Display -->
      <div
        class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-16">
          <Loader2
            class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3"
          />
          <p class="text-zinc-400 text-sm">Memuat agenda pendidikan...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredHolidaysGrouped.length === 0"
          class="text-center py-16 px-4"
        >
          <CalendarOff
            class="w-16 h-16 text-zinc-600 mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 font-semibold text-lg">Tidak ada agenda</p>
          <p class="text-zinc-500 text-sm mt-1">
            Belum ada hari libur atau kegiatan yang terdaftar untuk Tahun
            Pelajaran {{ selectedTapel }}
            <span v-if="searchQuery">
              dengan kata kunci "{{ searchQuery }}"</span
            >.
          </p>
        </div>

        <!-- Calendar Grouped List -->
        <div v-else class="p-6 space-y-8">
          <div
            v-for="group in filteredHolidaysGrouped"
            :key="group.monthKey"
            class="space-y-3"
          >
            <!-- Month Header -->
            <h3
              class="text-sm font-bold text-emerald-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2 flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              {{ group.monthName }}
            </h3>

            <!-- Events List in Month -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="event in group.events"
                :key="event.id"
                class="flex items-start justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 hover:border-zinc-700/60 transition-all duration-200 group"
              >
                <div class="space-y-2">
                  <!-- Date and Badge -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-zinc-300">
                      {{ formatEventRange(event) }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border uppercase"
                      :class="
                        event.tipe === 'libur'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      "
                    >
                      {{
                        event.tipe === "libur" ? "Libur Sekolah" : "Kegiatan"
                      }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="text-sm font-semibold text-zinc-100 pr-4">
                    {{ event.keterangan }}
                  </p>
                </div>

                <!-- Admin Action Buttons -->
                <div
                  v-if="isAdmin"
                  class="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0"
                >
                  <button
                    @click="openEditModal(event)"
                    class="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                    title="Edit Agenda"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleDelete(event)"
                    class="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title="Hapus Agenda"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Crud Modal -->
      <CrudModal
        :show="showModal"
        :mode="modalMode"
        :title="
          modalMode === 'create'
            ? 'Tambah Agenda Kalender'
            : 'Edit Agenda Kalender'
        "
        :fields="modalFields"
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
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarOff,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import CrudModal from "~/components/ui/CrudModal.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useCrud } from "~/composables/data/useCrud";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";
import { fetchFromApi, postToApi, putToApi } from "~/utils/api";

// --- Services
const { Notify } = useNotiflix();
const { cardData: holidays, isLoading, loadData, refreshData } = useTableData();
const { isAdmin, isSaving, createItem, updateItem, deleteItem } = useCrud(
  "KalenderPendidikan",
  () => refreshData("KalenderPendidikan"),
);

// --- State
const selectedTapel = ref("");
const searchQuery = ref("");
const showModal = ref(false);
const modalMode = ref("create");
const editingItem = ref({});

const hariLiburMingguan = ref(0); // Default: 0 (Minggu)
const settingsId = ref(null);
const isSavingSettings = ref(false);

// --- Computed Options
const tapelOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let y = currentYear - 3; y <= currentYear + 2; y++) {
    options.push(`${y}/${y + 1}`);
  }
  return options;
});

// Modal Fields (Includes start and end dates)
const modalFields = [
  {
    key: "tanggal_mulai",
    label: "Tanggal Mulai",
    type: "date",
    required: true,
  },
  {
    key: "tanggal_selesai",
    label: "Tanggal Selesai",
    type: "date",
    required: true,
  },
  {
    key: "keterangan",
    label: "Keterangan / Deskripsi Agenda",
    type: "text",
    required: true,
    placeholder: "Contoh: Libur Idul Fitri",
  },
  {
    key: "tipe",
    label: "Jenis Agenda",
    type: "select",
    required: true,
    options: ["libur", "kegiatan"],
  },
];

// --- Grouping & Filtering Logic
const filteredHolidaysGrouped = computed(() => {
  if (!Array.isArray(holidays.value)) return [];

  // Filter based on Selected Academic Year (Tapel) and Search Query
  const filtered = holidays.value.filter((event) => {
    const matchTapel = event.tahun_pelajaran === selectedTapel.value;
    const matchSearch = searchQuery.value
      ? event.keterangan
          ?.toLowerCase()
          .includes(searchQuery.value.toLowerCase())
      : true;
    return matchTapel && matchSearch;
  });

  // Sort chronologically by start date
  filtered.sort(
    (a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai),
  );

  // Group by Month of tanggal_mulai (e.g. "Juli 2026")
  const groups = {};
  filtered.forEach((event) => {
    if (!event.tanggal_mulai) return;
    const date = new Date(event.tanggal_mulai + "T00:00:00");
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    if (!groups[monthKey]) {
      groups[monthKey] = {
        monthKey,
        monthName,
        events: [],
      };
    }
    groups[monthKey].events.push(event);
  });

  return Object.values(groups).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey),
  );
});

// --- Event Date Range Formatter (Premium indonesian locale range)
const formatEventRange = (event) => {
  if (!event.tanggal_mulai) return "";
  const start = new Date(event.tanggal_mulai + "T00:00:00");
  const options = { day: "numeric", month: "long", year: "numeric" };

  if (event.tanggal_mulai === event.tanggal_selesai || !event.tanggal_selesai) {
    return start.toLocaleDateString("id-ID", options);
  }

  const end = new Date(event.tanggal_selesai + "T00:00:00");

  // If same month and same year: "17 - 20 Mei 2026"
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
  }

  // If different months but same year: "17 Mei - 20 Juni 2026"
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString("id-ID", { day: "numeric", month: "long" })} - ${end.toLocaleDateString("id-ID", options)}`;
  }

  // If different years: "17 Des 2025 - 5 Jan 2026"
  return `${start.toLocaleDateString("id-ID", options)} - ${end.toLocaleDateString("id-ID", options)}`;
};

// --- CRUD Actions
const openCreateModal = () => {
  modalMode.value = "create";
  const todayStr = new Date().toISOString().substring(0, 10);
  editingItem.value = {
    tanggal_mulai: todayStr,
    tanggal_selesai: todayStr,
    keterangan: "",
    tipe: "libur",
  };
  showModal.value = true;
};

const openEditModal = (item) => {
  modalMode.value = "edit";
  editingItem.value = { ...item };
  showModal.value = true;
};

const handleFormSubmit = async (formData) => {
  // Validate range
  if (formData.tanggal_selesai < formData.tanggal_mulai) {
    Notify.failure("Tanggal selesai tidak boleh mendahului tanggal mulai!");
    return;
  }

  // Automatically calculate Academic Year based on the start date
  const { tahunPelajaran } = dapatkanTahunDanSemester(formData.tanggal_mulai);
  formData.tahun_pelajaran = tahunPelajaran;

  let success = false;
  if (modalMode.value === "create") {
    success = await createItem(formData);
  } else {
    success = await updateItem(editingItem.value.id, formData);
  }

  if (success) {
    showModal.value = false;
  }
};

const handleDelete = (item) => {
  deleteItem(item.id, `agenda "${item.keterangan}"`);
};

// --- Settings Actions
const fetchWeeklyHoliday = async () => {
  if (!selectedTapel.value) return;
  try {
    const data = await fetchFromApi("PengaturanTapel", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: selectedTapel.value,
    });
    if (Array.isArray(data) && data.length > 0) {
      const match = data.find(
        (item) => item.tahun_pelajaran === selectedTapel.value,
      );
      if (match) {
        hariLiburMingguan.value = parseInt(match.hari_libur_mingguan);
        settingsId.value = match.id;
        return;
      }
    }
    // Default fallback
    hariLiburMingguan.value = 0;
    settingsId.value = null;
  } catch (err) {
    console.error("Gagal memuat pengaturan hari libur:", err);
  }
};

const saveWeeklyHoliday = async () => {
  if (!selectedTapel.value) return;
  isSavingSettings.value = true;
  try {
    const payload = {
      tahun_pelajaran: selectedTapel.value,
      hari_libur_mingguan: hariLiburMingguan.value,
    };

    let success = false;
    if (settingsId.value) {
      const response = await putToApi(
        "PengaturanTapel",
        settingsId.value,
        payload,
      );
      success = response.success;
    } else {
      const response = await postToApi("PengaturanTapel", payload);
      success = response.success;
    }

    if (success) {
      Notify.success("Pengaturan libur mingguan disimpan.");
      await fetchWeeklyHoliday();
    } else {
      Notify.failure("Gagal menyimpan pengaturan.");
    }
  } catch (err) {
    console.error("Gagal simpan:", err);
    Notify.failure(`Gagal menyimpan: ${err.message}`);
  } finally {
    isSavingSettings.value = false;
  }
};

watch(selectedTapel, async () => {
  await fetchWeeklyHoliday();
});

// --- Lifecycle
onMounted(async () => {
  // Set default Selected Tapel based on today's date
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentInfo = dapatkanTahunDanSemester(todayStr);
  selectedTapel.value = currentInfo.tahunPelajaran;

  await fetchWeeklyHoliday();
  await loadData("KalenderPendidikan");
});
</script>
