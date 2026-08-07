<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Header (Hidden on print) -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6 print:hidden">
        <div>
          <h2
            class="text-xl sm:text-2xl font-bold flex items-center gap-2"
            :style="{ color: 'var(--text-heading)' }"
          >
            <Printer class="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Cetak Jadwal Pelajaran
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Ekspor dan cetak jadwal pelajaran berdasarkan kelas, guru pengajar, atau rekapitulasi JP
          </p>
        </div>
      </div>

      <!-- Tab Switcher (Hidden on print) -->
      <div class="flex overflow-x-auto whitespace-nowrap border-b border-zinc-800 mb-6 print:hidden scrollbar-hide">
        <button
          @click="activeTab = 'kelas'"
          :class="[
            activeTab === 'kelas'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors shrink-0"
        >
          Cetak per Kelas
        </button>
        <button
          @click="activeTab = 'guru'"
          :class="[
            activeTab === 'guru'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors shrink-0"
        >
          Cetak per Guru
        </button>
        <button
          @click="activeTab = 'hari'"
          :class="[
            activeTab === 'hari'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors shrink-0"
        >
          Cetak per Hari
        </button>
        <button
          @click="activeTab = 'rekap'"
          :class="[
            activeTab === 'rekap'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors shrink-0"
        >
          Rekap JP Guru
        </button>
      </div>

      <!-- Selectors Panel (Hidden on print) -->
      <div
        class="bg-zinc-800/20 border border-zinc-700/40 rounded-xl p-4 mb-6 print:hidden"
      >
        <!-- Class Selector -->
        <div
          v-if="activeTab === 'kelas'"
          class="flex flex-col gap-1.5 w-full sm:w-72"
        >
          <label class="text-xs font-semibold text-zinc-400">Pilih Kelas</label>
          <UiSearchableSelect
            v-model="selectedKelas"
            :options="sortedClasses"
            option-label="nama_kelas"
            option-value="id_kelas"
            placeholder="-- Pilih Kelas --"
            search-placeholder="Cari kelas..."
          />
        </div>

        <!-- Guru Selector -->
        <div
          v-if="activeTab === 'guru'"
          class="flex flex-col gap-1.5 w-full sm:w-72"
        >
          <label class="text-xs font-semibold text-zinc-400"
            >Pilih Guru Pengajar</label
          >
          <UiSearchableSelect
            v-model="selectedGuru"
            :options="gtkData || []"
            option-label="nama_lengkap"
            option-value="id"
            placeholder="-- Pilih Guru --"
            search-placeholder="Cari nama guru..."
          />
        </div>

        <!-- Hari Selector -->
        <div
          v-if="activeTab === 'hari'"
          class="flex flex-col gap-1.5 w-full sm:w-72"
        >
          <label class="text-xs font-semibold text-zinc-400">Pilih Hari</label>
          <UiSearchableSelect
            v-model="selectedHari"
            :options="days"
            placeholder="-- Pilih Hari --"
            search-placeholder="Cari hari..."
          />
        </div>

        <!-- Search GTK (only for rekap tab) -->
        <div
          v-if="activeTab === 'rekap'"
          class="flex flex-col gap-1.5 w-full sm:w-72"
        >
          <label class="text-xs font-semibold text-zinc-400">Cari Guru</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama guru atau NIP..."
            class="w-full h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <!-- Action Buttons (Hidden on print) -->
      <div v-if="hasSelection" class="flex justify-end gap-3 mb-6 print:hidden">
        <button
          @click="handlePrint"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-950/20"
        >
          <Printer class="w-4 h-4" />
          Cetak Jadwal
        </button>
      </div>

      <!-- Printable Area (always light mode to match print output) -->
      <div
        v-if="hasSelection"
        id="print-area"
        class="bg-white border border-[#d4d4d8] rounded-xl p-6 sm:p-8 print:text-black print:bg-white print:border-none print:p-0"
        style="color: #18181b"
      >
        <!-- Print Header -->
        <div
          class="text-center mb-8 border-b-2 border-[#d4d4d8] print:border-zinc-900 pb-5"
        >
          <h1
            class="text-lg sm:text-2xl font-bold uppercase tracking-wider print:text-black"
            style="color: #09090b"
          >
            {{ activeTab === 'rekap' ? 'Rekapitulasi Alokasi Jam Mengajar (JP)' : activeTab === 'hari' ? 'Jadwal Pelajaran Harian' : 'Jadwal Pelajaran Mingguan' }}
          </h1>
          <p
            class="text-sm font-semibold print:text-zinc-700 uppercase mt-1"
            style="color: #047857"
          >
            {{ getMadrasahName }}
          </p>
          <div
            class="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-1.5 text-xs print:text-zinc-600 font-mono"
            style="color: #71717a"
          >
            <span
              v-if="activeTab === 'kelas'"
              class="font-bold print:text-black"
              style="color: #18181b"
            >
              KELAS: {{ getKelasName(selectedKelas) }}
            </span>
            <span
              v-if="activeTab === 'guru'"
              class="font-bold print:text-black"
              style="color: #18181b"
            >
              GURU: {{ getSelectedGuruName }}
            </span>
            <span
              v-if="activeTab === 'hari'"
              class="font-bold print:text-black"
              style="color: #18181b"
            >
              HARI: {{ (selectedHari || "").toUpperCase() }}
            </span>
            <span
              v-if="activeTab === 'rekap'"
              class="font-bold print:text-black"
              style="color: #18181b"
            >
              LAPORAN: REKAPITULASI TOTAL JP GURU
            </span>
            <span>Semester: {{ currentSemester }}</span>
            <span>Tahun Pelajaran: {{ activeTahunPelajaran }}</span>
          </div>
        </div>

        <!-- Schedule Grid (class or teacher view) -->
        <div v-if="activeTab === 'kelas' || activeTab === 'guru'" class="overflow-x-auto">
          <table
            class="w-full border-collapse border border-[#d4d4d8] print:border-black text-xs"
          >
            <thead>
              <tr
                class="print:bg-zinc-100 font-bold uppercase border-b border-[#d4d4d8] print:border-black"
                style="background: #f4f4f5; color: #3f3f46"
              >
                <th
                  class="p-3 w-28 text-center border-r border-[#d4d4d8] print:border-black"
                >
                  Jam / Hari
                </th>
                <th
                  v-for="day in days"
                  :key="day"
                  class="p-3 text-center border-r border-[#d4d4d8] print:border-black"
                >
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="hour in maxHours"
                :key="hour"
                class="border-b border-[#d4d4d8] print:border-black"
              >
                <!-- Hour Label -->
                <td
                  class="p-3 font-bold print:bg-zinc-50/50 text-center border-r border-[#d4d4d8] print:border-black"
                  style="background: #fafafa; color: #52525b"
                >
                  Jam ke-{{ hour }}
                </td>

                <!-- Slots -->
                <td
                  v-for="day in days"
                  :key="day"
                  class="p-2.5 border-r border-[#d4d4d8] print:border-black text-center min-h-[50px]"
                >
                  <template v-if="activeTab === 'kelas'">
                    <div v-if="getScheduleAt(day, hour)">
                      <div
                        class="font-bold print:text-black"
                        style="color: #047857"
                      >
                        {{ getMapelName(getScheduleAt(day, hour).mapel_id) }}
                      </div>
                      <div
                        class="text-[10px] print:text-zinc-600 mt-0.5 line-clamp-1"
                        style="color: #71717a"
                      >
                        {{ getGuruName(getScheduleAt(day, hour).guru_id) }}
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-[10px]"
                      style="color: #a1a1aa"
                      >-</span
                    >
                  </template>

                  <template v-else-if="activeTab === 'guru'">
                    <div v-if="getTeacherScheduleAt(day, hour)">
                      <div
                        class="font-bold print:text-black"
                        style="color: #047857"
                      >
                        Kelas
                        {{
                          getKelasName(getTeacherScheduleAt(day, hour).kelas_id)
                        }}
                      </div>
                      <div
                        class="text-[10px] print:text-zinc-600 mt-0.5 line-clamp-1"
                        style="color: #71717a"
                      >
                        {{
                          getMapelName(getTeacherScheduleAt(day, hour).mapel_id)
                        }}
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-[10px]"
                      style="color: #a1a1aa"
                      >-</span
                    >
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Schedule Grid Harian (hari tab) -->
        <div v-else-if="activeTab === 'hari'" class="overflow-x-auto">
          <table
            class="w-full border-collapse border border-[#d4d4d8] print:border-black text-xs"
          >
            <thead>
              <tr
                class="print:bg-zinc-100 font-bold uppercase border-b border-[#d4d4d8] print:border-black"
                style="background: #f4f4f5; color: #3f3f46"
              >
                <th
                  class="p-3 w-28 text-center border-r border-[#d4d4d8] print:border-black whitespace-nowrap"
                >
                  Jam / Kelas
                </th>
                <th
                  v-for="k in sortedClasses"
                  :key="k.id_kelas"
                  class="p-3 text-center border-r border-[#d4d4d8] print:border-black whitespace-nowrap min-w-[120px]"
                >
                  {{ k.nama_kelas || k.id_kelas }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="hour in maxHours"
                :key="hour"
                class="border-b border-[#d4d4d8] print:border-black"
              >
                <!-- Hour Label -->
                <td
                  class="p-3 font-bold print:bg-zinc-50/50 text-center border-r border-[#d4d4d8] print:border-black whitespace-nowrap"
                  style="background: #fafafa; color: #52525b"
                >
                  Jam ke-{{ hour }}
                </td>

                <!-- Slots for each class -->
                <td
                  v-for="k in sortedClasses"
                  :key="k.id_kelas"
                  class="p-2.5 border-r border-[#d4d4d8] print:border-black text-center min-h-[50px]"
                >
                  <div v-if="getDayScheduleAt(k.id_kelas, selectedHari, hour)">
                    <div
                      class="font-bold print:text-black"
                      style="color: #047857"
                    >
                      {{ getMapelName(getDayScheduleAt(k.id_kelas, selectedHari, hour).mapel_id) }}
                    </div>
                    <div
                      class="text-[10px] print:text-zinc-600 mt-0.5 line-clamp-1"
                      style="color: #71717a"
                    >
                      {{ getGuruName(getDayScheduleAt(k.id_kelas, selectedHari, hour).guru_id) }}
                    </div>
                  </div>
                  <span
                    v-else
                    class="text-[10px]"
                    style="color: #a1a1aa"
                    >-</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Rekap Table (rekap tab) -->
        <div v-else class="overflow-x-auto">
          <table
            class="w-full border-collapse border border-[#d4d4d8] print:border-black text-xs"
          >
            <thead>
              <tr
                class="print:bg-zinc-100 font-bold uppercase border-b border-[#d4d4d8] print:border-black"
                style="background: #f4f4f5; color: #3f3f46"
              >
                <th class="p-3 w-12 text-center border-r border-[#d4d4d8] print:border-black">No</th>
                <th class="p-3 text-left border-r border-[#d4d4d8] print:border-black">Nama Guru</th>
                <th class="p-3 text-center border-r border-[#d4d4d8] print:border-black">NIP</th>
                <th class="p-3 w-28 text-center border-r border-[#d4d4d8] print:border-black">JP Sertifikasi</th>
                <th class="p-3 w-28 text-center border-r border-[#d4d4d8] print:border-black">JP Terjadwal</th>
                <th class="p-3 w-36 text-center border-r border-[#d4d4d8] print:border-black">Status / Selisih</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(guru, idx) in rekapGuruList"
                :key="guru.id"
                class="border-b border-[#d4d4d8] print:border-black hover:bg-zinc-50/50"
              >
                <td class="p-3 text-center border-r border-[#d4d4d8] print:border-black">{{ idx + 1 }}</td>
                <td class="p-3 font-semibold border-r border-[#d4d4d8] print:border-black" style="color: #18181b">{{ guru.nama }}</td>
                <td class="p-3 text-center font-mono border-r border-[#d4d4d8] print:border-black">{{ guru.nip }}</td>
                <td class="p-3 text-center font-mono font-semibold border-r border-[#d4d4d8] print:border-black">{{ guru.certificationJP }} JP</td>
                <td class="p-3 text-center font-mono font-semibold border-r border-[#d4d4d8] print:border-black">{{ guru.scheduledJP }} JP</td>
                <td class="p-3 text-center border-r border-[#d4d4d8] print:border-black" :class="guru.statusClass">
                  {{ guru.status }}
                </td>
              </tr>
              <tr v-if="rekapGuruList.length === 0">
                <td colspan="6" class="p-6 text-center text-zinc-500 font-medium border-b border-[#d4d4d8] print:border-black">
                  Tidak ada data guru yang cocok dengan pencarian
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Print Footer Signature -->
        <div
          class="mt-12 flex justify-between text-xs print:text-black"
          style="color: #71717a"
        >
          <div class="text-left font-mono">
            Dicetak pada: {{ new Date().toLocaleString("id-ID") }}
          </div>
          <div class="text-center min-w-[200px]">
            <p>Mengetahui,</p>
            <p class="font-bold mt-1">Kepala Madrasah</p>
            <div class="h-16"></div>
            <p class="font-bold underline">
              ......................................
            </p>
          </div>
        </div>
      </div>

      <!-- Fallback Prompt -->
      <div
        v-else
        class="text-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800 print:hidden"
      >
        <Printer
          class="w-16 h-16 mx-auto mb-4 text-zinc-700"
          stroke-width="1.5"
        />
        <p class="text-zinc-400 text-lg font-medium">Pratinjau Jadwal Cetak</p>
        <p class="text-zinc-500 text-sm mt-1">
          Pilih kelas atau guru terlebih dahulu untuk menampilkan pratinjau
          cetak.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Printer } from "lucide-vue-next";
