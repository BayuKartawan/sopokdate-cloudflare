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
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
              Tersimpan di Server
            </span>
            <span 
              v-else-if="selectedClass && hasUnsavedChanges"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
            >
              <span class="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              Ada Perubahan (Belum Kirim)
            </span>
          </h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pencatatan dan pengelolaan kehadiran harian siswa madrasah
          </p>
        </div>
      </div>

      <!-- Filter & Date Navigation Section -->
      <div
        class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-xl border theme-bg-secondary theme-border mb-6"
      >
        <!-- Pilihan Kelas -->
        <div class="flex flex-col gap-1.5 min-w-[240px]">
          <label class="text-xs font-semibold theme-text-muted"
            >Kelas / Rombel</label
          >
          <div :class="isDisabledDropdown ? 'opacity-60 pointer-events-none' : ''">
            <SearchableSelect
              v-model="selectedClass"
              :options="sortedAccessibleClasses"
              option-label="nama_kelas"
              option-value="id_kelas"
              placeholder="-- Pilih Kelas --"
              search-placeholder="Cari kelas..."
            />
          </div>
        </div>

        <!-- Date Navigation Bar -->
        <ClientOnly>
          <div class="flex flex-col gap-2 flex-1 md:max-w-[480px]">
            <div
              class="flex items-center justify-between theme-bg theme-border border p-2 px-3 rounded-xl w-full"
            >
              <!-- Arrow Kiri (Mundur) -->
              <button
                type="button"
                @click="ubahTanggal(-1)"
                :disabled="isPrevDisabled || isSaving"
                class="p-2 rounded-lg theme-border border theme-bg-secondary theme-text hover:theme-bg-tertiary transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
                title="Hari Sebelumnya"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>

              <!-- Tanggal Display (Klik untuk buka kalender) -->
              <div
                class="text-center px-2 cursor-pointer active:opacity-70 transition-opacity select-none flex-1 min-w-0"
                @click="toggleCalendar"
              >
                <span
                  class="text-xs sm:text-sm font-bold theme-text flex items-center justify-center gap-1 truncate"
                >
                  <span class="truncate">{{ formattedTanggal }}</span>
                  <CalendarDays class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </span>
                <span class="text-[10px] font-mono theme-text-muted block truncate">
                  Tapel: {{ tapel }} | Semester: {{ semester }}
                </span>
              </div>

              <!-- Arrow Kanan (Maju) -->
              <button
                type="button"
                @click="ubahTanggal(1)"
                :disabled="isNextDisabled || isSaving"
                class="p-2 rounded-lg theme-border border theme-bg-secondary theme-text hover:theme-bg-tertiary transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
                title="Hari Selanjutnya"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>

            <!-- Shortcut Hari Ini — full width di mobile, auto width di md+ -->
            <button
              v-if="tanggal !== hariIniStr"
              type="button"
              @click="tanggal = hariIniStr"
              :disabled="isSaving"
              class="w-full md:w-auto md:self-start h-9 px-3.5 rounded-xl theme-border border theme-bg-secondary theme-text hover:theme-bg-tertiary transition-colors text-xs font-semibold disabled:opacity-50"
            >
              Kembali ke Hari Ini
            </button>
          </div>
          <template #fallback>
            <div
              class="h-12 theme-bg-secondary theme-border border rounded-xl w-full md:max-w-[480px]"
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
            <div class="absolute inset-0 bg-black/70" @click="showCalendar = false"></div>

            <!-- Calendar Card -->
            <div class="relative z-10 w-full max-w-sm theme-bg theme-border border rounded-2xl overflow-hidden">
              <!-- Calendar Header -->
              <div class="flex items-center justify-between p-4 theme-bg-secondary border-b theme-border">
                <button
                  type="button"
                  @click="calendarPrevMonth"
                  :disabled="!canCalendarGoPrev"
                  class="p-2 rounded-lg theme-text hover:theme-bg-tertiary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <h3 class="text-sm font-bold theme-text select-none">
                  {{ calendarMonthLabel }}
                </h3>
                <button
                  type="button"
                  @click="calendarNextMonth"
                  :disabled="!canCalendarGoNext"
                  class="p-2 rounded-lg theme-text hover:theme-bg-tertiary transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>

              <!-- Day-of-week header -->
              <div class="grid grid-cols-7 text-center text-[10px] font-bold theme-text-muted uppercase tracking-wider py-2 px-3 border-b theme-border">
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
                    class="h-9 w-full rounded-lg text-xs font-semibold transition-colors duration-150"
                    :class="[
                      cell.isSelected
                        ? 'bg-emerald-600 text-white'
                        : cell.isToday
                          ? 'theme-bg-tertiary text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40'
                          : cell.disabled
                            ? 'theme-text-faint cursor-not-allowed'
                            : cell.isHoliday
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-500/10'
                              : 'theme-text-secondary hover:theme-bg-secondary',
                    ]"
                  >
                    {{ cell.day }}
                  </button>
                </template>
              </div>

              <!-- Calendar Footer -->
              <div class="flex items-center justify-between p-3 pt-1 border-t theme-border">
                <span class="text-[10px] theme-text-muted">
                  Akses selama semester aktif saat ini
                </span>
                <button
                  v-if="tanggal !== hariIniStr"
                  type="button"
                  @click="selectToday"
                  class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors px-2 py-1 rounded-md hover:bg-emerald-500/10"
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
        class="rounded-xl border theme-border theme-bg overflow-hidden"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-16">
          <Loader2
            class="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3"
          />
          <p class="theme-text-muted text-sm">Memuat daftar siswa...</p>
        </div>

        <!-- Empty State (No Class Selected) -->
        <div v-else-if="!selectedClass" class="text-center py-16 px-4">
          <GraduationCap
            class="w-16 h-16 theme-text-muted mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="theme-text-secondary font-semibold text-lg">Kelas belum dipilih</p>
          <p class="theme-text-muted text-sm mt-1">
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
          <p class="theme-text font-bold text-lg">{{ keteranganLibur }}</p>
          <p class="theme-text-muted text-sm mt-1">
            Tidak ada aktivitas pengisian absensi siswa pada hari libur sekolah.
          </p>
        </div>

        <!-- Empty State (No Students) -->
        <div v-else-if="students.length === 0" class="text-center py-16 px-4">
          <Users
            class="w-16 h-16 theme-text-muted mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="theme-text-secondary font-semibold text-lg">Tidak ada siswa</p>
          <p class="theme-text-muted text-sm mt-1">
            Tidak ditemukan data siswa aktif di kelas {{ currentClassName }}.
          </p>
        </div>

        <!-- Attendance Table -->
        <div v-else class="flex flex-col">

          <!-- ===================== MOBILE CARD VIEW (< md) ===================== -->
          <div class="md:hidden">
            <div
              v-for="(siswa, idx) in students"
              :key="siswa.siswa_id"
              class="px-4 py-3 pl-3 border-l-4"
              :class="idx > 0 ? 'border-t theme-border' : ''"
              :style="{
                borderLeftColor:
                  siswa.status === 'H' ? '#10b981' :
                  siswa.status === 'S' ? '#f59e0b' :
                  siswa.status === 'I' ? '#3b82f6' :
                  siswa.status === 'A' ? '#ef4444' :
                  'transparent'
              }"
            >
              <!-- Row 1: Nomor + Nama + Badge Status -->
              <div class="flex items-center gap-2 -mb-2.5">
                <span class="theme-text-faint font-mono text-xs w-5 shrink-0 text-right">{{ idx + 1 }}.</span>
                <span class="font-semibold theme-text text-sm leading-tight flex-1 min-w-0 truncate">
                  {{ toTitleCase(siswa.nama) }}
                </span>
                <!-- Status badge -->
                <span
                  class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  :class="[
                    siswa.status === 'H' ? 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' :
                    siswa.status === 'S' ? 'bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' :
                    siswa.status === 'I' ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30' :
                    siswa.status === 'A' ? 'bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30' :
                    'theme-bg-secondary theme-text-secondary theme-border'
                  ]"
                >
                  {{ siswa.status === 'H' ? 'Hadir' : siswa.status === 'S' ? 'Sakit' : siswa.status === 'I' ? 'Izin' : siswa.status === 'A' ? 'Alpa' : '-' }}
                </span>
              </div>

              <!-- Row 2: NISN (kecil) -->
              <div class="ml-7 mb-2.5">
                <span class="text-[11px] theme-text-muted font-mono">NISN: {{ siswa.nisn || '-' }}</span>
              </div>

              <!-- Row 3: Tombol Status (full width, 4 tombol rata) -->
              <div class="ml-7 mb-2.5">
                <div class="grid grid-cols-4 gap-1.5 theme-bg-secondary p-1 rounded-lg border theme-border">
                  <button
                    type="button"
                    @click="updateStatus(siswa, 'H')"
                    :disabled="isDisabled"
                    :class="[
                      siswa.status === 'H'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                      'py-2 rounded-md text-xs transition-colors text-center',
                    ]"
                  >Hadir</button>
                  <button
                    type="button"
                    @click="updateStatus(siswa, 'S')"
                    :disabled="isDisabled"
                    :class="[
                      siswa.status === 'S'
                        ? 'bg-amber-500 text-white font-bold'
                        : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                      'py-2 rounded-md text-xs transition-colors text-center',
                    ]"
                  >Sakit</button>
                  <button
                    type="button"
                    @click="updateStatus(siswa, 'I')"
                    :disabled="isDisabled"
                    :class="[
                      siswa.status === 'I'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                      'py-2 rounded-md text-xs transition-colors text-center',
                    ]"
                  >Izin</button>
                  <button
                    type="button"
                    @click="updateStatus(siswa, 'A')"
                    :disabled="isDisabled"
                    :class="[
                      siswa.status === 'A'
                        ? 'bg-red-600 text-white font-bold'
                        : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                      'py-2 rounded-md text-xs transition-colors text-center',
                    ]"
                  >Alpa</button>
                </div>
              </div>

              <!-- Row 4: Input Keterangan -->
              <div class="ml-7">
                <input
                  type="text"
                  v-model="siswa.keterangan"
                  placeholder="Catatan (opsional)..."
                  :disabled="isDisabled"
                  class="w-full h-9 px-3 rounded-lg theme-border border theme-input theme-text text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <!-- ===================== DESKTOP TABLE VIEW (md+) ===================== -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  class="theme-bg-secondary border-b theme-border theme-text-secondary uppercase text-xs font-semibold"
                >
                  <th class="py-4 px-4 text-center w-12">No</th>
                  <th class="py-4 px-4">Nama Siswa</th>
                  <th class="py-4 px-4 w-28 text-center">NISN</th>
                  <th class="py-4 px-4 text-center w-80">Status Kehadiran</th>
                  <th class="py-4 px-4 min-w-48">Keterangan / Catatan</th>
                </tr>
              </thead>
              <tbody class="theme-text">
                <tr
                  v-for="(siswa, idx) in students"
                  :key="siswa.siswa_id"
                  :class="[idx > 0 ? 'border-t theme-border' : '', 'hover:theme-bg-secondary transition-colors']"
                >
                  <td class="py-4 px-4 text-center theme-text-faint font-mono">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-4 px-4 font-semibold theme-text">
                    {{ toTitleCase(siswa.nama) }}
                  </td>
                  <td class="py-4 px-4 text-center theme-text-muted font-mono">
                    {{ siswa.nisn || "-" }}
                  </td>
                  <td class="py-3 px-4">
                    <!-- Status Button Pills Group -->
                    <div
                      class="flex justify-center items-center gap-1.5 theme-bg-secondary p-1 rounded-lg border theme-border w-fit mx-auto"
                    >
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'H')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'H'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                          'px-3.5 py-1.5 rounded-md text-xs transition-colors',
                        ]"
                      >Hadir</button>
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'S')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'S'
                            ? 'bg-amber-500 text-white font-bold'
                            : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                          'px-3.5 py-1.5 rounded-md text-xs transition-colors',
                        ]"
                      >Sakit</button>
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'I')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'I'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                          'px-3.5 py-1.5 rounded-md text-xs transition-colors',
                        ]"
                      >Izin</button>
                      <button
                        type="button"
                        @click="updateStatus(siswa, 'A')"
                        :disabled="isDisabled"
                        :class="[
                          siswa.status === 'A'
                            ? 'bg-red-600 text-white font-bold'
                            : 'theme-text-secondary hover:theme-text hover:theme-bg-tertiary',
                          'px-3.5 py-1.5 rounded-md text-xs transition-colors',
                        ]"
                      >Alpa</button>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="text"
                      v-model="siswa.keterangan"
                      placeholder="Catatan (opsional)..."
                      :disabled="isDisabled"
                      class="w-full h-9 px-3 rounded-lg theme-border border theme-input theme-text text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors disabled:opacity-60"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Buttons -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 theme-bg-secondary border-t theme-border"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs theme-text-muted">
                Menampilkan
                <span class="font-bold theme-text-secondary">{{ students.length }}</span>
                siswa
              </span>
              <span class="theme-text-faint hidden sm:inline">|</span>
              <!-- Status Badge in footer -->
              <span 
                v-if="hasExistingRecords && !hasUnsavedChanges"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
              >
                Sudah Terkirim (Tersimpan)
              </span>
              <span 
                v-else-if="hasUnsavedChanges"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
              >
                Belum Dikirim (Ada Perubahan)
              </span>
              <span 
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold theme-bg-tertiary theme-text-secondary theme-border border"
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
import SearchableSelect from "~/components/ui/SearchableSelect.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester, dapatkanAwalSemesterAktif } from "~/utils/dateHelper";

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
  return dapatkanAwalSemesterAktif(new Date());
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
    Notify.warning(`Pilihan tanggal dibatasi hanya untuk semester aktif saat ini (mulai ${batasanMinStr.value})`);
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

const sortedAccessibleClasses = computed(() => {
  return [...accessibleClasses.value].sort((a, b) => {
    const levelA = Number(a.tingkat) || 0;
    const levelB = Number(b.tingkat) || 0;
    if (levelA !== levelB) return levelA - levelB;
    return (a.nama_kelas || "").localeCompare(b.nama_kelas || "", undefined, { numeric: true });
  });
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

  // Batasi agar tidak melampaui batas atas (hari ini) atau batas bawah (awal semester aktif)
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
  const route = useRoute();
  if (route.query.tanggal) {
    tanggal.value = String(route.query.tanggal);
  } else {
    tanggal.value = getLocalDateString(new Date());
  }

  if (route.query.kelas_id) {
    selectedClass.value = String(route.query.kelas_id);
  }

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

/* Calendar popup transition - ringan tanpa transform */
.calendar-fade-enter-active {
  transition: opacity 0.15s ease;
}
.calendar-fade-leave-active {
  transition: opacity 0.1s ease;
}
.calendar-fade-enter-from {
  opacity: 0;
}
.calendar-fade-leave-to {
  opacity: 0;
}
</style>
