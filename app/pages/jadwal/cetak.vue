<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Header (Hidden on print) -->
      <div class="flex flex-col gap-4 sm:gap-6 mb-6 print:hidden">
        <div>
          <h2
            class="text-xl text-white sm:text-2xl font-bold flex items-center gap-2"
          >
            <Printer class="w-7 h-7 text-emerald-400" />
            Cetak Jadwal Pelajaran
          </h2>
          <p class="text-sm text-zinc-400 mt-1">
            Ekspor dan cetak jadwal pelajaran berdasarkan kelas atau guru
            pengajar
          </p>
        </div>
      </div>

      <!-- Tab Switcher (Hidden on print) -->
      <div class="flex border-b border-zinc-800 mb-6 print:hidden">
        <button
          @click="activeTab = 'kelas'"
          :class="[
            activeTab === 'kelas'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors"
        >
          Cetak per Kelas
        </button>
        <button
          @click="activeTab = 'guru'"
          :class="[
            activeTab === 'guru'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200',
          ]"
          class="px-5 py-3 border-b-2 font-medium text-sm transition-colors"
        >
          Cetak per Guru
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
          <select
            v-model="selectedKelas"
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

        <!-- Guru Selector -->
        <div
          v-if="activeTab === 'guru'"
          class="flex flex-col gap-1.5 w-full sm:w-72"
        >
          <label class="text-xs font-semibold text-zinc-400"
            >Pilih Guru Pengajar</label
          >
          <select
            v-model="selectedGuru"
            class="w-full h-10 px-3 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          >
            <option value="">-- Pilih Guru --</option>
            <option v-for="g in gtkData" :key="g.id" :value="g.id">
              {{ g.nama_lengkap }}
            </option>
          </select>
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

      <!-- Printable Area (visible on screen and formatted for print-area fallback) -->
      <div
        v-if="hasSelection"
        id="print-area"
        class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 sm:p-8 text-zinc-100 print:text-black print:bg-white print:border-none print:p-0"
      >
        <!-- Print Header -->
        <div
          class="text-center mb-8 border-b-2 border-zinc-800 print:border-zinc-900 pb-5"
        >
          <h1
            class="text-lg sm:text-2xl font-bold uppercase tracking-wider text-zinc-100 print:text-black"
          >
            Jadwal Pelajaran Mingguan
          </h1>
          <p
            class="text-sm font-semibold text-emerald-400 print:text-zinc-700 uppercase mt-1"
          >
            {{ getMadrasahName }}
          </p>
          <div
            class="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-1.5 text-xs text-zinc-400 print:text-zinc-600 font-mono"
          >
            <span
              v-if="activeTab === 'kelas'"
              class="font-bold text-zinc-200 print:text-black"
            >
              KELAS: {{ getKelasName(selectedKelas) }}
            </span>
            <span
              v-if="activeTab === 'guru'"
              class="font-bold text-zinc-200 print:text-black"
            >
              GURU: {{ getSelectedGuruName }}
            </span>
            <span>Tahun Pelajaran: {{ activeTahunPelajaran }}</span>
          </div>
        </div>

        <!-- Schedule Grid -->
        <div class="overflow-x-auto">
          <table
            class="w-full border-collapse border border-zinc-800 print:border-black text-xs"
          >
            <thead>
              <tr
                class="bg-zinc-900 print:bg-zinc-100 text-zinc-300 print:text-black font-bold uppercase border-b border-zinc-800 print:border-black"
              >
                <th
                  class="p-3 w-28 text-center border-r border-zinc-800 print:border-black"
                >
                  Jam / Hari
                </th>
                <th
                  v-for="day in days"
                  :key="day"
                  class="p-3 text-center border-r border-zinc-800 print:border-black"
                >
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="hour in maxHours"
                :key="hour"
                class="border-b border-zinc-800 print:border-black"
              >
                <!-- Hour Label -->
                <td
                  class="p-3 font-bold bg-zinc-900/40 print:bg-zinc-50/50 text-center border-r border-zinc-800 print:border-black text-zinc-300 print:text-black"
                >
                  Jam ke-{{ hour }}
                </td>

                <!-- Slots -->
                <td
                  v-for="day in days"
                  :key="day"
                  class="p-2.5 border-r border-zinc-800 print:border-black text-center min-h-[50px]"
                >
                  <template v-if="activeTab === 'kelas'">
                    <div v-if="getScheduleAt(day, hour)">
                      <div class="font-bold text-emerald-400 print:text-black">
                        {{ getMapelName(getScheduleAt(day, hour).mapel_id) }}
                      </div>
                      <div
                        class="text-[10px] text-zinc-500 print:text-zinc-600 mt-0.5 line-clamp-1"
                      >
                        {{ getGuruName(getScheduleAt(day, hour).guru_id) }}
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-[10px] text-zinc-700 print:text-zinc-300"
                      >-</span
                    >
                  </template>

                  <template v-else-if="activeTab === 'guru'">
                    <div v-if="getTeacherScheduleAt(day, hour)">
                      <div class="font-bold text-emerald-400 print:text-black">
                        Kelas
                        {{
                          getKelasName(getTeacherScheduleAt(day, hour).kelas_id)
                        }}
                      </div>
                      <div
                        class="text-[10px] text-zinc-500 print:text-zinc-600 mt-0.5 line-clamp-1"
                      >
                        {{
                          getMapelName(getTeacherScheduleAt(day, hour).mapel_id)
                        }}
                      </div>
                    </div>
                    <span
                      v-else
                      class="text-[10px] text-zinc-700 print:text-zinc-300"
                      >-</span
                    >
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Print Footer Signature -->
        <div
          class="mt-12 flex justify-between text-xs text-zinc-400 print:text-black"
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

const activeTab = ref("kelas");
const selectedKelas = ref("");
const selectedGuru = ref("");

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const maxHours = 8;

// Fetch core data
const { cardData: kelasData, loadData: loadKelas } = useTableData();
const { cardData: gtkData, loadData: loadGtk } = useTableData();
const { cardData: kurikulumData, loadData: loadKurikulum } = useTableData();
const { cardData: jadwalData, loadData: loadJadwal } = useTableData();
const { cardData: madrasahData, loadData: loadMadrasah } = useTableData();

const hasSelection = computed(() => {
  if (activeTab.value === "kelas") return !!selectedKelas.value;
  if (activeTab.value === "guru") return !!selectedGuru.value;
  return false;
});

const getMadrasahName = computed(() => {
  if (Array.isArray(madrasahData.value) && madrasahData.value.length > 0) {
    return madrasahData.value[0].madrasah || "MADRASAH ALIYAH / TSANAWIYAH";
  }
  return "MADRASAH ALIYAH / TSANAWIYAH";
});

const activeTahunPelajaran = computed(() => {
  // Try to default to the current active tapel or current year
  return "2025/2026";
});

const getSelectedGuruName = computed(() => {
  if (!selectedGuru.value) return "";
  const guru = (gtkData.value || []).find(
    (g) => g.id === Number(selectedGuru.value),
  );
  return guru ? guru.nama_lengkap : "";
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
