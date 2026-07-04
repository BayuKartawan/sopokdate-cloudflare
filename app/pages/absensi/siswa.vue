<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title and Header Info -->
      <div class="flex flex-col gap-4 mb-6">
        <div>
          <h2
            class="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap"
            :style="{ color: 'var(--text-heading)' }"
          >
            <CalendarCheck class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Absensi Siswa</span>
            <span 
              v-if="selectedClass && hasExistingRecords && !hasUnsavedChanges"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
              Tersimpan di Server
            </span>
            <span 
              v-else-if="selectedClass && hasUnsavedChanges"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-sm"
            >
              <span class="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              Ada Perubahan (Belum Kirim)
            </span>
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Pencatatan dan pengelolaan kehadiran harian siswa madrasah
          </p>
        </div>
      </div>

      <!-- Filter & Date Navigation Section -->
      <div
        class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6"
      >
        <!-- Pilihan Kelas -->
        <div class="flex flex-col gap-1.5 min-w-[240px]">
          <label class="text-xs font-semibold text-zinc-400"
            >Kelas / Rombel</label
          >
          <select
            v-model="selectedClass"
            :disabled="isDisabledDropdown"
            class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="" disabled>-- Pilih Kelas --</option>
            <option
              v-for="kelas in accessibleClasses"
              :key="kelas.id_kelas"
              :value="kelas.id_kelas"
            >
              {{ kelas.nama_kelas }}
            </option>
          </select>
        </div>

        <!-- Date Navigation Bar -->
        <ClientOnly>
          <div class="flex items-center gap-2 flex-1 md:max-w-[480px]">
            <div
              class="flex items-center justify-between bg-zinc-950/40 border border-zinc-700/50 p-2 px-3 rounded-xl flex-1"
            >
              <!-- Arrow Kiri (Mundur) -->
              <button
                type="button"
                @click="ubahTanggal(-1)"
                :disabled="isPrevDisabled || isSaving"
                class="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
                title="Hari Sebelumnya"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>

              <!-- Tanggal Display (Klik untuk buka kalender) -->
              <div
                class="relative text-center px-4 cursor-pointer hover:opacity-80 active:scale-[0.97] transition-all group select-none"
                @click="toggleCalendar"
              >
                <span
                  class="text-xs sm:text-sm font-bold text-zinc-100 block flex items-center justify-center gap-1"
                >
                  {{ formattedTanggal }}
                  <CalendarDays class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                </span>
                <span class="text-[10px] font-mono text-zinc-400 block">
                  Tapel: {{ tapel }} | Semester: {{ semester }}
                </span>
              </div>

              <!-- Arrow Kanan (Maju) -->
              <button
                type="button"
                @click="ubahTanggal(1)"
                :disabled="isNextDisabled || isSaving"
                class="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
                title="Hari Selanjutnya"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>

            <!-- Shortcut Hari Ini -->
            <button
              v-if="tanggal !== hariIniStr"
              type="button"
              @click="tanggal = hariIniStr"
              :disabled="isSaving"
              class="h-10 px-3.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 active:scale-95 transition-all text-xs font-semibold shrink-0 disabled:opacity-50"
            >
              Hari Ini
            </button>
          </div>
          <template #fallback>
            <div
              class="h-14 bg-zinc-850/40 border border-zinc-800/40 rounded-xl flex-1 md:max-w-[480px] animate-pulse"
            ></div>
          </template>
        </ClientOnly>
      </div>

      <!-- Custom Calendar Popup Overlay -->
      <Teleport to="body">
        <Transition name="calendar-fade">
          <div
            v-if="showCalendar"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            @click.self="showCalendar = false"
          >
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showCalendar = false"></div>

            <!-- Calendar Card -->
            <div class="relative z-10 w-full max-w-sm bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
              <!-- Calendar Header -->
              <div class="flex items-center justify-between p-4 bg-zinc-800/60 border-b border-zinc-700/40">
                <button
                  type="button"
                  @click="calendarPrevMonth"
                  :disabled="!canCalendarGoPrev"
                  class="p-2 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <h3 class="text-sm font-bold text-zinc-100 select-none">
                  {{ calendarMonthLabel }}
                </h3>
                <button
                  type="button"
                  @click="calendarNextMonth"
                  :disabled="!canCalendarGoNext"
                  class="p-2 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>

              <!-- Day-of-week header -->
              <div class="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-2 px-3 border-b border-zinc-800/60">
                <span v-for="d in ['Min','Sen','Sel','Rab','Kam','Jum','Sab']" :key="d">{{ d }}</span>
              </div>

              <!-- Calendar Grid -->
              <div class="grid grid-cols-7 gap-0.5 p-3">
                <template v-for="(cell, i) in calendarCells" :key="i">
                  <!-- Empty cell -->
                  <div v-if="!cell.day" class="h-9"></div>
                  <!-- Day cell -->
                  <button
                    v-else
                    type="button"
                    :disabled="cell.disabled"
                    @click="selectCalendarDate(cell)"
                    class="h-9 w-full rounded-lg text-xs font-semibold transition-all duration-150"
                    :class="[
                      cell.isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 scale-105'
                        : cell.isToday
                          ? 'bg-zinc-700/60 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40 hover:bg-emerald-600/20'
                          : cell.disabled
                            ? 'text-zinc-500 cursor-not-allowed'
                            : cell.isHoliday
                              ? 'text-red-600 dark:text-red-400/70 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300'
                              : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100',
                    ]"
                  >
                    {{ cell.day }}
                  </button>
                </template>
              </div>

              <!-- Calendar Footer -->
              <div class="flex items-center justify-between p-3 pt-1 border-t border-zinc-800/40">
                <span class="text-[10px] text-zinc-500">
                  {{ userRole === 'admin' ? 'Akses 6 bulan terakhir' : 'Akses 7 hari terakhir' }}
                </span>
                <button
                  v-if="tanggal !== hariIniStr"
                  type="button"
                  @click="selectToday"
                  class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors px-2 py-1 rounded-md hover:bg-emerald-500/10"
                >
                  Hari Ini
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Banner for Teachers -->
      <div v-if="userRole === 'guru' && selectedClass && !isLoadingKelas && !isLoadingGtk" class="w-full">
        <!-- Case 1: Guru Mapel is editing their scheduled class today -->
        <div
          v-if="isGuruMapel && isAuthorizedToEdit"
          class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2.5 mb-6"
        >
          <CalendarCheck class="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span class="font-bold">Akses Guru Mapel:</span> Anda memiliki akses untuk mengisi absensi kelas ini karena terjadwal mengajar pada hari {{ namaHariSelected }}.
          </div>
        </div>

        <!-- Case 2: Wali Kelas is editing their wali class -->
        <div
          v-else-if="selectedClass === waliKelasClassId && isAuthorizedToEdit"
          class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2.5 mb-6"
        >
          <CalendarCheck class="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span class="font-bold">Akses Wali Kelas:</span> Anda sedang mengelola absensi untuk kelas binaan Anda ({{ waliKelasClassName }}).
          </div>
        </div>

        <!-- Case 3: Read-only access -->
        <div
          v-else
          class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2.5 mb-6"
        >
          <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <span class="font-bold">Akses Terbatas (Hanya Lihat):</span> Anda tidak memiliki wewenang untuk mengubah absensi kelas ini pada tanggal terpilih. Izin edit hanya diberikan untuk kelas binaan (Wali Kelas) atau kelas yang Anda ajar sesuai jadwal hari ini.
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div
        class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-16">
          <Loader2
            class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3"
          />
          <p class="text-zinc-400 text-sm">Memuat daftar siswa...</p>
        </div>

        <!-- Empty State (No Class Selected) -->
        <div v-else-if="!selectedClass" class="text-center py-16 px-4">
          <GraduationCap
            class="w-16 h-16 text-zinc-500 mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 font-semibold text-lg">Kelas belum dipilih</p>
          <p class="text-zinc-500 text-sm mt-1">
            Silakan pilih kelas terlebih dahulu untuk melihat dan menginput
            absensi.
          </p>
        </div>

        <!-- Hari Minggu / Libur State -->
        <div v-else-if="isHariLiburAtauMinggu" class="text-center py-16 px-4">
          <CalendarOff
            class="w-16 h-16 text-amber-600 dark:text-amber-500 mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="text-zinc-100 font-bold text-lg">{{ keteranganLibur }}</p>
          <p class="text-zinc-500 text-sm mt-1">
            Tidak ada aktivitas pengisian absensi siswa pada hari libur sekolah.
          </p>
        </div>

        <!-- Empty State (No Students) -->
        <div v-else-if="students.length === 0" class="text-center py-16 px-4">
          <Users
            class="w-16 h-16 text-zinc-500 mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 font-semibold text-lg">Tidak ada siswa</p>
          <p class="text-zinc-500 text-sm mt-1">
            Tidak ditemukan data siswa aktif di kelas {{ currentClassName }}.
          </p>
        </div>

        <!-- Attendance Table -->
        <div v-else class="flex flex-col">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold"
                >
                  <th class="py-4 px-4 text-center w-12">No</th>
                  <th class="py-4 px-4">Nama Siswa</th>
                  <th class="py-4 px-4 w-28 text-center">NISN</th>
                  <th class="py-4 px-4 text-center w-80">Status Kehadiran</th>
                  <th class="py-4 px-4 min-w-48">Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
                <tr
                  v-for="(siswa, idx) in students"
                  :key="siswa.siswa_id"
                  class="hover:bg-zinc-800/10 transition-colors"
                >
                  <td class="py-4 px-4 text-center text-zinc-500 font-mono">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-4 px-4 font-semibold text-zinc-100">
                    {{ toTitleCase(siswa.nama) }}
                  </td>
                  <td class="py-4 px-4 text-center text-zinc-400 font-mono">
                    {{ siswa.nisn || "-" }}
                  </td>
                  <td class="py-3 px-4">
                    <!-- Status Button Pills Group -->
                    <div
                      class="flex justify-center items-center gap-1.5 bg-zinc-950/40 p-1 rounded-lg border border-zinc-800/80 w-fit mx-auto"
                    >
                      <!-- H (Hadir) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'H')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'H'
                            ? 'bg-emerald-600/90 text-white font-bold shadow-md shadow-emerald-950/20'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200',
                        ]"
                      >
                        Hadir
                      </button>

                      <!-- S (Sakit) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'S')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'S'
                            ? 'bg-amber-600/90 text-white font-bold shadow-md shadow-amber-950/20'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200',
                        ]"
                      >
                        Sakit
                      </button>

                      <!-- I (Izin) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'I')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'I'
                            ? 'bg-blue-600/90 text-white font-bold shadow-md shadow-blue-950/20'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200',
                        ]"
                      >
                        Izin
                      </button>

                      <!-- A (Alpa) -->
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'A')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'A'
                            ? 'bg-red-600/90 text-white font-bold shadow-md shadow-red-950/20'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                          'px-3.5 py-1.5 rounded-md text-xs transition-all duration-200',
                        ]"
                      >
                        Alpa
                      </button>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="text"
                      v-model="siswa.keterangan"
                      placeholder="Catatan (opsional)..."
                      :disabled="isDisabled"
                      class="w-full h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-850 text-zinc-200 placeholder-zinc-500 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Buttons -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-800/20 border-t border-zinc-700/40"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-zinc-400">
                Menampilkan
                <span class="font-bold text-zinc-300">{{ students.length }}</span>
                siswa
              </span>
              <span class="text-zinc-400 hidden sm:inline">|</span>
              <!-- Status Badge in footer -->
              <span 
                v-if="hasExistingRecords && !hasUnsavedChanges"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              >
                Sudah Terkirim (Tersimpan)
              </span>
              <span 
                v-else-if="hasUnsavedChanges"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
              >
                Belum Dikirim (Ada Perubahan)
              </span>
              <span 
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/30"
              >
                Belum Ada Data
              </span>
            </div>
            <BaseButton
              v-if="!isDisabled"
              :text="buttonText"
              @click="saveAttendance"
              :disabled="isSaving || (!hasUnsavedChanges && hasExistingRecords)"
              :class="buttonClass"
            >
              <template #icon>
                <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                <component v-else :is="buttonIcon" class="w-4 h-4" />
              </template>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  CalendarCheck,
  CalendarDays,
  Loader2,
  GraduationCap,
  Users,
  Save,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  CheckCircle2,
  CloudUpload,
  Send,
} from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";

