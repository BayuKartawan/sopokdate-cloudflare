<template>
  <div>
    <!-- Filter Section (Kelas, Tapel, Tipe, Sub-Filter) -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6">
      <!-- Pilihan Kelas -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Kelas / Rombel</label>
        <UiSearchableSelect v-model="selectedClass" :options="dataKelas || []" option-label="namaKelas"
          option-value="idKelas" placeholder="-- Pilih Kelas --" search-placeholder="Cari kelas..."
          :disabled="isLoading || isWaliKelas" />
      </div>

      <!-- Tahun Pelajaran -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Tahun Pelajaran</label>
        <UiSearchableSelect v-model="selectedTapel" :options="tapelOptions" placeholder="Tahun Pelajaran"
          search-placeholder="Cari tahun..." :disabled="isLoading" />
      </div>

      <!-- Tipe Rekap -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Tipe Rekap</label>
        <UiSearchableSelect v-model="rekapType" :options="[
          { label: 'Per Semester', value: 'semester' },
          { label: 'Per Bulan', value: 'bulanan' },
          { label: 'Per Minggu / Kustom', value: 'mingguan' },
        ]" placeholder="Tipe Rekap" search-placeholder="Cari tipe..." :disabled="isLoading" />
      </div>

      <!-- Sub Filter (Semester / Bulan / Rentang Tanggal) -->
      <div class="flex flex-col gap-1.5">
        <!-- Jika Tipe Rekap = Semester -->
        <template v-if="rekapType === 'semester'">
          <label class="text-xs font-semibold text-zinc-400">Semester</label>
          <UiSearchableSelect v-model="selectedSemester" :options="[
            { label: 'Ganjil', value: 'Ganjil' },
            { label: 'Genap', value: 'Genap' },
          ]" placeholder="Semester" search-placeholder="Cari semester..." :disabled="isLoading" />
        </template>

        <!-- Jika Tipe Rekap = Bulanan -->
        <template v-else-if="rekapType === 'bulanan'">
          <label class="text-xs font-semibold text-zinc-400">Pilih Bulan</label>
          <UiSearchableSelect v-model="selectedMonth"
            :options="monthNames.map((name, index) => ({ label: name, value: index + 1 }))"
            placeholder="Pilih Bulan" search-placeholder="Cari bulan..." :disabled="isLoading" />
        </template>

        <!-- Jika Tipe Rekap = Mingguan / Kustom -->
        <template v-else-if="rekapType === 'mingguan'">
          <label class="text-xs font-semibold text-zinc-400">Rentang Tanggal</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="date" v-model="startDate" :disabled="isLoading"
              class="h-10 px-2 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs" />
            <input type="date" v-model="endDate" :disabled="isLoading"
              class="h-10 px-2 rounded-lg border border-zinc-700/50 bg-zinc-900 text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs" />
          </div>
        </template>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-16">
        <Loader2 class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
        <p class="text-zinc-400 text-sm">Menghitung rekap absensi...</p>
      </div>

      <!-- Empty State (No Class Selected) -->
      <div v-else-if="!selectedClass" class="text-center py-16 px-4">
        <ClipboardList class="w-16 h-16 text-zinc-500 mx-auto mb-3" stroke-width="1.5" />
        <p class="text-zinc-400 font-semibold text-lg">Kelas belum dipilih</p>
        <p class="text-zinc-500 text-sm mt-1">
          Silakan pilih kelas terlebih dahulu untuk melihat rekapitulasi kehadiran.
        </p>
      </div>

      <!-- Empty State (No Rekap Data) -->
      <div v-else-if="rekapData.length === 0" class="text-center py-16 px-4">
        <Users class="w-16 h-16 text-zinc-500 mx-auto mb-3" stroke-width="1.5" />
        <p class="text-zinc-400 font-semibold text-lg">Tidak ada data</p>
        <p class="text-zinc-500 text-sm mt-1" v-if="rekapType === 'semester'">
          Belum ada rekaman absensi terisi di kelas {{ currentClassName }} pada {{ selectedTapel }} - {{ selectedSemester }}.
        </p>
        <p class="text-zinc-500 text-sm mt-1" v-else-if="rekapType === 'bulanan'">
          Belum ada rekaman absensi terisi di kelas {{ currentClassName }} pada Bulan {{ monthNames[selectedMonth - 1] }} ({{ selectedTapel }}).
        </p>
        <p class="text-zinc-500 text-sm mt-1" v-else-if="rekapType === 'mingguan'">
          Belum ada rekaman absensi terisi di kelas {{ currentClassName }} pada Rentang {{ formatDateIndo(startDate) }} s.d. {{ formatDateIndo(endDate) }}.
        </p>
      </div>

      <!-- Rekap Table -->
      <div v-else class="flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold">
                <th class="py-4 px-4 text-center w-12" rowspan="2">No</th>
                <th class="py-4 px-4" rowspan="2">Nama Siswa</th>
                <th class="py-4 px-4 w-28 text-center" rowspan="2">NISN</th>
                <th class="py-2 px-4 text-center border-b border-zinc-700/40" colspan="4">
                  Kehadiran (Hari)
                </th>
                <th class="py-4 px-4 text-center w-24" rowspan="2">
                  Hari Efektif
                </th>
                <th class="py-4 px-4 text-center w-24" rowspan="2">
                  Persentase
                </th>
              </tr>
              <tr class="bg-zinc-800/20 border-b border-zinc-700/50 text-zinc-400 text-[10px]">
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
              <tr v-for="(siswa, idx) in rekapData" :key="siswa.siswa_id"
                class="hover:bg-zinc-800/10 transition-colors">
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
                  class="py-4 px-2 text-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/6 dark:bg-emerald-500/2">
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
                  <span :class="[
                    parseFloat(hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif)) >= 90
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 dark:border-emerald-800/30'
                      : parseFloat(hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif)) >= 75
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-800/30'
                        : 'text-red-700 dark:text-red-400 bg-red-500/10 dark:bg-red-950/30 border-red-500/20 dark:border-red-800/30',
                    'px-2 py-0.5 rounded text-[11px] font-mono border',
                  ]">
                    {{ hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Action Info -->
        <div class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40">
          <div class="text-xs text-zinc-400">
            Total siswa:
            <span class="font-bold text-zinc-300">{{ rekapData.length }}</span>
            anak
          </div>
          <div class="text-xs text-zinc-500">
            Ket: H = Hadir, S = Sakit, I = Izin, A = Alpa
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClipboardList, Loader2, Users } from "lucide-vue-next";
import UiSearchableSelect from "~/components/ui/SearchableSelect.vue";
import type { RekapSiswa, RekapType } from "~/types/absensi";

const selectedClass = defineModel<string>("selectedClass", { required: true });
const selectedTapel = defineModel<string>("selectedTapel", { required: true });
const selectedSemester = defineModel<string>("selectedSemester", { required: true });
const rekapType = defineModel<RekapType>("rekapType", { required: true });
const selectedMonth = defineModel<number>("selectedMonth", { required: true });
const startDate = defineModel<string>("startDate", { required: true });
const endDate = defineModel<string>("endDate", { required: true });

defineProps<{
  dataKelas: any[];
  rekapData: RekapSiswa[];
  isLoading: boolean;
  isWaliKelas: boolean;
  tapelOptions: string[];
  currentClassName: string;
  monthNames: string[];
  toTitleCase: (str: string) => string;
  formatDateIndo: (dateStr: string) => string;
  hitungPersentase: (hadir: number | string, total: number | string) => string;
}>();
</script>