import { useTableData } from "~/composables/data/useTableData";
import { useAcademicYear } from "~/composables/utils/useAcademicYear";

const activeTab = ref("kelas");
const selectedKelas = ref("");
const selectedGuru = ref("");
const selectedHari = ref("");
const searchQuery = ref("");

const { currentAcademicYear, currentSemester } = useAcademicYear();

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const maxHours = 8;

// Fetch core data
const { cardData: kelasData, loadData: loadKelas } = useTableData();
const { cardData: gtkData, loadData: loadGtk } = useTableData();
const { cardData: kurikulumData, loadData: loadKurikulum } = useTableData();
const { cardData: jadwalData, loadData: loadJadwal } = useTableData();
const { cardData: madrasahData, loadData: loadMadrasah } = useTableData();

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

const hasSelection = computed(() => {
  if (activeTab.value === "kelas") return !!selectedKelas.value;
  if (activeTab.value === "guru") return !!selectedGuru.value;
  if (activeTab.value === "hari") return !!selectedHari.value;
  if (activeTab.value === "rekap") return true;
  return false;
});

const getMadrasahName = computed(() => {
  if (Array.isArray(madrasahData.value) && madrasahData.value.length > 0) {
    return madrasahData.value[0].madrasah || "MADRASAH ALIYAH / TSANAWIYAH";
  }
  return "MADRASAH ALIYAH / TSANAWIYAH";
});

