<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Top Section: Title & Actions -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6"
      >
        <div>
          <h2
            class="text-xl sm:text-2xl font-bold flex items-center gap-2"
            :style="{ color: 'var(--text-heading)' }"
          >
            <ClipboardList class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Rekap Absensi Siswa
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Laporan rekapitulasi kehadiran siswa per kelas berdasarkan periode yang dipilih
          </p>
        </div>

        <div class="flex items-center gap-2" v-if="rekapData.length > 0">
          <!-- Export Excel Button -->
          <BaseButton
            :text="isExporting ? 'Mengekspor...' : 'Export Excel'"
            @click="exportToExcel"
            :disabled="isExporting || isLoading"
          >
            <template #icon>
              <Download v-if="!isExporting" class="w-4 h-4" />
              <Loader2 v-else class="w-4 h-4 animate-spin" />
            </template>
          </BaseButton>

          <!-- Print Button -->
          <PrintButton>
            <div class="p-10 mx-auto bg-white text-black font-sans">
              <!-- Kop Surat -->
              <KopSurat class="mb-4" />

              <!-- Header -->
              <div class="text-center mb-6">
                <h1 class="font-bold uppercase text-lg">
                  REKAPITULASI PRESENSI SISWA
                </h1>
                <p class="text-sm font-semibold mt-1" v-if="rekapType === 'semester'">
                  Kelas: {{ currentClassName }} | Semester:
                  {{ selectedSemester }} | Tahun Pelajaran: {{ selectedTapel }}
                </p>
                <p class="text-sm font-semibold mt-1" v-else-if="rekapType === 'bulanan'">
                  Kelas: {{ currentClassName }} | Bulan:
                  {{ monthNames[selectedMonth - 1] }} | Tahun Pelajaran: {{ selectedTapel }}
                </p>
                <p class="text-sm font-semibold mt-1" v-else-if="rekapType === 'mingguan'">
                  Kelas: {{ currentClassName }} | Periode:
                  {{ formatDateIndo(startDate) }} s.d. {{ formatDateIndo(endDate) }} | Tahun Pelajaran: {{ selectedTapel }}
                </p>
              </div>

              <!-- Tabel Cetak -->
              <table
                class="w-full table-auto border border-gray-800 mb-6 text-xs"
              >
                <thead class="bg-gray-100">
                  <tr>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-8"
                      rowspan="2"
                    >
                      No
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-left"
                      rowspan="2"
                    >
                      Nama Siswa
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-24"
                      rowspan="2"
                    >
                      NISN
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-1 text-center"
                      colspan="4"
                    >
                      Kehadiran (Hari)
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-16"
                      rowspan="2"
                    >
                      H. Efektif
                    </th>
                    <th
                      class="border border-gray-800 px-2 py-2 text-center w-16"
                      rowspan="2"
                    >
                      Persentase
                    </th>
                  </tr>
                  <tr>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      H
                    </th>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      S
                    </th>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      I
                    </th>
                    <th
                      class="border border-gray-800 px-1 py-1 text-center w-10"
                    >
                      A
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(siswa, index) in rekapData" :key="siswa.siswa_id">
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ index + 1 }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 font-semibold"
                    >
                      {{ toTitleCase(siswa.nama) }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 text-center font-mono"
                    >
                      {{ siswa.nisn || "-" }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_hadir }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_sakit }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_izin }}
                    </td>
                    <td class="border border-gray-800 px-2 py-1.5 text-center">
                      {{ siswa.total_alpa }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 text-center font-bold"
                    >
                      {{ siswa.total_hari_efektif }}
                    </td>
                    <td
                      class="border border-gray-800 px-2 py-1.5 text-center font-bold"
                    >
                      {{
                        hitungPersentase(
                          siswa.total_hadir,
                          siswa.total_hari_efektif,
                        )
                      }}%
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Footer Cetak -->
              <div class="flex justify-between items-end mt-12 text-xs">
                <div>
                  <p class="italic">
                    Dicetak otomatis via SopokDate pada {{ printTimestamp }}
                  </p>
                </div>
                <div class="text-center w-48">
                  <p class="mb-16">Wali Kelas {{ currentClassName }}</p>
                  <p class="font-bold underline">
                    {{ waliKelasName || "_________________" }}
                  </p>
                </div>
              </div>
            </div>
          </PrintButton>
        </div>
      </div>

      <!-- Filter Section (Kelas, Tapel, Tipe, Sub-Filter) -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6"
      >
        <!-- Pilihan Kelas -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-400"
            >Kelas / Rombel</label
          >
          <select
            v-model="selectedClass"
            :disabled="isLoading || isWaliKelas"
            class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="" disabled>-- Pilih Kelas --</option>
            <option
              v-for="kelas in dataKelas"
              :key="kelas.idKelas"
              :value="kelas.idKelas"
            >
              {{ kelas.namaKelas }}
            </option>
          </select>
        </div>

        <!-- Tahun Pelajaran -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-400"
            >Tahun Pelajaran</label
          >
          <select
            v-model="selectedTapel"
            :disabled="isLoading"
            class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          >
            <option v-for="opt in tapelOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <!-- Tipe Rekap -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-400">Tipe Rekap</label>
          <select
            v-model="rekapType"
            :disabled="isLoading"
            class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          >
            <option value="semester">Per Semester</option>
            <option value="bulanan">Per Bulan</option>
            <option value="mingguan">Per Minggu / Kustom</option>
          </select>
        </div>

        <!-- Sub Filter (Semester / Bulan / Rentang Tanggal) -->
        <div class="flex flex-col gap-1.5">
          <!-- Jika Tipe Rekap = Semester -->
          <template v-if="rekapType === 'semester'">
            <label class="text-xs font-semibold text-zinc-400">Semester</label>
            <select
              v-model="selectedSemester"
              :disabled="isLoading"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </template>

          <!-- Jika Tipe Rekap = Bulanan -->
          <template v-else-if="rekapType === 'bulanan'">
            <label class="text-xs font-semibold text-zinc-400">Pilih Bulan</label>
            <select
              v-model="selectedMonth"
              :disabled="isLoading"
              class="h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              <option v-for="(name, index) in monthNames" :key="index" :value="index + 1">
                {{ name }}
              </option>
            </select>
          </template>

          <!-- Jika Tipe Rekap = Mingguan / Kustom -->
          <template v-else-if="rekapType === 'mingguan'">
            <label class="text-xs font-semibold text-zinc-400">Rentang Tanggal</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                type="date"
                v-model="startDate"
                :disabled="isLoading"
                class="h-10 px-2 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs"
              />
              <input
                type="date"
                v-model="endDate"
                :disabled="isLoading"
                class="h-10 px-2 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs"
              />
            </div>
          </template>
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
          <p class="text-zinc-400 text-sm">Menghitung rekap absensi...</p>
        </div>

        <!-- Empty State (No Class Selected) -->
        <div v-else-if="!selectedClass" class="text-center py-16 px-4">
          <ClipboardList
            class="w-16 h-16 text-zinc-500 mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 font-semibold text-lg">Kelas belum dipilih</p>
          <p class="text-zinc-500 text-sm mt-1">
            Silakan pilih kelas terlebih dahulu untuk melihat rekapitulasi
            kehadiran.
          </p>
        </div>

        <!-- Empty State (No Rekap Data) -->
        <div v-else-if="rekapData.length === 0" class="text-center py-16 px-4">
          <Users
            class="w-16 h-16 text-zinc-500 mx-auto mb-3"
            stroke-width="1.5"
          />
          <p class="text-zinc-400 font-semibold text-lg">Tidak ada data</p>
          <p class="text-zinc-500 text-sm mt-1" v-if="rekapType === 'semester'">
            Belum ada rekaman absensi terisi di kelas
            {{ currentClassName }} pada {{ selectedTapel }} -
            {{ selectedSemester }}.
          </p>
          <p class="text-zinc-500 text-sm mt-1" v-else-if="rekapType === 'bulanan'">
            Belum ada rekaman absensi terisi di kelas
            {{ currentClassName }} pada Bulan {{ monthNames[selectedMonth - 1] }} ({{ selectedTapel }}).
          </p>
          <p class="text-zinc-500 text-sm mt-1" v-else-if="rekapType === 'mingguan'">
            Belum ada rekaman absensi terisi di kelas
            {{ currentClassName }} pada Rentang {{ formatDateIndo(startDate) }} s.d. {{ formatDateIndo(endDate) }}.
          </p>
        </div>

        <!-- Rekap Table -->
        <div v-else class="flex flex-col">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold"
                >
                  <th class="py-4 px-4 text-center w-12" rowspan="2">No</th>
                  <th class="py-4 px-4" rowspan="2">Nama Siswa</th>
                  <th class="py-4 px-4 w-28 text-center" rowspan="2">NISN</th>
                  <th
                    class="py-2 px-4 text-center border-b border-zinc-700/40"
                    colspan="4"
                  >
                    Kehadiran (Hari)
                  </th>
                  <th class="py-4 px-4 text-center w-24" rowspan="2">
                    Hari Efektif
                  </th>
                  <th class="py-4 px-4 text-center w-24" rowspan="2">
                    Persentase
                  </th>
                </tr>
                <tr
                  class="bg-zinc-800/20 border-b border-zinc-700/50 text-zinc-400 text-[10px]"
                >
                  <th class="py-2 px-2 text-center w-12 text-emerald-600 dark:text-emerald-400">
                    Hadir
                  </th>
                  <th class="py-2 px-2 text-center w-12 text-amber-600 dark:text-amber-400">
                    Sakit
                  </th>
                  <th class="py-2 px-2 text-center w-12 text-blue-600 dark:text-blue-400">Izin</th>
                  <th class="py-2 px-2 text-center w-12 text-red-600 dark:text-red-400">Alpa</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
                <tr
                  v-for="(siswa, idx) in rekapData"
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
                  <td
                    class="py-4 px-2 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/[0.06] dark:bg-emerald-500/[0.02]"
                  >
                    {{ siswa.total_hadir }}
                  </td>
                  <td class="py-4 px-2 text-center text-amber-600 dark:text-amber-400">
                    {{ siswa.total_sakit }}
                  </td>
                  <td class="py-4 px-2 text-center text-blue-600 dark:text-blue-400">
                    {{ siswa.total_izin }}
                  </td>
                  <td class="py-4 px-2 text-center text-red-600 dark:text-red-400">
                    {{ siswa.total_alpa }}
                  </td>
                  <td class="py-4 px-4 text-center text-zinc-300 font-bold">
                    {{ siswa.total_hari_efektif }}
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span
                      :class="[
                        parseFloat(
                          hitungPersentase(
                            siswa.total_hadir,
                            siswa.total_hari_efektif,
                          ),
                        ) >= 90
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 dark:border-emerald-800/30'
                          : parseFloat(
                                hitungPersentase(
                                  siswa.total_hadir,
                                  siswa.total_hari_efektif,
                                ),
                              ) >= 75
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-800/30'
                            : 'text-red-700 dark:text-red-400 bg-red-500/10 dark:bg-red-950/30 border-red-500/20 dark:border-red-800/30',
                        'px-2 py-0.5 rounded text-[11px] font-mono border',
                      ]"
                    >
                      {{
                        hitungPersentase(
                          siswa.total_hadir,
                          siswa.total_hari_efektif,
                        )
                      }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Info -->
          <div
            class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40"
          >
            <div class="text-xs text-zinc-400">
              Total siswa:
              <span class="font-bold text-zinc-300">{{
                rekapData.length
              }}</span>
              anak
            </div>
            <div class="text-xs text-zinc-500">
              Ket: H = Hadir, S = Sakit, I = Izin, A = Alpa
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { ClipboardList, Loader2, Users, Download } from "lucide-vue-next";
import BaseButton from "~/components/ui/BaseButton.vue";
import PrintButton from "~/components/ui/PrintButton.vue";
import KopSurat from "~/components/document/KopSurat.vue";
import { useTableData } from "~/composables/data/useTableData";
import { useAuth } from "~/composables/auth/useAuth";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { dapatkanTahunDanSemester } from "~/utils/dateHelper";
import * as XLSX from "xlsx";

// --- Services & Config
const { Notify } = useNotiflix();
const { getUserRole, getGtkId } = useAuth();
const { cardData: dataKelas, loadData: loadDataKelas } = useTableData();

// --- States
const selectedClass = ref("");
const selectedTapel = ref("");
const selectedSemester = ref("Ganjil");
const rekapType = ref("semester");
const selectedMonth = ref(new Date().getMonth() + 1);
const startDate = ref("");
const endDate = ref("");
const rekapData = ref([]);

const userRole = ref("");
const userGtkId = ref(null);
const isWaliKelas = ref(false);
const waliKelasName = ref("");

const isLoading = ref(false);
const isLoadingKelas = ref(false);
const isExporting = ref(false);
const printTimestamp = ref("");

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  const sunday = new Date(now.setDate(diffToMonday + 6));
  
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };
  
  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  };
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const monthRange = computed(() => {
  if (!selectedTapel.value || !selectedMonth.value) return null;
  const parts = selectedTapel.value.split("/");
  if (parts.length !== 2) return null;
  const year = selectedMonth.value >= 7 ? parseInt(parts[0]) : parseInt(parts[1]);
  
  const startDay = "01";
  const formattedMonth = String(selectedMonth.value).padStart(2, "0");
  const startDateStr = `${year}-${formattedMonth}-${startDay}`;
  
  const lastDay = new Date(year, selectedMonth.value, 0).getDate();
  const endDateStr = `${year}-${formattedMonth}-${String(lastDay).padStart(2, "0")}`;
  
  return {
    start: startDateStr,
    end: endDateStr,
  };
});