// --- Services & Config
const { Notify } = useNotiflix();
const { getUserRole, getGtkId, getUserData } = useAuth();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// --- States
const tanggal = ref("");
const selectedClass = ref("");
const students = ref([]);
const tapel = ref("");
const semester = ref("");
const daftarHariLibur = ref([]); // Array of holiday events
const hariLiburMingguanIndex = ref(0); // 0 = Minggu by default

const userRole = ref(getUserRole() || "");
const userGtkId = ref(null);
const isWaliKelas = ref(false);
const waliKelasClassName = ref("");
const waliKelasClassId = ref("");

const originalStudents = ref([]);
const hasExistingRecords = ref(false);

const { cardData: jadwalData, loadData: loadJadwal } = useTableData();

const isLoading = ref(false);
const isLoadingKelas = ref(false);
const isLoadingGtk = ref(false);
const isSaving = ref(false);
const showCalendar = ref(false);
const calendarViewDate = ref(new Date()); // bulan yang sedang ditampilkan di kalender

// --- Computed Date Constraints
const hariIniStr = computed(() => {
  return getLocalDateString(new Date());
});

const batasanMinStr = computed(() => {
  const date = new Date();
  if (userRole.value === "admin") {
    date.setMonth(date.getMonth() - 6); // Batasi 6 bulan (1 semester) ke belakang
  } else {
    date.setDate(date.getDate() - 7); // Batasi 1 minggu (7 hari) ke belakang
  }
  return getLocalDateString(date);
});