const activeTahunPelajaran = computed(() => currentAcademicYear.value);

const getSelectedGuruName = computed(() => {
  if (!selectedGuru.value) return "";
  const guru = (gtkData.value || []).find(
    (g) => g.id === Number(selectedGuru.value),
  );
  return guru ? guru.nama_lengkap : "";
});

// Rekap JP per guru
const rekapGuruList = computed(() => {
  const teachers = gtkData.value || [];
  const schedules = jadwalData.value || [];
  const query = searchQuery.value.trim().toLowerCase();

  const mapped = teachers.map((g) => {
    const certificationJP = 24; // Default certification target

    const scheduledJP = schedules
      .filter((sch) => Number(sch.guru_id) === Number(g.id))
      .length;

    let status = "Sesuai";
    let statusClass = "text-emerald-600 font-semibold";
    if (scheduledJP < certificationJP) {
      status = `Kurang ${certificationJP - scheduledJP} JP`;
      statusClass = "text-amber-600 font-semibold";
    } else if (scheduledJP > certificationJP) {
      status = `Kelebihan ${scheduledJP - certificationJP} JP`;
      statusClass = "text-rose-600 font-semibold";
    }

    return {
      id: g.id,
      nama: g.nama_lengkap,
      nip: g.NIP || g.nip || "-",
      certificationJP,
      scheduledJP,
      status,
      statusClass,
    };
  });

  // Filter out teachers with 0 scheduled JP
  const nonZeroGuru = mapped.filter((g) => g.scheduledJP > 0);

  const filtered = query
    ? nonZeroGuru.filter(
        (g) =>
          g.nama.toLowerCase().includes(query) ||
          g.nip.toLowerCase().includes(query),
      )
    : nonZeroGuru;

  return filtered.sort((a, b) => a.nama.localeCompare(b.nama));
});

