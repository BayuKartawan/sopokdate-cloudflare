<template>
  <div>
    <!-- Filter Section (Tapel, Semester, Kategori, Filter Kelas) -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border bg-zinc-800/20 border-zinc-700/40 mb-6">
      <!-- Tahun Pelajaran -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Tahun Pelajaran</label>
        <UiSearchableSelect v-model="peringkatTapel" :options="tapelOptions" placeholder="Tahun Pelajaran"
          search-placeholder="Cari tahun..." :disabled="isLoadingPeringkat" />
      </div>

      <!-- Semester -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Semester</label>
        <UiSearchableSelect v-model="peringkatSemester" :options="[
          { label: 'Ganjil', value: 'Ganjil' },
          { label: 'Genap', value: 'Genap' },
        ]" placeholder="Semester" search-placeholder="Cari semester..." :disabled="isLoadingPeringkat" />
      </div>

      <!-- Kategori Ketidakhadiran -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Kategori Ketidakhadiran</label>
        <UiSearchableSelect v-model="kategoriPeringkat" :options="[
          { label: 'Paling Banyak Alpa (A)', value: 'alpa' },
          { label: 'Paling Banyak Sakit (S)', value: 'sakit' },
          { label: 'Paling Banyak Izin (I)', value: 'izin' },
          { label: 'Total Tidak Hadir (A+S+I)', value: 'total' },
        ]" placeholder="Pilih Kategori" search-placeholder="Cari kategori..." :disabled="isLoadingPeringkat" />
      </div>

      <!-- Filter Kelas / Rombel -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-zinc-400">Filter Kelas</label>
        <UiSearchableSelect v-model="filterKelasId" :options="kelasOptions" option-label="namaKelas"
          option-value="idKelas" placeholder="Semua Kelas" search-placeholder="Cari kelas..."
          :disabled="isLoadingPeringkat" />
      </div>
    </div>

    <!-- Summary Spotlight Cards (Top Alpa, Sakit, Izin) -->
    <div v-if="!isLoadingPeringkat && rawData.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- Top Alpa Card -->
      <div
        class="p-4 rounded-xl border border-red-500/20 bg-red-500/4 dark:bg-red-950/20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
            A
          </div>
          <div>
            <p class="text-[11px] font-medium text-red-500">Alpa Terbanyak</p>
            <p class="text-sm font-bold theme-text truncate max-w-35">
              {{ topAlpaStudent ? toTitleCase(topAlpaStudent.nama) : '-' }}
            </p>
            <p class="text-[10px] theme-text-muted">
              {{ topAlpaStudent ? getClassName(topAlpaStudent.kelas_id) : '' }}
            </p>
          </div>
        </div>
        <span class="text-xl font-bold text-red-500 font-mono">
          {{ topAlpaStudent ? topAlpaStudent.total_alpa : 0 }} <span class="text-xs font-normal">hari</span>
        </span>
      </div>

      <!-- Top Sakit Card -->
      <div
        class="p-4 rounded-xl border border-amber-500/20 bg-amber-500/4 dark:bg-amber-950/20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
            S
          </div>
          <div>
            <p class="text-[11px] font-medium text-amber-500">Sakit Terbanyak</p>
            <p class="text-sm font-bold theme-text truncate max-w-35">
              {{ topSakitStudent ? toTitleCase(topSakitStudent.nama) : '-' }}
            </p>
            <p class="text-[10px] theme-text-muted">
              {{ topSakitStudent ? getClassName(topSakitStudent.kelas_id) : '' }}
            </p>
          </div>
        </div>
        <span class="text-xl font-bold text-amber-500 font-mono">
          {{ topSakitStudent ? topSakitStudent.total_sakit : 0 }} <span class="text-xs font-normal">hari</span>
        </span>
      </div>

      <!-- Top Izin Card -->
      <div
        class="p-4 rounded-xl border border-blue-500/20 bg-blue-500/4 dark:bg-blue-950/20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
            I
          </div>
          <div>
            <p class="text-[11px] font-medium text-blue-500">Izin Terbanyak</p>
            <p class="text-sm font-bold theme-text truncate max-w-35">
              {{ topIzinStudent ? toTitleCase(topIzinStudent.nama) : '-' }}
            </p>
            <p class="text-[10px] theme-text-muted">
              {{ topIzinStudent ? getClassName(topIzinStudent.kelas_id) : '' }}
            </p>
          </div>
        </div>
        <span class="text-xl font-bold text-blue-500 font-mono">
          {{ topIzinStudent ? topIzinStudent.total_izin : 0 }} <span class="text-xs font-normal">hari</span>
        </span>
      </div>
    </div>

    <!-- Main Content Table -->
    <div class="rounded-xl border border-zinc-700/40 bg-zinc-900/20 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoadingPeringkat" class="text-center py-16">
        <Loader2 class="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
        <p class="text-zinc-400 text-sm">Menghitung peringkat ketidakhadiran siswa...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="rankedList.length === 0" class="text-center py-16 px-4">
        <Trophy class="w-16 h-16 text-zinc-500 mx-auto mb-3 opacity-50" stroke-width="1.5" />
        <p class="text-zinc-400 font-semibold text-lg">Tidak ada data ketidakhadiran</p>
        <p class="text-zinc-500 text-sm mt-1">
          Tidak ada siswa dengan catatan {{ kategoriLabel.toLowerCase() }} pada periode {{ peringkatTapel }} - {{ peringkatSemester }}.
        </p>
      </div>

      <!-- Ranked Table (Top 1 s.d. 5) -->
      <div v-else class="flex flex-col">
        <!-- Table Header Banner -->
        <div class="p-4 border-b border-zinc-700/40 bg-zinc-800/30 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <Trophy class="w-5 h-5 text-amber-400" />
            <h3 class="text-sm font-bold theme-text">
              Peringkat 1 s.d. {{ rankedList.length }} {{ kategoriLabel }}
            </h3>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {{ filterKelasId ? getClassName(filterKelasId) : 'Semua Kelas' }} • {{ peringkatSemester }} {{ peringkatTapel }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-zinc-800/40 border-b border-zinc-700/50 text-zinc-300 uppercase text-xs font-semibold">
                <th class="py-4 px-4 text-center w-16">Rank</th>
                <th class="py-4 px-4">Nama Siswa</th>
                <th class="py-4 px-4 text-center w-28">NISN</th>
                <th class="py-4 px-4 text-center w-28">Kelas</th>
                <th class="py-4 px-3 text-center w-20 text-red-400 font-bold"
                  :class="kategoriPeringkat === 'alpa' ? 'bg-red-500/10' : ''">
                  Alpa (A)
                </th>
                <th class="py-4 px-3 text-center w-20 text-amber-400"
                  :class="kategoriPeringkat === 'sakit' ? 'bg-amber-500/10' : ''">
                  Sakit (S)
                </th>
                <th class="py-4 px-3 text-center w-20 text-blue-400"
                  :class="kategoriPeringkat === 'izin' ? 'bg-blue-500/10' : ''">
                  Izin (I)
                </th>
                <th class="py-4 px-3 text-center w-28 font-bold"
                  :class="kategoriPeringkat === 'total' ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-300'">
                  Total Absen
                </th>
                <th class="py-4 px-4 text-center w-24 text-emerald-400">
                  Hadir (H)
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60 text-zinc-300">
              <tr v-for="item in rankedList" :key="item.siswa_id"
                class="hover:bg-zinc-800/10 transition-colors">
                <!-- Rank Badge -->
                <td class="py-4 px-4 text-center">
                  <div class="flex items-center justify-center">
                    <span v-if="item.rank === 1"
                      class="w-7 h-7 rounded-full bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-400/40 shadow-sm">
                      🥇 1
                    </span>
                    <span v-else-if="item.rank === 2"
                      class="w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-300/40 shadow-sm">
                      🥈 2
                    </span>
                    <span v-else-if="item.rank === 3"
                      class="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 font-bold text-xs flex items-center justify-center border border-amber-700/40 shadow-sm">
                      🥉 3
                    </span>
                    <span v-else
                      class="w-7 h-7 rounded-full bg-zinc-700/30 text-zinc-400 font-bold text-xs flex items-center justify-center border border-zinc-600/30">
                      {{ item.rank }}
                    </span>
                  </div>
                </td>
                <!-- Nama Siswa -->
                <td class="py-4 px-4 font-semibold text-zinc-100">
                  {{ toTitleCase(item.nama) }}
                </td>
                <!-- NISN -->
                <td class="py-4 px-4 text-center text-zinc-400 font-mono">
                  {{ item.nisn || "-" }}
                </td>
                <!-- Kelas -->
                <td class="py-4 px-4 text-center">
                  <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200">
                    {{ item.namaKelas }}
                  </span>
                </td>
                <!-- Total Alpa -->
                <td class="py-4 px-3 text-center font-bold text-red-400 font-mono"
                  :class="kategoriPeringkat === 'alpa' ? 'bg-red-500/6 text-base font-extrabold' : ''">
                  {{ item.total_alpa }}
                </td>
                <!-- Total Sakit -->
                <td class="py-4 px-3 text-center text-amber-400 font-mono"
                  :class="kategoriPeringkat === 'sakit' ? 'bg-amber-500/6 text-base font-extrabold' : ''">
                  {{ item.total_sakit }}
                </td>
                <!-- Total Izin -->
                <td class="py-4 px-3 text-center text-blue-400 font-mono"
                  :class="kategoriPeringkat === 'izin' ? 'bg-blue-500/6 text-base font-extrabold' : ''">
                  {{ item.total_izin }}
                </td>
                <!-- Total Absen -->
                <td class="py-4 px-3 text-center font-bold font-mono"
                  :class="kategoriPeringkat === 'total' ? 'bg-purple-500/6 text-purple-400 text-base font-extrabold' : 'text-zinc-200'">
                  {{ item.total_tidak_hadir }}
                </td>
                <!-- Total Hadir -->
                <td class="py-4 px-4 text-center text-emerald-400 font-mono">
                  {{ item.total_hadir }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Info -->
        <div class="flex items-center justify-between p-4 bg-zinc-800/20 border-t border-zinc-700/40">
          <div class="text-xs text-zinc-400">
            Menampilkan Top <strong>{{ rankedList.length }}</strong> siswa dengan ketidakhadiran tertinggi
          </div>
          <div class="text-xs text-zinc-500">
            Ket: Nilai diurutkan berdasarkan {{ kategoriLabel }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Loader2, Trophy } from "lucide-vue-next";
import UiSearchableSelect from "~/components/ui/SearchableSelect.vue";
import type { PeringkatSiswaItem, KategoriPeringkat } from "~/types/absensi";

const peringkatTapel = defineModel<string>("peringkatTapel", { required: true });
const peringkatSemester = defineModel<string>("peringkatSemester", { required: true });
const kategoriPeringkat = defineModel<KategoriPeringkat>("kategoriPeringkat", { required: true });
const filterKelasId = defineModel<string>("filterKelasId", { required: true });

const props = defineProps<{
  dataKelas: any[];
  tapelOptions: string[];
  isLoadingPeringkat: boolean;
  rawData: PeringkatSiswaItem[];
  rankedList: (PeringkatSiswaItem & { rank: number; namaKelas: string; selectedKategoriVal: number })[];
  kategoriLabel: string;
  topAlpaStudent: PeringkatSiswaItem | null;
  topSakitStudent: PeringkatSiswaItem | null;
  topIzinStudent: PeringkatSiswaItem | null;
  getClassName: (id: string) => string;
  toTitleCase: (str: string) => string;
}>();

const kelasOptions = computed(() => {
  const options = [{ idKelas: "", namaKelas: "-- Semua Kelas --" }];
  if (props.dataKelas) {
    props.dataKelas.forEach((c: any) => {
      options.push({ idKelas: c.idKelas, namaKelas: c.namaKelas });
    });
  }
  return options;
});
</script>