const isPrevDisabled = computed(() => {
  if (!tanggal.value) return true;
  return tanggal.value <= batasanMinStr.value;
});

const isNextDisabled = computed(() => {
  if (!tanggal.value) return true;
  return tanggal.value >= hariIniStr.value;
});

// Batasi input manual / datepicker di luar jangkauan yang diperbolehkan
watch(tanggal, (newVal) => {
  if (!newVal) return;
  if (newVal < batasanMinStr.value) {
    tanggal.value = batasanMinStr.value;
    Notify.warning(`Pilihan tanggal dibatasi maksimal sampai ${batasanMinStr.value}`);
  } else if (newVal > hariIniStr.value) {
    tanggal.value = hariIniStr.value;
    Notify.warning("Pilihan tanggal tidak boleh melebihi hari ini");
  }
});

const isHariLiburMingguan = computed(() => {
  if (!tanggal.value) return false;
  const parts = tanggal.value.split("-");
  const date = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  return date.getDay() === hariLiburMingguanIndex.value;
});

const matchingLiburEvent = computed(() => {
  if (!tanggal.value || !Array.isArray(daftarHariLibur.value)) return null;
  return daftarHariLibur.value.find((h) => {
    return (
      tanggal.value >= h.tanggal_mulai && tanggal.value <= h.tanggal_selesai
    );
  });
});