// Grid schedules for class view
const getScheduleAt = (day, hour) => {
  if (!selectedKelas.value) return null;
  return (jadwalData.value || []).find(
    (sch) =>
      sch.kelas_id === selectedKelas.value &&
      sch.hari === day &&
      Number(sch.jam_ke) === hour,
  );
};

// Grid schedules for teacher view
const getTeacherScheduleAt = (day, hour) => {
  if (!selectedGuru.value) return null;
  return (jadwalData.value || []).find(
    (sch) =>
      Number(sch.guru_id) === Number(selectedGuru.value) &&
      sch.hari === day &&
      Number(sch.jam_ke) === hour,
  );
};

// Grid schedules for day view
const getDayScheduleAt = (kelasId, day, hour) => {
  if (!day) return null;
  return (jadwalData.value || []).find(
    (sch) =>
      sch.kelas_id === kelasId &&
      sch.hari === day &&
      Number(sch.jam_ke) === hour,
  );
};

// Name mappings
const getKelasName = (id) => {
  const kelas = (kelasData.value || []).find((k) => k.id_kelas === id);
  return kelas ? kelas.nama_kelas || kelas.id_kelas : id;
};

const getMapelName = (id) => {
  const mapel = (kurikulumData.value || []).find((m) => m.id === Number(id));
  return mapel ? mapel.nama_mapel : `Mapel ID: ${id}`;
};

const getGuruName = (id) => {
  const guru = (gtkData.value || []).find((g) => g.id === Number(id));
  return guru ? guru.nama_lengkap : `Guru ID: ${id}`;
};

const handlePrint = () => {
  window.print();
};

onMounted(() => {
  loadKelas("data_kelas");
  loadGtk("data_gtk");
  loadKurikulum("kurikulum");
  loadJadwal("jadwal_pelajaran");
  loadMadrasah("data_madrasah");
});
</script>

<style scoped>
/* Responsive tabs scrollbar hiding */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@media print {
  /* Override styles for clean print grid table */
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th,
  td {
    border: 1px solid black !important;
    color: black !important;
  }
}
</style>