// --- Computed Options
const tapelOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    options.push(`${y}/${y + 1}`);
  }
  return options;
});

const currentClassName = computed(() => {
  if (!selectedClass.value) return "";
  const match = dataKelas.value.find((k) => k.idKelas === selectedClass.value);
  return match ? match.namaKelas : selectedClass.value;
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

const hitungPersentase = (hadir, total) => {
  if (!total || total === 0) return "0.0";
  return ((hadir / total) * 100).toFixed(1);
};

// Fetch rekap when filters change
watch(
  [selectedClass, selectedTapel, selectedSemester, rekapType, selectedMonth, startDate, endDate],
  async () => {
    if (!selectedClass.value || !selectedTapel.value) {
      rekapData.value = [];
      return;
    }
    await fetchRekap();
  },
);

const fetchRekap = async () => {
  isLoading.value = true;
  try {
    let url = `/api/absensi/rekap?kelas_id=${encodeURIComponent(selectedClass.value)}&tahun_pelajaran=${encodeURIComponent(selectedTapel.value)}`;
    
    if (rekapType.value === "semester") {
      url += `&semester=${encodeURIComponent(selectedSemester.value)}`;
    } else if (rekapType.value === "bulanan" && monthRange.value) {
      url += `&start_date=${encodeURIComponent(monthRange.value.start)}&end_date=${encodeURIComponent(monthRange.value.end)}`;
    } else if (rekapType.value === "mingguan") {
      if (!startDate.value || !endDate.value) {
        rekapData.value = [];
        isLoading.value = false;
        return;
      }
      url += `&start_date=${encodeURIComponent(startDate.value)}&end_date=${encodeURIComponent(endDate.value)}`;
    }
    
    const response = await authenticatedFetch(url);
    const data = await response.json();
    if (Array.isArray(data)) {
      rekapData.value = data;
    } else {
      rekapData.value = [];
    }
  } catch (err) {
    console.error("Gagal memuat rekap absensi:", err);
    Notify.failure("Gagal mengambil data rekap absensi");
    rekapData.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Check if logged-in guru is Wali Kelas of a class
const checkWaliKelasStatus = async () => {
  userRole.value = getUserRole();
  const gId = getGtkId();
  userGtkId.value = gId ? parseInt(gId) : null;

  if (userRole.value === "guru" && userGtkId.value) {
    try {
      const gtkData = await fetchFromApi("DataGtk", false, null, {
        filter_col: "id",
        filter_val: String(userGtkId.value),
      });

      if (Array.isArray(gtkData)) {
        const myRecord = gtkData.find(
          (g) =>
            g.id === userGtkId.value ||
            g.ID === userGtkId.value ||
            String(g.id) === String(userGtkId.value),
        );

        if (myRecord) {
          const namaGuru =
            myRecord.title ||
            myRecord.NamaLengkap ||
            myRecord["Nama Lengkap"] ||
            myRecord.nama_lengkap;
          waliKelasName.value = namaGuru;

          // Match teacher name or Peg ID with wali_kelas in classes list
          const classes = dataKelas.value;
          const myClass = classes.find((c) => {
            const cWali = c.waliKelas || c["Wali Kelas"] || c.wali_kelas;
            const myPegId =
              myRecord.PegID || myRecord["Peg ID"] || myRecord.peg_id;

            const matchName = cleanName(cWali) === cleanName(namaGuru);
            const matchPegId = String(cWali).trim() === String(myPegId).trim();

            return matchPegId || matchName;
          });

          if (myClass) {
            isWaliKelas.value = true;
            selectedClass.value = myClass.idKelas || myClass["ID Kelas"];
          }
        }
      }
    } catch (err) {
      console.error("Gagal validasi status wali kelas:", err);
    }
  }
};

const updatePrintTimestamp = () => {
  const now = new Date();
  printTimestamp.value =
    now.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }) + " WITA";
};

// Export rekap to Excel
const exportToExcel = async () => {
  if (rekapData.value.length === 0) return;

  try {
    isExporting.value = true;

    // Map raw data to user-friendly excel rows
    const excelRows = rekapData.value.map((siswa, index) => ({
      No: index + 1,
      "Nama Siswa": toTitleCase(siswa.nama),
      NISN: siswa.nisn || "-",
      "Hadir (H)": siswa.total_hadir,
      "Sakit (S)": siswa.total_sakit,
      "Izin (I)": siswa.total_izin,
      "Alpa (A)": siswa.total_alpa,
      "Hari Efektif": siswa.total_hari_efektif,
      "Persentase Kehadiran (%)": `${hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif)}%`,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows);

    // Set Column Widths
    ws["!cols"] = [
      { wch: 5 }, // No
      { wch: 28 }, // Nama
      { wch: 15 }, // NISN
      { wch: 10 }, // H
      { wch: 10 }, // S
      { wch: 10 }, // I
      { wch: 10 }, // A
      { wch: 12 }, // Hari Efektif
      { wch: 24 }, // Persentase
    ];

    // Apply header style (emerald-600 background)
    const headerKeys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "I1"];
    headerKeys.forEach((cell) => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "059669" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");

    const dateStr = new Date().toISOString().slice(0, 10);
    let periodSuffix = "";
    if (rekapType.value === "semester") {
      periodSuffix = `Smt_${selectedSemester.value}`;
    } else if (rekapType.value === "bulanan") {
      periodSuffix = `Bulan_${monthNames[selectedMonth.value - 1]}`;
    } else if (rekapType.value === "mingguan") {
      periodSuffix = `Rentang_${startDate.value}_sd_${endDate.value}`;
    }
    const filename = `Rekap_Absensi_${currentClassName.value.replace(/[^a-zA-Z0-9]/g, "_")}_${periodSuffix}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);

    setTimeout(() => {
      Notify.success(`Rekap berhasil diekspor ke file: ${filename}`);
    }, 100);
  } catch (err) {
    console.error("Gagal export excel:", err);
    Notify.failure("Gagal mengekspor rekap absensi.");
  } finally {
    isExporting.value = false;
  }
};

// --- Lifecycle
onMounted(async () => {
  isLoadingKelas.value = true;

  // Set default Tapel, Semester & Dates
  const currentInfo = dapatkanTahunDanSemester(new Date());
  selectedTapel.value = currentInfo.tahunPelajaran;
  selectedSemester.value = currentInfo.semester;
  
  const week = getWeekRange();
  startDate.value = week.start;
  endDate.value = week.end;

  updatePrintTimestamp();

  try {
    await loadDataKelas("DataKelas");
    await checkWaliKelasStatus();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingKelas.value = false;
  }
});
</script>
