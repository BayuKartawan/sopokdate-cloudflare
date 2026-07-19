<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title and Actions -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6"
      >
        <div>
          <h2
            class="text-xl sm:text-2xl font-bold flex items-center gap-2"
            :style="{ color: 'var(--text-heading)' }"
          >
            <Calendar class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Kalender Pendidikan
          </h2>
          <p class="text-sm theme-text-muted mt-1">
            Kelola hari libur nasional, libur sekolah, dan agenda kegiatan
            madrasah
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 self-start sm:self-auto">
          <!-- Print Button -->
          <BaseButton
            text="Cetak Kalender"
            @click="openPrintPreview"
            class="!bg-[var(--bg-tertiary)] !text-[var(--text-primary)] hover:!bg-[var(--bg-secondary)] shadow-lg"
          >
            <template #icon>
              <Printer class="w-4 h-4" />
            </template>
          </BaseButton>

          <!-- Add Button (Admin Only) -->
          <BaseButton
            v-if="isAdmin"
            text="Tambah Agenda / Libur"
            @click="openCreateModal"
            class="!bg-emerald-600 !text-white hover:!bg-emerald-500 shadow-lg shadow-emerald-900/20"
          >
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
          </BaseButton>
        </div>
      </div>

      <!-- Filters & Stats Section -->
      <div
        class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-xl border theme-bg-secondary theme-border mb-6"
      >
        <!-- Academic Year Selector -->
        <div class="flex flex-col gap-1.5 min-w-[180px]">
          <label class="text-xs font-semibold theme-text-muted"
            >Tahun Pelajaran</label
          >
          <select
            v-model="selectedTapel"
            class="h-10 px-3 rounded-lg theme-input theme-border-input border outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          >
            <option v-for="opt in tapelOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <!-- Weekly Holiday Setting -->
        <div class="flex flex-col gap-1.5 min-w-[220px]">
          <label class="text-xs font-semibold theme-text-muted"
            >Hari Libur Mingguan</label
          >
          <div class="flex items-center gap-2">
            <select
              v-model="hariLiburMingguan"
              :disabled="!isAdmin || isSavingSettings"
              class="h-10 px-3 rounded-lg theme-input theme-border-input border outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
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
              class="!bg-[var(--bg-tertiary)] !text-[var(--text-primary)] hover:!bg-[var(--bg-secondary)] !h-10 !px-4 !py-0 shrink-0"
            />
          </div>
        </div>

        <!-- Search Filter -->
        <div class="flex-1 md:max-w-xs flex flex-col gap-1.5">
          <label class="text-xs font-semibold theme-text-muted">Cari Agenda</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Ketik keterangan agenda..."
            class="h-10 px-3 rounded-lg theme-input theme-border-input border outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
        </div>
      </div>

      <!-- Main Display -->
      <div
        class="rounded-xl border theme-border theme-bg-surface overflow-hidden"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-16">
          <Loader2
            class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3"
          />
          <p class="theme-text-muted text-sm">Memuat agenda pendidikan...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredHolidaysGrouped.length === 0"
          class="text-center py-16 px-4"
        >
          <CalendarOff
            class="w-16 h-16 theme-text-faint mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="theme-text-muted font-semibold text-lg">Tidak ada agenda</p>
          <p class="theme-text-faint text-sm mt-1">
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
              class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b theme-border pb-2 flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              {{ group.monthName }}
            </h3>

            <!-- Events List in Month -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="event in group.events"
                :key="event.id"
                class="flex items-start justify-between p-4 rounded-xl border theme-border theme-bg-card hover:border-[var(--border-secondary)] transition-all duration-200 group"
              >
                <div class="space-y-2">
                  <!-- Date and Badge -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold theme-text-secondary">
                      {{ formatEventRange(event) }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border uppercase"
                      :class="
                        event.tipe === 'libur'
                          ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                      "
                    >
                      {{
                        event.tipe === "libur" ? "Libur Sekolah" : "Kegiatan"
                      }}
                    </span>
                  </div>

                  <!-- Description -->
                  <p class="text-sm font-semibold theme-text pr-4">
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
                    class="p-1.5 rounded-lg theme-text-muted hover:text-amber-600 dark:hover:text-amber-400 hover:bg-[var(--bg-secondary)] transition-colors"
                    title="Edit Agenda"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleDelete(event)"
                    class="p-1.5 rounded-lg theme-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-[var(--bg-secondary)] transition-colors"
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

      <!-- Print Preview Modal (A4 Landscape, 1 bulan per lembar) -->
      <Teleport to="body">
        <div
          v-if="showPrintPreview"
          class="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col"
        >
          <!-- Controls Bar -->
          <div class="shrink-0 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-zinc-900 border-b border-zinc-800">
            <div class="flex items-center gap-2 min-w-0">
              <h3 class="font-bold text-zinc-200 text-xs sm:text-sm truncate">
                Preview — {{ selectedTapel }}
              </h3>
              <span class="text-xs text-zinc-500 shrink-0">
                ({{ printGroups.length }} bln)
              </span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <BaseButton
                text="Cetak"
                @click="doPrint"
                class="!bg-emerald-600 !text-white hover:!bg-emerald-500 !h-7 !text-xs !px-3"
              >
                <template #icon>
                  <Printer class="w-3 h-3" />
                </template>
              </BaseButton>
              <button
                @click="showPrintPreview = false"
                class="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Range Filter Bar -->
          <div class="shrink-0 flex flex-wrap items-center gap-2 px-3 sm:px-6 py-2 bg-zinc-900 border-b border-zinc-800">
            <span class="text-xs font-semibold text-zinc-400 shrink-0">Rentang:</span>
            <div class="flex items-center gap-1.5">
              <label class="text-xs text-zinc-500 shrink-0">Dari</label>
              <select
                v-model="printFromMonth"
                class="h-7 px-2 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option v-for="opt in printMonthOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex items-center gap-1.5">
              <label class="text-xs text-zinc-500 shrink-0">Sampai</label>
              <select
                v-model="printToMonth"
                class="h-7 px-2 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option v-for="opt in printMonthOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <span class="text-xs text-zinc-500">{{ printGroups.length }} lembar</span>
          </div>

          <!-- Scrollable Preview Area — horizontal scroll on mobile so A4 layout stays intact -->
          <div class="flex-1 overflow-auto bg-zinc-950">
            <div class="flex flex-col items-start sm:items-center py-4 sm:py-8 gap-4 sm:gap-6 px-2 sm:px-0 min-w-0">

              <!-- Empty state -->
              <div v-if="printGroups.length === 0" class="bg-white rounded p-8 text-center text-zinc-400 mt-4 w-full max-w-sm mx-auto">
                Tidak ada agenda pada rentang bulan yang dipilih.
              </div>

              <!-- One page per month — horizontal scroll wrapper on mobile -->
              <div
                v-for="(group, idx) in printGroups"
                :key="group.monthKey"
                class="kalender-page-wrapper"
              >
              <div class="kalender-page">
                <!-- Page Header -->
                <div class="kalender-header">
                  <div class="kalender-header-logo-group">
                    <img
                      src="/assets/images/logo-madrasah.svg"
                      alt="Logo Madrasah"
                      class="kalender-logo"
                    />
                    <div class="kalender-header-title">
                      <div class="kalender-school-name">MI NW Penyenggir</div>
                      <div class="kalender-doc-title">KALENDER PENDIDIKAN</div>
                      <div class="kalender-tapel">Tahun Pelajaran {{ selectedTapel }}</div>
                    </div>
                  </div>
                  <div class="kalender-month-badge">
                    {{ group.monthName }}
                  </div>
                </div>

                <!-- Calendar Grid + Sidebar -->
                <div class="kalender-body">
                  <div class="kalender-grid-wrapper">
                    <div class="kalender-weekdays">
                      <div v-for="day in ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']" :key="day" class="kalender-weekday-cell">
                        {{ day }}
                      </div>
                    </div>
                    <div class="kalender-days">
                      <div
                        v-for="n in getMonthStartOffset(group.monthKey)"
                        :key="'empty-' + n"
                        class="kalender-day-cell kalender-day-empty"
                      ></div>
                      <div
                        v-for="day in getDaysInMonth(group.monthKey)"
                        :key="day"
                        class="kalender-day-cell"
                        :class="getDayCellClass(group.monthKey, day, group.events)"
                      >
                        <span class="kalender-day-number">{{ day }}</span>
                        <span
                          v-if="getDayEventLabel(group.monthKey, day, group.events)"
                          class="kalender-day-event-label"
                        >
                          {{ getDayEventLabel(group.monthKey, day, group.events) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="kalender-sidebar">
                    <div class="kalender-legend">
                      <div class="kalender-legend-title">KETERANGAN</div>
                      <div class="kalender-legend-item">
                        <span class="kalender-legend-dot kalender-legend-dot--libur"></span>
                        <span>Hari Libur Sekolah</span>
                      </div>
                      <div class="kalender-legend-item">
                        <span class="kalender-legend-dot kalender-legend-dot--kegiatan"></span>
                        <span>Kegiatan Madrasah</span>
                      </div>
                      <div class="kalender-legend-item">
                        <span class="kalender-legend-dot kalender-legend-dot--weekly"></span>
                        <span>Libur Mingguan</span>
                      </div>
                    </div>
                    <div class="kalender-event-list">
                      <div class="kalender-event-list-title">AGENDA BULAN INI</div>
                      <div v-if="group.events.length === 0" class="kalender-event-empty">
                        Tidak ada agenda
                      </div>
                      <div
                        v-for="event in group.events"
                        :key="event.id"
                        class="kalender-event-item"
                        :class="event.tipe === 'libur' ? 'kalender-event-item--libur' : 'kalender-event-item--kegiatan'"
                      >
                        <div class="kalender-event-date">{{ formatEventRange(event) }}</div>
                        <div class="kalender-event-desc">{{ event.keterangan }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div class="kalender-footer">
                  <div>Dicetak oleh sistem SOPOKDATE &bull; {{ new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
                  <div>Halaman {{ idx + 1 }} / {{ printGroups.length }}</div>
                </div>
              </div>
              </div><!-- end kalender-page-wrapper -->

            </div>
          </div>

          <!-- Hidden print-only area (rendered off-screen, only visible during window.print()) -->
          <div id="kalender-print-only" aria-hidden="true">
            <div
              v-for="(group, idx) in printGroups"
              :key="'print-' + group.monthKey"
              class="kalender-page"
            >
              <div class="kalender-header">
                <div class="kalender-header-logo-group">
                  <img
                    src="/assets/images/logo-madrasah.svg"
                    alt="Logo Madrasah"
                    class="kalender-logo"
                  />
                  <div class="kalender-header-title">
                    <div class="kalender-school-name">MI NW Penyenggir</div>
                    <div class="kalender-doc-title">KALENDER PENDIDIKAN</div>
                    <div class="kalender-tapel">Tahun Pelajaran {{ selectedTapel }}</div>
                  </div>
                </div>
                <div class="kalender-month-badge">{{ group.monthName }}</div>
              </div>
              <div class="kalender-body">
                <div class="kalender-grid-wrapper">
                  <div class="kalender-weekdays">
                    <div v-for="day in ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']" :key="day" class="kalender-weekday-cell">{{ day }}</div>
                  </div>
                  <div class="kalender-days">
                    <div v-for="n in getMonthStartOffset(group.monthKey)" :key="'pe-' + n" class="kalender-day-cell kalender-day-empty"></div>
                    <div
                      v-for="day in getDaysInMonth(group.monthKey)"
                      :key="day"
                      class="kalender-day-cell"
                      :class="getDayCellClass(group.monthKey, day, group.events)"
                    >
                      <span class="kalender-day-number">{{ day }}</span>
                      <span v-if="getDayEventLabel(group.monthKey, day, group.events)" class="kalender-day-event-label">{{ getDayEventLabel(group.monthKey, day, group.events) }}</span>
                    </div>
                  </div>
                </div>
                <div class="kalender-sidebar">
                  <div class="kalender-legend">
                    <div class="kalender-legend-title">KETERANGAN</div>
                    <div class="kalender-legend-item"><span class="kalender-legend-dot kalender-legend-dot--libur"></span><span>Hari Libur Sekolah</span></div>
                    <div class="kalender-legend-item"><span class="kalender-legend-dot kalender-legend-dot--kegiatan"></span><span>Kegiatan Madrasah</span></div>
                    <div class="kalender-legend-item"><span class="kalender-legend-dot kalender-legend-dot--weekly"></span><span>Libur Mingguan</span></div>
                  </div>
                  <div class="kalender-event-list">
                    <div class="kalender-event-list-title">AGENDA BULAN INI</div>
                    <div v-if="group.events.length === 0" class="kalender-event-empty">Tidak ada agenda</div>
                    <div v-for="event in group.events" :key="event.id" class="kalender-event-item" :class="event.tipe === 'libur' ? 'kalender-event-item--libur' : 'kalender-event-item--kegiatan'">
                      <div class="kalender-event-date">{{ formatEventRange(event) }}</div>
                      <div class="kalender-event-desc">{{ event.keterangan }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="kalender-footer">
                <div>Dicetak oleh sistem SOPOKDATE &bull; {{ new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
                <div>Halaman {{ idx + 1 }} / {{ printGroups.length }}</div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

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
import { ref, computed, onMounted, watch } from "vue";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarOff,
  Printer,
  X,
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

// --- Print State
const showPrintPreview = ref(false);
const printFromMonth = ref("");
const printToMonth = ref("");

// Generate all months within the selected tapel range, e.g. "2025/2026" → Jul 2025 – Jun 2026
const allTapelMonths = computed(() => {
  if (!selectedTapel.value) return [];
  const parts = selectedTapel.value.split("/");
  if (parts.length !== 2) return [];
  const startYear = parseInt(parts[0]);
  const endYear = parseInt(parts[1]);
  const months = [];
  // Semester Ganjil: Jul–Des startYear
  for (let m = 7; m <= 12; m++) {
    const monthKey = `${startYear}-${String(m).padStart(2, "0")}`;
    const monthName = new Date(startYear, m - 1, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    months.push({ monthKey, monthName });
  }
  // Semester Genap: Jan–Jun endYear
  for (let m = 1; m <= 6; m++) {
    const monthKey = `${endYear}-${String(m).padStart(2, "0")}`;
    const monthName = new Date(endYear, m - 1, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    months.push({ monthKey, monthName });
  }
  return months;
});

// All months as dropdown options (for range selectors)
const printMonthOptions = computed(() => {
  return allTapelMonths.value.map((m) => ({
    value: m.monthKey,
    label: m.monthName,
  }));
});

// Build a lookup of events grouped by monthKey from filteredHolidaysGrouped
const eventsByMonth = computed(() => {
  const map = {};
  filteredHolidaysGrouped.value.forEach((g) => {
    map[g.monthKey] = g.events;
  });
  return map;
});

// All months in range, each with their events (empty array if no events that month)
const printGroups = computed(() => {
  const all = allTapelMonths.value;
  if (!all.length) return [];
  const from = printFromMonth.value || all[0].monthKey;
  const to = printToMonth.value || all[all.length - 1].monthKey;
  return all
    .filter((m) => m.monthKey >= from && m.monthKey <= to)
    .map((m) => ({
      monthKey: m.monthKey,
      monthName: m.monthName,
      events: eventsByMonth.value[m.monthKey] || [],
    }));
});

const openPrintPreview = () => {
  const all = allTapelMonths.value;
  printFromMonth.value = all.length ? all[0].monthKey : "";
  printToMonth.value = all.length ? all[all.length - 1].monthKey : "";
  showPrintPreview.value = true;
};

// Print using a dedicated iframe so it's completely isolated from page DOM/styles
const doPrint = () => {
  const printEl = document.getElementById("kalender-print-only");
  if (!printEl) return;

  // Use absolute URL for logo so iframe can load it correctly
  const logoUrl = `${window.location.origin}/assets/images/logo-madrasah.svg`;

  // Clone innerHTML and replace relative logo src with absolute URL
  const htmlContent = printEl.innerHTML.replace(
    /src="\/assets\/images\/logo-madrasah\.svg"/g,
    `src="${logoUrl}"`
  );

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<${"style"}>
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4 landscape; margin: 8mm 10mm; }
body { background: white; font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }

/* Page */
.kalender-page {
  width: 277mm;
  min-height: 187mm;
  max-height: 187mm;
  padding: 6mm 8mm;
  box-sizing: border-box;
  background: #ffffff;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 4mm;
  page-break-after: always;
  break-after: page;
  overflow: hidden;
}
.kalender-page:last-child { page-break-after: avoid; break-after: avoid; }

/* Header */
.kalender-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2.5px solid #047857;
  padding-bottom: 3mm;
}
.kalender-header-logo-group { display: flex; align-items: center; gap: 3mm; }
.kalender-logo { width: 14mm; height: 14mm; object-fit: contain; flex-shrink: 0; }
.kalender-header-title { display: flex; flex-direction: column; gap: 0.5mm; }
.kalender-school-name { font-size: 8pt; font-weight: 700; letter-spacing: 0.08em; color: #047857; text-transform: uppercase; }
.kalender-doc-title { font-size: 14pt; font-weight: 800; color: #064e3b; line-height: 1.1; letter-spacing: 0.04em; }
.kalender-tapel { font-size: 8pt; color: #6b7280; font-weight: 500; }
.kalender-month-badge { font-size: 22pt; font-weight: 800; color: #047857; text-align: right; line-height: 1; text-transform: uppercase; letter-spacing: 0.02em; }

/* Body */
.kalender-body { display: flex; gap: 5mm; flex: 1; min-height: 0; }
.kalender-grid-wrapper { flex: 1; display: flex; flex-direction: column; gap: 1.5mm; }

/* Weekday headers */
.kalender-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
.kalender-weekday-cell {
  background: #064e3b !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color: #ffffff !important;
  text-align: center;
  font-size: 14.5pt;
  font-weight: 700;
  padding: 2mm 0;
  letter-spacing: 0.03em;
}

/* Day grid */
.kalender-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e5e7eb; border: 1px solid #e5e7eb; }
.kalender-day-cell {
  background: #ffffff !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  min-height: 14mm;
  padding: 1.5mm;
  display: flex;
  flex-direction: column;
  gap: 0.5mm;
  overflow: hidden;
}
.kalender-day-empty {
  background: #f9fafb !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.kalender-day-number { font-size: 16pt; font-weight: 700; color: #374151; line-height: 1; }
.kalender-day-event-label { font-size: 5pt; color: #374151; line-height: 1.2; word-break: break-word; }

/* Day state colors */
.kalender-day--weekly {
  background: #fef3c7 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.kalender-day--weekly .kalender-day-number { color: #92400e !important; }

.kalender-day--libur {
  background: #fee2e2 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.kalender-day--libur .kalender-day-number { color: #991b1b !important; }
.kalender-day--libur .kalender-day-event-label { color: #7f1d1d !important; }

.kalender-day--kegiatan {
  background: #dbeafe !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.kalender-day--kegiatan .kalender-day-number { color: #1e3a8a !important; }
.kalender-day--kegiatan .kalender-day-event-label { color: #1e40af !important; }

/* Sidebar */
.kalender-sidebar { width: 62mm; flex-shrink: 0; display: flex; flex-direction: column; gap: 3mm; }

/* Legend */
.kalender-legend {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2.5mm 3mm;
  background: #f9fafb !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.kalender-legend-title { font-size: 6.5pt; font-weight: 800; color: #047857; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2mm; border-bottom: 1px solid #d1fae5; padding-bottom: 1.5mm; }
.kalender-legend-item { display: flex; align-items: center; gap: 2mm; font-size: 7pt; color: #374151; margin-bottom: 1.5mm; }
.kalender-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; display: inline-block; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.kalender-legend-dot--libur { background: #fca5a5 !important; border: 1px solid #ef4444; }
.kalender-legend-dot--kegiatan { background: #93c5fd !important; border: 1px solid #3b82f6; }
.kalender-legend-dot--weekly { background: #fcd34d !important; border: 1px solid #f59e0b; }

/* Event list */
.kalender-event-list {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2.5mm 3mm;
  background: #f9fafb !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  overflow: hidden;
}
.kalender-event-list-title { font-size: 6.5pt; font-weight: 800; color: #047857; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2mm; border-bottom: 1px solid #d1fae5; padding-bottom: 1.5mm; }
.kalender-event-empty { font-size: 7pt; color: #9ca3af; font-style: italic; }
.kalender-event-item { margin-bottom: 2.5mm; padding: 1.5mm 2mm; border-radius: 3px; border-left: 3px solid; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
.kalender-event-item--libur { background: #fff1f2 !important; border-left-color: #ef4444; }
.kalender-event-item--kegiatan { background: #eff6ff !important; border-left-color: #3b82f6; }
.kalender-event-date { font-size: 5.5pt; font-weight: 700; margin-bottom: 0.5mm; }
.kalender-event-item--libur .kalender-event-date { color: #b91c1c; }
.kalender-event-item--kegiatan .kalender-event-date { color: #1d4ed8; }
.kalender-event-desc { font-size: 7pt; font-weight: 600; color: #1f2937; line-height: 1.3; }

/* Footer */
.kalender-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #d1fae5; padding-top: 2mm; font-size: 6pt; color: #9ca3af; }
</${"style"}>
</head>
<body>${htmlContent}</body>
</html>`);
  doc.close();

  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
};

// --- Print Calendar Helpers

/** Returns the day-of-week offset (0=Sun) for the 1st of the given monthKey "YYYY-MM" */
const getMonthStartOffset = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).getDay();
};

/** Returns array of day numbers in month for monthKey "YYYY-MM" */
const getDaysInMonth = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, i) => i + 1);
};

/** Check if a specific date (year, month, day) falls within an event range */
const isDateInEvent = (year, month, day, event) => {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const start = event.tanggal_mulai;
  const end = event.tanggal_selesai || event.tanggal_mulai;
  return dateStr >= start && dateStr <= end;
};

/** Returns CSS classes for a calendar day cell */
const getDayCellClass = (monthKey, day, events) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();

  // Check if this day is the weekly holiday
  if (dayOfWeek === hariLiburMingguan.value) {
    return "kalender-day--weekly";
  }

  // Check events — libur takes priority over kegiatan
  for (const event of events) {
    if (isDateInEvent(year, month, day, event)) {
      return event.tipe === "libur"
        ? "kalender-day--libur"
        : "kalender-day--kegiatan";
    }
  }

  return "";
};

/** Returns a short event label for a day if it starts on that day */
const getDayEventLabel = (monthKey, day, events) => {
  const [year, month] = monthKey.split("-").map(Number);
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const event = events.find((e) => e.tanggal_mulai === dateStr);
  if (!event) return "";

  // Truncate long labels for grid cells
  const label = event.keterangan || "";
  return label.length > 18 ? label.substring(0, 16) + "…" : label;
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

<style>
/* =====================================================
   KALENDER PENDIDIKAN — PRINT STYLES
   Target: A4 Landscape (297mm x 210mm), 1 bulan/lembar
   ===================================================== */

/* --- Preview sizing (screen) --- */
.kalender-page-wrapper {
  width: 100%;
  overflow-x: auto;
  /* Show scrollbar hint on mobile */
  -webkit-overflow-scrolling: touch;
}

.kalender-page {
  width: 277mm;
  min-height: 190mm;
  padding: 8mm 10mm;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
  color: #1a1a1a;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 4mm;
  border-radius: 4px;
}

/* Force all text inside kalender-page to use light-mode colors regardless of dark mode */
.kalender-page * {
  color: inherit;
}

.kalender-page .kalender-day-cell {
  background: #ffffff;
}

.kalender-page .kalender-day-empty {
  background: #f9fafb;
}

.kalender-page .kalender-legend,
.kalender-page .kalender-event-list {
  background: #f9fafb;
}

/* --- HEADER --- */
.kalender-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2.5px solid #047857;
  padding-bottom: 3mm;
}

.kalender-header-logo-group {
  display: flex;
  align-items: center;
  gap: 3mm;
}

.kalender-logo {
  width: 14mm;
  height: 14mm;
  object-fit: contain;
  flex-shrink: 0;
}

.kalender-header-title {
  display: flex;
  flex-direction: column;
  gap: 0.5mm;
}

.kalender-school-name {
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #047857;
  text-transform: uppercase;
}

.kalender-doc-title {
  font-size: 14pt;
  font-weight: 800;
  color: #064e3b;
  line-height: 1.1;
  letter-spacing: 0.04em;
}

.kalender-tapel {
  font-size: 8pt;
  color: #6b7280;
  font-weight: 500;
}

.kalender-month-badge {
  font-size: 22pt;
  font-weight: 800;
  color: #047857;
  text-align: right;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* --- BODY: grid + sidebar --- */
.kalender-body {
  display: flex;
  gap: 5mm;
  flex: 1;
}

.kalender-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
}

/* Day-of-week header row */
.kalender-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.kalender-weekday-cell {
  background: #064e3b;
  color: #ffffff;
  text-align: center;
  font-size: 14.5pt;
  font-weight: 700;
  padding: 2mm 0;
  letter-spacing: 0.03em;
}

/* Day cells grid */
.kalender-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e5e7eb;
  border: 1px solid #e5e7eb;
}

.kalender-day-cell {
  background: #ffffff;
  min-height: 14mm;
  padding: 1.5mm;
  display: flex;
  flex-direction: column;
  gap: 0.5mm;
  overflow: hidden;
  position: relative;
}

.kalender-day-empty {
  background: #f9fafb;
}

.kalender-day-number {
  font-size: 16pt;
  font-weight: 700;
  color: #374151;
  line-height: 1;
}

.kalender-day-event-label {
  font-size: 5pt;
  color: #374151;
  line-height: 1.2;
  word-break: break-word;
  hyphens: auto;
}

/* Day color states */
.kalender-day--weekly {
  background: #fef3c7 !important; /* amber-100 */
}
.kalender-day--weekly .kalender-day-number {
  color: #92400e;
}

.kalender-day--libur {
  background: #fee2e2 !important; /* red-100 */
}
.kalender-day--libur .kalender-day-number {
  color: #991b1b;
}
.kalender-day--libur .kalender-day-event-label {
  color: #7f1d1d;
}

.kalender-day--kegiatan {
  background: #dbeafe !important; /* blue-100 */
}
.kalender-day--kegiatan .kalender-day-number {
  color: #1e3a8a;
}
.kalender-day--kegiatan .kalender-day-event-label {
  color: #1e40af;
}

/* --- SIDEBAR --- */
.kalender-sidebar {
  width: 62mm;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3mm;
}

/* Legend */
.kalender-legend {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2.5mm 3mm;
  background: #f9fafb;
}

.kalender-legend-title {
  font-size: 6.5pt;
  font-weight: 800;
  color: #047857;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2mm;
  border-bottom: 1px solid #d1fae5;
  padding-bottom: 1.5mm;
}

.kalender-legend-item {
  display: flex;
  align-items: center;
  gap: 2mm;
  font-size: 7pt;
  color: #374151;
  margin-bottom: 1.5mm;
}

.kalender-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.kalender-legend-dot--libur {
  background: #fca5a5; /* red-300 */
  border: 1px solid #ef4444;
}

.kalender-legend-dot--kegiatan {
  background: #93c5fd; /* blue-300 */
  border: 1px solid #3b82f6;
}

.kalender-legend-dot--weekly {
  background: #fcd34d; /* amber-300 */
  border: 1px solid #f59e0b;
}

/* Event list */
.kalender-event-list {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2.5mm 3mm;
  background: #f9fafb;
  overflow: hidden;
}

.kalender-event-list-title {
  font-size: 6.5pt;
  font-weight: 800;
  color: #047857;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2mm;
  border-bottom: 1px solid #d1fae5;
  padding-bottom: 1.5mm;
}

.kalender-event-empty {
  font-size: 7pt;
  color: #9ca3af;
  font-style: italic;
}

.kalender-event-item {
  margin-bottom: 2.5mm;
  padding: 1.5mm 2mm;
  border-radius: 3px;
  border-left: 3px solid;
}

.kalender-event-item--libur {
  background: #fff1f2;
  border-left-color: #ef4444;
}

.kalender-event-item--kegiatan {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.kalender-event-date {
  font-size: 5.5pt;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 0.5mm;
}

.kalender-event-item--libur .kalender-event-date {
  color: #b91c1c;
}

.kalender-event-item--kegiatan .kalender-event-date {
  color: #1d4ed8;
}

.kalender-event-desc {
  font-size: 7pt;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

/* --- FOOTER --- */
.kalender-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #d1fae5;
  padding-top: 2mm;
  font-size: 6pt;
  color: #9ca3af;
}

/* =====================================================
   PRINT MEDIA QUERY
   ===================================================== */

/* Hidden print-only container — invisible on screen, only used as innerHTML source for iframe print */
#kalender-print-only {
  position: absolute;
  left: -9999px;
  top: 0;
  visibility: hidden;
  pointer-events: none;
  background: white;
}
</style>
