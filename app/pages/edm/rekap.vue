<template>
  <div class="min-h-screen">
    <div class="page-layout">
      <!-- Header -->
      <UiPageHeader title="Rekap Pengisian EDM" :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'EDM' },
        { label: 'Rekapitulasi' },
      ]" />

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else-if="rekapData">
        <!-- Overall Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="rounded-xl p-5"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <p class="text-xs font-medium mb-1" style="color: var(--text-muted)">Total Instrumen</p>
            <p class="text-3xl font-bold" style="color: var(--text-heading)">
              {{ rekapData.overall?.total_indikator || 26 }}
            </p>
            <p class="text-[11px] mt-1" style="color: var(--text-muted)">5 Kategori (A–E)</p>
          </div>
          <div class="rounded-xl p-5"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <p class="text-xs font-medium mb-1" style="color: var(--text-muted)">Tahun Anggaran</p>
            <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ activeTahunVal }}
            </p>
            <p class="text-[11px] mt-1" style="color: var(--text-muted)">Evaluasi Diri Madrasah</p>
          </div>
          <div class="rounded-xl p-5"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">
            <p class="text-xs font-medium mb-1" style="color: var(--text-muted)">Nilai EDM (%)</p>
            <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ rekapData.overall?.persentase_skor_keseluruhan ?? 0 }}%
            </p>
            <p class="text-[11px] mt-1" style="color: var(--text-muted)">(Total Poin × 100) / Total Poin Maks</p>
          </div>
        </div>

        <!-- Ringkasan Poin Per Bagian -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold" style="color: var(--text-heading)">
            Ringkasan Poin Per Bagian
          </h2>
          <span v-if="selectedBagianFilter"
            @click="selectedBagianFilter = ''"
            class="text-xs font-medium cursor-pointer text-emerald-600 dark:text-emerald-400 hover:underline">
            Tampilkan Semua Bagian
          </span>
        </div>

        <div class="rounded-xl overflow-hidden mb-8"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <!-- Mobile Card View (< sm) -->
          <div class="block sm:hidden divide-y" style="border-color: var(--border-primary)">
            <div v-for="b in getBagianSummaryList(rekapData)" :key="'mob-' + (b.id || b.nama_bagian)"
              class="p-4 transition-colors cursor-pointer"
              :class="selectedBagianFilter === getBagianCode(b) ? 'bg-emerald-500/10' : 'hover:bg-[var(--bg-card-hover)]'"
              @click="selectedBagianFilter = selectedBagianFilter === getBagianCode(b) ? '' : getBagianCode(b)">
              
              <!-- Section Top Bar: Badge & Nilai (%) -->
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold text-white shrink-0"
                  :class="bagianColor(getBagianCode(b))">
                  Bagian {{ getBagianCode(b) }}
                </span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-xs font-medium" style="color: var(--text-muted)">Nilai Bagian:</span>
                  <span class="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {{ b.persentase_skor ?? 0 }}%
                  </span>
                </div>
              </div>

              <!-- Section Title (Full Width) -->
              <p class="font-semibold text-sm leading-relaxed mb-3" style="color: var(--text-heading)">
                {{ getBagianFullName(getBagianCode(b)) }}
              </p>

              <!-- Stats Breakdown Grid -->
              <div class="grid grid-cols-3 gap-2 text-center text-xs rounded-lg p-2.5"
                style="background: var(--bg-secondary)">
                <div>
                  <p class="text-[10px] font-medium" style="color: var(--text-muted)">Terisi</p>
                  <p class="font-semibold mt-0.5" style="color: var(--text-secondary)">
                    {{ b.jumlah_jawaban || 0 }}/{{ b.jumlah_indikator || 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-medium" style="color: var(--text-muted)">Poin Didapat</p>
                  <p class="font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {{ b.total_poin_didapat || 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-medium" style="color: var(--text-muted)">Poin Maks</p>
                  <p class="font-semibold mt-0.5" style="color: var(--text-muted)">
                    {{ b.total_poin_maksimal || (b.jumlah_indikator * 4) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop / Tablet Table View (>= sm) -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-sm min-w-[650px]">
              <thead>
                <tr style="background: var(--bg-secondary)">
                  <th class="text-left px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Kode & Nama Bagian</th>
                  <th class="text-center px-4 py-3 font-medium text-xs whitespace-nowrap" style="color: var(--text-muted)">Indikator Terisi</th>
                  <th class="text-center px-4 py-3 font-medium text-xs whitespace-nowrap" style="color: var(--text-muted)">Poin Didapat</th>
                  <th class="text-center px-4 py-3 font-medium text-xs whitespace-nowrap" style="color: var(--text-muted)">Total Poin Maksimal</th>
                  <th class="text-center px-4 py-3 font-medium text-xs whitespace-nowrap" style="color: var(--text-muted)">Nilai Bagian (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in getBagianSummaryList(rekapData)" :key="b.id || b.nama_bagian"
                  class="transition-colors hover:bg-[var(--bg-card-hover)] cursor-pointer"
                  :class="selectedBagianFilter === getBagianCode(b) ? 'bg-emerald-500/10' : ''"
                  style="border-top: 1px solid var(--border-primary)"
                  @click="selectedBagianFilter = selectedBagianFilter === getBagianCode(b) ? '' : getBagianCode(b)">
                  <td class="px-4 py-3 font-medium" style="color: var(--text-primary)">
                    <div class="flex items-start gap-2.5">
                      <span class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold text-white shrink-0 mt-0.5"
                        :class="bagianColor(getBagianCode(b))">
                        Bagian {{ getBagianCode(b) }}
                      </span>
                      <span class="leading-snug">{{ getBagianFullName(getBagianCode(b)) }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center whitespace-nowrap" style="color: var(--text-secondary)">
                    {{ b.jumlah_jawaban || 0 }} / {{ b.jumlah_indikator || 0 }}
                  </td>
                  <td class="px-4 py-3 text-center font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {{ b.total_poin_didapat || 0 }} Poin
                  </td>
                  <td class="px-4 py-3 text-center whitespace-nowrap" style="color: var(--text-muted)">
                    {{ b.total_poin_maksimal || (b.jumlah_indikator * 4) }} Poin
                  </td>
                  <td class="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 text-base whitespace-nowrap">
                    {{ b.persentase_skor ?? 0 }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Per Indikator Detail Table -->
        <h2 class="text-lg font-semibold mb-4" style="color: var(--text-heading)">
          Detail Jawaban Per Instrumen
          <span v-if="selectedBagianFilter" class="text-sm font-normal" style="color: var(--text-muted)">
            — Bagian {{ selectedBagianFilter }}: {{ getBagianFullName(selectedBagianFilter) }}
          </span>
        </h2>

        <div class="rounded-xl overflow-hidden"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr style="background: var(--bg-secondary)">
                  <th class="text-left px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Kode Soal</th>
                  <th class="text-left px-4 py-3 font-medium text-xs min-w-[250px]" style="color: var(--text-muted)">Pertanyaan Instrumen</th>
                  <th class="text-center px-4 py-3 font-medium text-xs" style="color: var(--text-muted)">Poin Jawaban (1–4)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ind in filteredIndikator" :key="ind.kode_soal || ind.id"
                  class="transition-colors hover:bg-[var(--bg-card-hover)]"
                  style="border-top: 1px solid var(--border-primary)">
                  <td class="px-4 py-3 font-mono text-xs font-bold" style="color: var(--text-primary)">
                    <span class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold text-white mr-1.5"
                      :class="bagianColor(getBagianCode(ind))">
                      {{ ind.kode_soal || ind.nomor_urut }}
                    </span>
                  </td>
                  <td class="px-4 py-3" style="color: var(--text-primary)">{{ ind.pertanyaan }}</td>
                  <td class="px-4 py-3 text-center">
                    <span v-if="ind.rata_rata_skor" class="font-bold text-base px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {{ ind.rata_rata_skor }}
                    </span>
                    <span v-else style="color: var(--text-muted)">-</span>
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
  isLoading, listTahun, selectedTahunId, selectedTahunLabel, activeTahun,
  fetchTahunAnggaran, fetchRekap,
} = useEdm();

const rekapData = ref(null);
const selectedBagianFilter = ref("");

const activeTahunVal = computed(() => {
  const t = listTahun.value.find((item) => item.id === selectedTahunId.value);
  return t ? t.tahun : (activeTahun.value?.tahun || new Date().getFullYear());
});

const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

const getBagianCode = (b) => {
  return b?.nama_bagian || b?.nama_kelompok || b?.bagian_target || b?.kelompok_target || "A";
};

const getBagianFullName = (code) => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  return meta ? (meta.title || meta.name.replace(/^Bagian\s+[A-Z]:\s*/i, "")) : "";
};

const getBagianSummaryList = (data) => {
  return data?.bagian || data?.kelompok || [];
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
