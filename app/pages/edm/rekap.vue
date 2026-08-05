<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--text-heading)">Rekap Pengisian EDM</h1>
        <p class="mt-1 text-sm" style="color: var(--text-muted)">
          Ringkasan hasil evaluasi diri madrasah per bagian dan indikator (Jawaban Bagian)
        </p>
      </div>
      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
        {{ selectedTahunLabel }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="rekapData">
      <!-- Overall Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="rounded-xl p-5"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <p class="text-xs font-medium mb-1" style="color: var(--text-muted)">Total Indikator</p>
          <p class="text-3xl font-bold" style="color: var(--text-heading)">
            {{ rekapData.overall?.total_indikator || 0 }}
          </p>
        </div>
        <div class="rounded-xl p-5"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <p class="text-xs font-medium mb-1" style="color: var(--text-muted)">Bagian Mulai Mengisi</p>
          <p class="text-3xl font-bold" style="color: var(--text-heading)">
            {{ rekapData.overall?.total_bagian_terisi || rekapData.overall?.total_kelompok_terisi || 0 }} <span class="text-sm font-normal" style="color: var(--text-muted)">/ 5</span>
          </p>
        </div>
        <div class="rounded-xl p-5"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <p class="text-xs font-medium mb-1" style="color: var(--text-muted)">Rata-rata Skor Keseluruhan</p>
          <p class="text-3xl font-bold" :class="getSkorColor(rekapData.overall?.rata_rata_skor_keseluruhan)">
            {{ rekapData.overall?.rata_rata_skor_keseluruhan ?? '-' }}
            <span class="text-sm font-normal" style="color: var(--text-muted)">/ 4</span>
          </p>
        </div>
      </div>

      <!-- Per Bagian -->
      <h2 class="text-lg font-semibold mb-4" style="color: var(--text-heading)">
        Rekap Per Bagian
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div v-for="b in getBagianSummaryList(rekapData)" :key="getBagianCode(b)"
          @click="selectedBagianFilter = selectedBagianFilter === getBagianCode(b) ? '' : getBagianCode(b)"
          class="rounded-xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between"
          :class="selectedBagianFilter === getBagianCode(b) ? 'ring-2 ring-emerald-500/50 shadow-md' : ''"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">

          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                :class="bagianColor(getBagianCode(b))">
                Bagian {{ getBagianCode(b) }}
              </span>
              <span class="text-lg font-bold shrink-0" :class="getSkorColor(b.rata_rata_skor)">
                {{ b.rata_rata_skor ?? '-' }}
              </span>
            </div>

            <p class="text-xs font-semibold mb-3 line-clamp-2" style="color: var(--text-heading)">
              {{ getBagianFullName(getBagianCode(b)) }}
            </p>

            <div class="space-y-1 text-xs" style="color: var(--text-muted)">
              <div class="flex justify-between">
                <span>Anggota</span>
                <span class="font-medium" style="color: var(--text-primary)">{{ b.jumlah_anggota || 0 }} guru</span>
              </div>
              <div class="flex justify-between">
                <span>Total Indikator</span>
                <span class="font-medium" style="color: var(--text-primary)">{{ b.jumlah_indikator || 0 }}</span>
              </div>
              <div class="flex justify-between">
                <span>Dijawab</span>
                <span class="font-medium" style="color: var(--text-primary)">{{ b.jumlah_jawaban || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="w-full h-1.5 rounded-full mt-3" style="background: var(--bg-tertiary)">
            <div class="h-1.5 rounded-full transition-all duration-500"
              :class="bagianColor(getBagianCode(b))"
              :style="{ width: getBagProgress(b) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Per Indikator Detail Table -->
      <h2 class="text-lg font-semibold mb-4" style="color: var(--text-heading)">
        Detail Jawaban Per Indikator
        <span v-if="selectedBagianFilter" class="text-sm font-normal" style="color: var(--text-muted)">
          — {{ getBagianFullName(selectedBagianFilter) }}
        </span>
      </h2>

      <div class="rounded-xl overflow-hidden"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr style="background: var(--bg-secondary)">
                <th class="text-left px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Bagian</th>
                <th class="text-left px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">No</th>
                <th class="text-left px-4 py-3 font-medium text-xs min-w-[250px]" style="color: var(--text-muted)">Pertanyaan</th>
                <th class="text-center px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Skor Bagian</th>
                <th class="text-left px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Keterangan / Bukti</th>
                <th class="text-left px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Pengisi Terakhir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ind in filteredIndikator" :key="ind.id"
                class="transition-colors hover:bg-[var(--bg-card-hover)]"
                style="border-top: 1px solid var(--border-primary)">
                <td class="px-4 py-3">
                  <span class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold text-white"
                    :class="bagianColor(getBagianCode(ind))">
                    Bag. {{ getBagianCode(ind) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-mono text-xs" style="color: var(--text-muted)">{{ ind.nomor_urut }}</td>
                <td class="px-4 py-3" style="color: var(--text-primary)">{{ ind.pertanyaan }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="font-bold text-base" :class="getSkorColor(ind.rata_rata_skor)">
                    {{ ind.rata_rata_skor ?? '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs" style="color: var(--text-secondary)">
                  <div v-if="ind.jawaban_text">{{ ind.jawaban_text }}</div>
                  <a v-if="ind.bukti_url" :href="ind.bukti_url" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                    Link Bukti ↗
                  </a>
                  <span v-if="!ind.jawaban_text && !ind.bukti_url" style="color: var(--text-muted)">-</span>
                </td>
                <td class="px-4 py-3 text-xs" style="color: var(--text-muted)">
                  {{ ind.updated_by_nama || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style="background: var(--bg-card); border: 1px solid var(--border-primary)">
      <BarChart3 class="w-12 h-12 mb-3 opacity-30" style="color: var(--text-muted)" />
      <p class="font-medium" style="color: var(--text-heading)">Belum ada data rekap</p>
      <p class="text-sm" style="color: var(--text-muted)">Pilih tahun anggaran yang tersedia</p>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { BarChart3 } from "lucide-vue-next";

const {
  isLoading, selectedTahunId, selectedTahunLabel,
  fetchTahunAnggaran, fetchRekap,
} = useEdm();

const rekapData = ref(null);
const selectedBagianFilter = ref("");

const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

const getBagianCode = (b) => {
  return b?.nama_bagian || b?.nama_kelompok || b?.bagian_target || b?.kelompok_target || "A";
};

const getBagianFullName = (code) => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  return meta ? meta.name : `Bagian ${code}`;
};

const getBagianSummaryList = (data) => {
  return data?.bagian || data?.kelompok || [];
};

const getSkorColor = (skor) => {
  if (skor === null || skor === undefined) return "";
  if (skor >= 3.5) return "text-emerald-600 dark:text-emerald-400";
  if (skor >= 2.5) return "text-blue-600 dark:text-blue-400";
  if (skor >= 1.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const getBagProgress = (b) => {
  if (!b.jumlah_indikator) return 0;
  return Math.min(100, Math.round((b.jumlah_jawaban / b.jumlah_indikator) * 100));
};

const filteredIndikator = computed(() => {
  if (!rekapData.value?.per_indikator) return [];
  if (!selectedBagianFilter.value) return rekapData.value.per_indikator;
  return rekapData.value.per_indikator.filter(
    (ind) => getBagianCode(ind) === selectedBagianFilter.value
  );
});

const loadData = async () => {
  if (!selectedTahunId.value) return;
  rekapData.value = await fetchRekap(selectedTahunId.value);
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (selectedTahunId.value) {
    await loadData();
  }
});
</script>