const isHariLibur = computed(() => {
  return !!matchingLiburEvent.value;
});

const isHariLiburAtauMinggu = computed(() => {
  return isHariLiburMingguan.value || isHariLibur.value;
});

const NAMA_HARI = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const namaHariLiburMingguan = computed(() => {
  return NAMA_HARI[hariLiburMingguanIndex.value] || "Minggu";
});

const keteranganLibur = computed(() => {
  if (isHariLiburMingguan.value) {
    return `Hari ${namaHariLiburMingguan.value} - Libur Mingguan`;
  }
  if (matchingLiburEvent.value) {
    return `Hari Libur - ${matchingLiburEvent.value.keterangan}`;
  }
  return "";
});

const formattedTanggal = computed(() => {
  if (!tanggal.value) return "";
  const parts = tanggal.value.split("-");
  const date = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const localeDateStr = date.toLocaleDateString("id-ID", options);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Hari Ini - ${localeDateStr}`;
  } else if (diffDays === 1) {
    return `Kemarin - ${localeDateStr}`;
  } else {
    return localeDateStr;
  }
});

// --- Computed Properties
const currentClassName = computed(() => {
  if (!selectedClass.value) return "";
  const match = dataKelas.value.find((k) => k.id_kelas === selectedClass.value);
  return match ? match.nama_kelas : selectedClass.value;
});

const namaHariSelected = computed(() => {
  if (!tanggal.value) return "";
  const parts = tanggal.value.split("-");
  const date = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  return NAMA_HARI[date.getDay()];
});

const guruMapelClassesOnDay = computed(() => {
  if (userRole.value !== "guru" || !userGtkId.value || !namaHariSelected.value) {
    return [];
  }
  const schedules = (jadwalData.value || []).filter((sch) => {
    const isGuru = String(sch.guru_id) === String(userGtkId.value);
    const isDay = String(sch.hari).toLowerCase() === namaHariSelected.value.toLowerCase();
    return isGuru && isDay;
  });
  const classIds = schedules.map((sch) => sch.kelas_id);
  return [...new Set(classIds)];
});

const isGuruMapel = computed(() => {
  if (!selectedClass.value) return false;
  return guruMapelClassesOnDay.value.includes(selectedClass.value);
});

const hasEditRights = computed(() => {
  if (userRole.value === "admin") return true;
  if (userRole.value === "guru") {
    return (isWaliKelas.value && !!waliKelasClassId.value) || guruMapelClassesOnDay.value.length > 0;
  }
  return false;
});

const accessibleClasses = computed(() => {
  if (userRole.value === "admin") {
    return dataKelas.value;
  }
  if (userRole.value === "guru") {
    const hasSchedules = guruMapelClassesOnDay.value.length > 0;
    const hasWali = isWaliKelas.value && !!waliKelasClassId.value;
    
    if (!hasSchedules && !hasWali) {
      return dataKelas.value;
    }
    
    const list = [];
    if (hasWali) {
      const waliClass = dataKelas.value.find(c => c.id_kelas === waliKelasClassId.value);
      if (waliClass) list.push(waliClass);
    }
    
    guruMapelClassesOnDay.value.forEach(id => {
      if (id === waliKelasClassId.value) return;
      const matched = dataKelas.value.find(c => c.id_kelas === id);
      if (matched) list.push(matched);
    });
    
    return list;
  }
  return [];
});

const isDisabledDropdown = computed(() => {
  if (isSaving.value) return true;
  if (userRole.value === "guru") {
    if (hasEditRights.value && accessibleClasses.value.length <= 1) {
      return true;
    }
  }
  return false;
});

const isAuthorizedToEdit = computed(() => {
  if (userRole.value === "admin") return true;
  if (userRole.value === "guru") {
    const isWaliOfSelected = isWaliKelas.value && selectedClass.value === waliKelasClassId.value;
    if (isWaliOfSelected) return true;
    if (isGuruMapel.value) return true;
  }
  return false;
});

// Checks if input is disabled (user not authorized, saving, or Sunday/holiday)
const isDisabled = computed(() => {
  if (isSaving.value || isHariLiburAtauMinggu.value) return true;
  return !isAuthorizedToEdit.value;
});

const hasUnsavedChanges = computed(() => {
  if (students.value.length === 0) return false;
  if (originalStudents.value.length !== students.value.length) return true;
  
  return students.value.some((s, idx) => {
    const orig = originalStudents.value[idx];
    if (!orig) return true;
    return s.status !== orig.status || s.keterangan !== orig.keterangan;
  });
});

const buttonText = computed(() => {
  if (isSaving.value) return "Mengirim...";
  if (hasUnsavedChanges.value) {
    return hasExistingRecords.value ? "Kirim Perubahan Absensi" : "Kirim Absensi Sekarang";
  }
  if (hasExistingRecords.value) {
    return "Absensi Sudah Terkirim";
  }
  return "Kirim Absensi";
});

const buttonClass = computed(() => {
  if (hasUnsavedChanges.value) {
    return "!bg-amber-600 !text-white hover:!bg-amber-500 shadow-lg shadow-amber-900/20";
  }
  if (hasExistingRecords.value) {
    return "!bg-zinc-800/40 !text-zinc-500 border border-zinc-700/40 cursor-not-allowed hover:!bg-zinc-800/40 shadow-none";
  }
  return "!bg-emerald-600 !text-white hover:!bg-emerald-500 shadow-lg shadow-emerald-900/20";
});

const buttonIcon = computed(() => {
  if (hasUnsavedChanges.value) {
    return CloudUpload;
  }
  if (hasExistingRecords.value) {
    return CheckCircle2;
  }
  return Send;
});

// --- Methods
const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

function cleanName(name) {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

const updateStatus = (siswa, newStatus) => {
  siswa.status = newStatus;
};

const ubahTanggal = (offset) => {
  if (!tanggal.value) return;
  const parts = tanggal.value.split("-");
  const current = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  current.setDate(current.getDate() + offset);
  const nextDateStr = getLocalDateString(current);

  // Batasi agar tidak melampaui batas atas (hari ini) atau batas bawah (7 hari lalu)
  if (nextDateStr < batasanMinStr.value || nextDateStr > hariIniStr.value) {
    return;
  }
  tanggal.value = nextDateStr;
};

// --- Custom Calendar Popup Logic
const toggleCalendar = () => {
  if (isSaving.value) return;
  // Set calendar view to the currently selected month
  if (tanggal.value) {
    const parts = tanggal.value.split("-");
    calendarViewDate.value = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      1,
    );
  }
  showCalendar.value = !showCalendar.value;
};

const calendarMonthLabel = computed(() => {
  return calendarViewDate.value.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
});

const canCalendarGoPrev = computed(() => {
  const viewYear = calendarViewDate.value.getFullYear();
  const viewMonth = calendarViewDate.value.getMonth();
  const minParts = batasanMinStr.value.split("-");
  const minYear = parseInt(minParts[0], 10);
  const minMonth = parseInt(minParts[1], 10) - 1;
  return viewYear > minYear || (viewYear === minYear && viewMonth > minMonth);
});

const canCalendarGoNext = computed(() => {
  const viewYear = calendarViewDate.value.getFullYear();
  const viewMonth = calendarViewDate.value.getMonth();
  const maxParts = hariIniStr.value.split("-");
  const maxYear = parseInt(maxParts[0], 10);
  const maxMonth = parseInt(maxParts[1], 10) - 1;
  return viewYear < maxYear || (viewYear === maxYear && viewMonth < maxMonth);
});

const calendarPrevMonth = () => {
  const d = new Date(calendarViewDate.value);
  d.setMonth(d.getMonth() - 1);
  calendarViewDate.value = d;
};

const calendarNextMonth = () => {
  const d = new Date(calendarViewDate.value);
  d.setMonth(d.getMonth() + 1);
  calendarViewDate.value = d;
};

// Check if a specific date string falls on a holiday in the calendar
function isDateHolidayOrWeekly(dateStr) {
  const parts = dateStr.split("-");
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10),
  );
  // Hari libur mingguan
  if (d.getDay() === hariLiburMingguanIndex.value) return true;
  // Hari libur kalender
  if (Array.isArray(daftarHariLibur.value)) {
    return daftarHariLibur.value.some(
      (h) => dateStr >= h.tanggal_mulai && dateStr <= h.tanggal_selesai,
    );
  }
  return false;
}

const calendarCells = computed(() => {
  const year = calendarViewDate.value.getFullYear();
  const month = calendarViewDate.value.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Min, 1=Sen...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null });
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isOutOfRange =
      dateStr < batasanMinStr.value || dateStr > hariIniStr.value;
    const isToday = dateStr === hariIniStr.value;
    const isSelected = dateStr === tanggal.value;
    const isHoliday = isDateHolidayOrWeekly(dateStr);

    cells.push({
      day: d,
      dateStr,
      disabled: isOutOfRange,
      isToday,
      isSelected,
      isHoliday: !isOutOfRange && isHoliday,
    });
  }

  return cells;
});

const selectCalendarDate = (cell) => {
  if (cell.disabled || !cell.dateStr) return;
  tanggal.value = cell.dateStr;
  showCalendar.value = false;
};

const selectToday = () => {
  tanggal.value = hariIniStr.value;
  showCalendar.value = false;
};

// Auto calculate Tapel and Semester when date changes
watch(
  tanggal,
  (newDate) => {
    if (!newDate) return;
    const result = dapatkanTahunDanSemester(newDate);
    tapel.value = result.tahunPelajaran;
    semester.value = result.semester;
  },
  { immediate: true },
);

const fetchHolidays = async () => {
  if (!tapel.value) return;
  try {
    // 1. Fetch holidays
    const data = await fetchFromApi("kalender_pendidikan", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: tapel.value,
    });
    if (Array.isArray(data)) {
      daftarHariLibur.value = data.filter((item) => item.tipe === "libur");
    }

    // 2. Fetch weekly holiday configuration
    const configData = await fetchFromApi("pengaturan_tapel", false, null, {
      filter_col: "tahun_pelajaran",
      filter_val: tapel.value,
    });
    if (Array.isArray(configData) && configData.length > 0) {
      const match = configData.find(
        (item) => item.tahun_pelajaran === tapel.value,
      );
      if (match) {
        hariLiburMingguanIndex.value = parseInt(match.hari_libur_mingguan);
        return;
      }
    }
    // Default fallback
    hariLiburMingguanIndex.value = 0; // Default to Sunday (0)
  } catch (err) {
    console.error("Gagal memuat kalender pendidikan:", err);
  }
};

// Fetch holidays when tapel changes
watch(tapel, async (newTapel) => {
  if (newTapel) {
    await fetchHolidays();
  }
});

// Refetch students when Class or Date changes
watch([selectedClass, tanggal], async ([newClass, newDate]) => {
  if (!newClass || !newDate || isHariLiburAtauMinggu.value) {
    students.value = [];
    return;
  }

  await fetchStudents();
});

watch(accessibleClasses, (newClasses) => {
  if (isLoadingKelas.value || isLoadingGtk.value) return;
  if (userRole.value === "admin") return;
  
  if (hasEditRights.value && newClasses.length > 0) {
    const stillExists = newClasses.some(c => c.id_kelas === selectedClass.value);
    if (!stillExists) {
      selectedClass.value = newClasses[0].id_kelas;
    }
  }
});

const fetchStudents = async () => {
  isLoading.value = true;
  try {
    const response = await authenticatedFetch(
      `/api/absensi?tanggal=${tanggal.value}&kelas_id=${encodeURIComponent(selectedClass.value)}`,
    );
    const data = await response.json();

    if (Array.isArray(data)) {
      // If at least one student has a non-null status, it means attendance was already saved before
      hasExistingRecords.value = data.some(s => s.status !== null && s.status !== undefined);
      
      // Map data and assign default status "H" if status is null
      students.value = data.map((siswa) => ({
        siswa_id: siswa.siswa_id,
        nama: siswa.nama,
        nisn: siswa.nisn,
        nis_lokal: siswa.nis_lokal,
        status: siswa.status || "H",
        keterangan: siswa.keterangan || "",
      }));
      originalStudents.value = JSON.parse(JSON.stringify(students.value));
    } else {
      students.value = [];
      originalStudents.value = [];
      hasExistingRecords.value = false;
    }
  } catch (err) {
    console.error("Gagal memuat absensi siswa:", err);
    Notify.failure("Gagal mengambil data absensi siswa");
    students.value = [];
    originalStudents.value = [];
    hasExistingRecords.value = false;
  } finally {
    isLoading.value = false;
  }
};

const saveAttendance = async () => {
  if (students.value.length === 0 || isHariLiburAtauMinggu.value) return;

  isSaving.value = true;
  try {
    const uData = getUserData();
    const inputBy = uData ? uData.userId : null;

    const payload = {
      tanggal: tanggal.value,
      kelas_id: selectedClass.value,
      tahun_pelajaran: tapel.value,
      semester: semester.value,
      input_by: inputBy,
      data: students.value.map((s) => ({
        siswa_id: s.siswa_id,
        status: s.status,
        keterangan: s.keterangan,
      })),
    };

    const response = await authenticatedFetch("/api/absensi", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      Notify.success("Absensi kelas berhasil disimpan.");
      hasExistingRecords.value = true;
      originalStudents.value = JSON.parse(JSON.stringify(students.value));
    } else {
      throw new Error(result.error || "Gagal menyimpan.");
    }
  } catch (err) {
    console.error("Gagal simpan absensi:", err);
    Notify.failure(`Gagal menyimpan absensi: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
};

// Check if logged-in guru is Wali Kelas of a class
const checkWaliKelasStatus = async () => {
  userRole.value = getUserRole();
  const gId = getGtkId();
  userGtkId.value = gId ? parseInt(gId) : null;

  if (userRole.value === "guru" && userGtkId.value) {
    isLoadingGtk.value = true;
    try {
      // Fetch data_gtk to find the teacher's full name
      const gtkData = await fetchFromApi("data_gtk", false, null, {
        filter_col: "id",
        filter_val: String(userGtkId.value),
      });

      if (Array.isArray(gtkData)) {
        const myRecord = gtkData.find(
          (g) =>
            g.id === userGtkId.value ||
            String(g.id) === String(userGtkId.value),
        );

        if (myRecord) {
          const namaGuru = myRecord.nama_lengkap;

          // Match teacher ID, Peg ID, or name with wali_kelas in classes list (backward compatibility)
          const classes = dataKelas.value;
          const myClass = classes.find((c) => {
            const cWali = c.wali_kelas;
            const myPegId = myRecord.peg_id;
            const myId = myRecord.id;

            const matchName = cleanName(cWali) === cleanName(namaGuru);
            const matchPegId = String(cWali).trim() === String(myPegId).trim();
            const matchId = String(cWali).trim() === String(myId).trim();

            return matchId || matchPegId || matchName;
          });

          if (myClass) {
            isWaliKelas.value = true;
            waliKelasClassName.value = myClass.nama_kelas;
            waliKelasClassId.value = myClass.id_kelas;
            selectedClass.value = myClass.id_kelas;
          }
        }
      }
    } catch (err) {
      console.error("Gagal validasi status wali kelas:", err);
    } finally {
      isLoadingGtk.value = false;
    }
  }
};

// --- Lifecycle
onMounted(async () => {
  // Initialize tanggal to today's local date string
  tanggal.value = getLocalDateString(new Date());

  isLoadingKelas.value = true;
  try {
    await loadDataKelas("data_kelas");
    await loadJadwal("jadwal_pelajaran");
    await checkWaliKelasStatus();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingKelas.value = false;
  }
});
</script>

<style scoped>
/* Transparansi tap indicator di handphone */
a,
button {
  -webkit-tap-highlight-color: transparent;
}

/* Calendar popup transition */
.calendar-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.calendar-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.calendar-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.calendar-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
