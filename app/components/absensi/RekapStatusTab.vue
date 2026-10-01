<template>
  <div>
    <!-- Filter Section for Status Tab -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6">
      <!-- Tahun Pelajaran -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Tahun Pelajaran</label>
        <UiSearchableSelect v-model="statusTapel" :options="tapelOptions" placeholder="Tahun Pelajaran"
          search-placeholder="Cari tahun..." :disabled="isLoadingStatus" />
      </div>

      <!-- Semester -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Semester</label>
        <UiSearchableSelect v-model="statusSemester" :options="[
          { label: 'Ganjil', value: 'Ganjil' },
          { label: 'Genap', value: 'Genap' },
        ]" placeholder="Semester" search-placeholder="Cari semester..." :disabled="isLoadingStatus" />
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="!isLoadingStatus && statusTableData.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- Total Kelas -->
      <div class="p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/20">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Users class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p class="text-xs text-zinc-500 font-medium">Total Kelas</p>
            <p class="text-xl font-bold text-zinc-100">{{ statusTableData.length }}</p>
          </div>
        </div>
      </div>

      <!-- Rata-rata Persentase -->
      <div class="p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/20">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p class="text-xs text-zinc-500 font-medium">Rata-rata Pengiriman</p>
            <p class="text-xl font-bold text-zinc-100">{{ avgPersentaseStatus }}%</p>
          </div>
        </div>
      </div>

      <!-- Kelas Bermasalah -->
      <div class="p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/20">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p class="text-xs text-zinc-500 font-medium">Kelas Belum Lengkap (&lt; 75%)</p>
            <p class="text-xl font-bold text-red-400">{{ kelasRendahCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Table Content Area -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoadingStatus" class="text-center py-16">
        <Loader2 class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
        <p class="text-zinc-400 text-sm">Menghitung status pengiriman absensi...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="statusTableData.length === 0" class="text-center py-16 px-4">
        <BarChart3 class="w-16 h-16 text-zinc-500 mx-auto mb-3" stroke-width="1.5" />
        <p class="text-zinc-400 font-semibold text-lg">Belum ada data pengiriman</p>
        <p class="text-zinc-500 text-sm mt-1">
          Belum ada rekaman absensi pada {{ statusTapel }} - {{ statusSemester }}.
        </p>
      </div>

      <!-- Status Table -->
      <div v-else class="flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold">
                <th class="py-4 px-4 text-center w-12">No</th>
                <th class="py-4 px-4">Kelas</th>
                <th class="py-4 px-4">Wali Kelas</th>
                <th class="py-4 px-4 text-center w-28">Hari Efektif</th>
                <th class="py-4 px-4 text-center w-28">Sudah Diabsen</th>
                <th class="py-4 px-4 text-center w-28">Belum Diabsen</th>
                <th class="py-4 px-4 text-center w-36">Progress</th>
                <th class="py-4 px-4 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
              <tr v-for="(row, idx) in statusTableData" :key="row.kelas_id"
                class="hover:bg-zinc-800/10 transition-colors">
                <td class="py-4 px-4 text-center text-zinc-500 font-mono">
                  {{ idx + 1 }}
                </td>
                <td class="py-4 px-4 font-semibold text-zinc-100">
                  {{ row.namaKelas }}
                </td>
                <td class="py-4 px-4 text-zinc-300">
                  {{ row.waliKelas || '-' }}
                </td>
                <td class="py-4 px-4 text-center text-zinc-300 font-bold">
                  {{ row.hariEfektif }}
                </td>
                <td class="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  {{ row.sudahDiabsen }}
                </td>
                <td class="py-4 px-4 text-center font-bold"
                  :class="row.belumDiabsen > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'">
                  {{ row.belumDiabsen }}
                </td>
                <!-- Progress Bar -->
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-2.5 rounded-full bg-zinc-700/50 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500" :class="[
                        row.persentase >= 90 ? 'bg-emerald-500' :
                          row.persentase >= 75 ? 'bg-amber-500' : 'bg-red-500'
                      ]" :style="{ width: Math.min(row.persentase, 100) + '%' }"></div>
                    </div>
                    <span class="text-xs font-mono text-zinc-400 w-12 text-right">{{ row.persentase.toFixed(1) }}%</span>
                  </div>
                </td>
                <!-- Status Badge -->
                <td class="py-4 px-4 text-center">
                  <span :class="[
                    row.persentase >= 90
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 dark:border-emerald-800/30'
                      : row.persentase >= 75
                        ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/20 dark:border-amber-800/30'
                        : 'text-red-700 dark:text-red-400 bg-red-500/10 dark:bg-red-950/30 border-red-500/20 dark:border-red-800/30',
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold border inline-flex items-center gap-1',
                  ]">
                    <CheckCircle v-if="row.persentase >= 90" class="w-3 h-3" />
                    <AlertTriangle v-else-if="row.persentase >= 75" class="w-3 h-3" />
                    <XCircle v-else class="w-3 h-3" />
                    {{ row.persentase >= 90 ? 'Baik' : row.persentase >= 75 ? 'Cukup' : 'Kurang' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Info -->
        <div class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40">
          <div class="text-xs text-zinc-400">
            Total kelas:
            <span class="font-bold text-zinc-300">{{ statusTableData.length }}</span>
          </div>
          <div class="text-xs text-zinc-500">
            Periode: {{ statusPeriodeLabel }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, BarChart3, CheckCircle, Loader2, Users, XCircle } from "lucide-vue-next";
import UiSearchableSelect from "~/components/ui/SearchableSelect.vue";
import type { StatusRow } from "~/types/absensi";

const statusTapel = defineModel<string>("statusTapel", { required: true });
const statusSemester = defineModel<string>("statusSemester", { required: true });

defineProps<{
  tapelOptions: string[];
  isLoadingStatus: boolean;
  statusTableData: StatusRow[];
  avgPersentaseStatus: string;
  kelasRendahCount: number;
  statusPeriodeLabel: string;
}>();
</script>
