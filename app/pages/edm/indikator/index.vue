<template>
  <div class="min-h-screen">
    <div class="page-layout">

      <!-- ── Header ─────────────────────────────────────────── -->
      <div class="flex flex-col gap-3 mb-6">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold" style="color:var(--text-heading)">
            Indikator / Soal EDM
          </h1>
          <p class="mt-1 text-xs sm:text-sm" style="color:var(--text-muted)">
            Kelola pertanyaan, bukti fisik, dan pilihan evaluasi diri per bagian
          </p>
        </div>

        <!-- Controls row -->
        <div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:flex-wrap">
          <!-- Tahun badge -->
          <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            {{ selectedTahunLabel }}
          </span>

          <!-- Action buttons -->
          <div class="flex gap-2 sm:ml-auto">
            <button @click="showImportModal = true"
              class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-primary)">
              <Upload class="w-4 h-4 shrink-0" />
              <span>Import Excel</span>
            </button>
            <NuxtLink :to="{ path: '/edm/indikator/tambah', query: { tahun_id: selectedTahunId, bagian: filterBagian || activeBagianTab || 'A' } }"
              class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
              <Plus class="w-4 h-4 shrink-0" />
              <span>Tambah Indikator</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ── Loading ─────────────────────────────────────────── -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- ── Content ─────────────────────────────────────────── -->
      <template v-else>

        <!-- Stats Bar -->
        <div class="flex items-center gap-2 mb-4 flex-wrap">
          <span class="text-sm font-medium" style="color:var(--text-secondary)">
            Total: <strong>{{ indikatorList.length }}</strong>
          </span>
          <span v-for="b in bagianStats" :key="b.code"
            class="text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-all"
            :class="activeBagianTab === b.code
              ? 'text-white ' + bagianColor(b.code)
              : ''"
            :style="activeBagianTab === b.code ? '' : 'background:var(--bg-secondary);color:var(--text-muted)'"
            :title="getBagianFullName(b.code)"
            @click="activeBagianTab = activeBagianTab === b.code ? '' : b.code; currentPage = 1">
            Bag.{{ b.code }}: {{ b.count }}
          </span>
          <button v-if="activeBagianTab" @click="activeBagianTab = ''; currentPage = 1"
            class="text-xs px-2 py-1 rounded-lg transition-all cursor-pointer"
            style="background:var(--bg-secondary);color:var(--text-muted)">
            × Reset
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="indikatorList.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
          style="background:var(--bg-card);border:1px solid var(--border-primary)">
          <ListChecks class="w-12 h-12 mb-3 opacity-30" style="color:var(--text-muted)" />
          <p class="font-semibold text-base mb-1" style="color:var(--text-heading)">Belum ada indikator</p>
          <p class="text-sm max-w-md mb-4" style="color:var(--text-muted)">Tambah indikator melalui form halaman baru atau import dari file Excel</p>
          <NuxtLink :to="{ path: '/edm/indikator/tambah', query: { tahun_id: selectedTahunId } }"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
            <Plus class="w-4 h-4" />
            Tambah Indikator Baru
          </NuxtLink>
        </div>

        <template v-else>
          <!-- ── Bagian Tab Groups ──────────────────────────────── -->
          <div v-for="bagian in visibleBagianList" :key="bagian.code" class="mb-6">

            <!-- Bagian Header -->
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white shrink-0"
                :class="bagianColor(bagian.code)">
                {{ bagian.code }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate" style="color:var(--text-heading)">
                  {{ bagian.title }}
                </p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full shrink-0"
                style="background:var(--bg-secondary);color:var(--text-muted)">
                {{ getItemsByBagian(bagian.code).length }} soal
              </span>
            </div>

            <!-- Cards grid -->
            <div class="grid grid-cols-1 gap-3">
              <div v-for="item in getPaginatedItems(bagian.code)" :key="item.id"
                class="rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md group"
                style="background:var(--bg-card);border:1px solid var(--border-primary)">

                <div class="flex items-start gap-3">
                  <!-- Nomor badge -->
                  <div class="shrink-0 mt-0.5">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-mono font-bold"
                      style="background:var(--bg-secondary);color:var(--text-muted)">
                      {{ item.nomor_urut }}
                    </span>
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold leading-relaxed mb-2 break-words whitespace-pre-line" style="color:var(--text-heading)">
                      {{ item.pertanyaan }}
                    </p>

                    <!-- Bukti yang diminta -->
                    <div v-if="item.bukti_yang_diminta"
                      class="mb-3 p-3 rounded-lg text-xs break-words whitespace-pre-line flex items-start gap-2"
                      style="background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border-subtle)">
                      <FileCheck class="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div class="flex-1 min-w-0">
                        <strong class="font-semibold block text-emerald-700 dark:text-emerald-400 mb-0.5">Bukti yang diminta:</strong>
                        <span class="leading-relaxed">{{ item.bukti_yang_diminta }}</span>
                      </div>
                    </div>

                    <!-- Summary Pilihan -->
                    <div v-if="getPilihanCount(item)" class="flex flex-wrap gap-2 text-xs">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                        style="background:var(--bg-secondary);color:var(--text-muted)">
                        <CircleDot class="w-3.5 h-3.5 shrink-0" />
                        <span>{{ getPilihanCount(item) }} pilihan skor (1–4)</span>
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1 shrink-0">
                    <NuxtLink :to="`/edm/indikator/${item.id}`"
                      class="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors cursor-pointer"
                      title="Edit Indikator">
                      <Pencil class="w-4 h-4" />
                    </NuxtLink>
                    <button @click="handleDelete(item)"
                      class="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                      title="Hapus Indikator">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination per bagian -->
            <div v-if="getTotalPages(bagian.code) > 1"
              class="flex items-center justify-between mt-3 pt-3"
              style="border-top:1px solid var(--border-subtle)">
              <span class="text-xs" style="color:var(--text-muted)">
                Hal {{ getBagianPage(bagian.code) }} / {{ getTotalPages(bagian.code) }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  @click="setBagianPage(bagian.code, getBagianPage(bagian.code) - 1)"
                  :disabled="getBagianPage(bagian.code) <= 1"
                  class="p-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 cursor-pointer"
                  style="background:var(--bg-secondary);color:var(--text-primary)">
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                  v-for="pg in getPageNumbers(bagian.code)" :key="pg"
                  @click="typeof pg === 'number' && setBagianPage(bagian.code, pg)"
                  :disabled="pg === '…'"
                  class="min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  :class="pg === getBagianPage(bagian.code)
                    ? 'text-white bg-emerald-600'
                    : 'hover:bg-emerald-500/10'"
                  :style="pg === getBagianPage(bagian.code) ? '' : 'color:var(--text-secondary);background:var(--bg-secondary)'">
                  {{ pg }}
                </button>
                <button
                  @click="setBagianPage(bagian.code, getBagianPage(bagian.code) + 1)"
                  :disabled="getBagianPage(bagian.code) >= getTotalPages(bagian.code)"
                  class="p-1.5 rounded-lg text-xs transition-colors disabled:opacity-30 cursor-pointer"
                  style="background:var(--bg-secondary);color:var(--text-primary)">
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
          <!-- /bagian loop -->
        </template>
      </template>
      <!-- /content -->

      <!-- ── Modal: Import Excel ─────────────────────────────── -->
      <Teleport to="body">
        <div v-if="showImportModal"
          class="fixed inset-0 z-[999] flex items-end sm:items-center justify-center sm:p-4"
          style="background:var(--shadow-overlay)"
          @click.self="showImportModal = false">
          <div class="relative w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto"
            style="background:var(--bg-card);border:1px solid var(--border-primary)">

            <div class="sm:hidden w-10 h-1 rounded-full mx-auto mb-4" style="background:var(--border-secondary)"></div>

            <h3 class="text-base sm:text-lg font-semibold mb-1" style="color:var(--text-heading)">
              Import Indikator dari Excel
            </h3>
            <p class="text-xs mb-4" style="color:var(--text-muted)">
              Upload file Excel (.xlsx) dengan kolom: bagian_target (A–E), nomor_urut, pertanyaan, bukti_yang_diminta, pilihan_1, pilihan_2, pilihan_3, pilihan_4
            </p>

            <div class="space-y-4">
              <button @click="downloadTemplate" type="button"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-primary)">
                <Download class="w-3.5 h-3.5" />
                Download Template Excel
              </button>

              <input ref="fileInput" type="file" accept=".xlsx,.xls" @change="onFileChange"
                class="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                style="color:var(--text-muted)" />

              <!-- Preview -->
              <div v-if="importPreview.length > 0"
                class="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-lg"
                style="background:var(--bg-secondary)">
                <p class="text-xs font-medium mb-2" style="color:var(--text-heading)">
                  Preview Data ({{ importPreview.length }} indikator):
                </p>
                <div v-for="(row, i) in importPreview" :key="i" class="text-xs truncate" style="color:var(--text-secondary)">
                  <span class="font-medium">Bag.{{ row.bagian_target }} #{{ row.nomor_urut }}</span>
                  — {{ row.pertanyaan }}
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button @click="showImportModal = false"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                style="color:var(--text-secondary);background:var(--bg-secondary)">
                Batal
              </button>
              <button @click="handleImport" :disabled="isSaving || importPreview.length === 0"
                class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer">
                {{ isSaving ? 'Mengimpor...' : `Import ${importPreview.length} Data` }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import * as XLSX from "xlsx";
import {
  ListChecks, Plus, Upload, Download, Pencil, Trash2,
  FileCheck, CircleDot, ChevronLeft, ChevronRight,
} from "lucide-vue-next";

const { Notify, Confirm } = useNotiflix();
const {
  isLoading, isSaving, selectedTahunId, selectedTahunLabel,
  fetchTahunAnggaran, fetchIndikator, saveIndikator, deleteIndikator,
} = useEdm();

// ── Data ──────────────────────────────────────────────────────
const indikatorList = ref([]);
const filterBagian   = ref("");

// ── Tabs & Pagination ─────────────────────────────────────────
const PAGE_SIZE       = 10;
const activeBagianTab = ref("");
const currentPage     = ref(1);
const bagianPages     = ref({});

const getBagianPage  = (code) => bagianPages.value[code] ?? 1;
const setBagianPage  = (code, pg) => { bagianPages.value[code] = pg; };
const getTotalPages  = (code) => Math.ceil(getItemsByBagian(code).length / PAGE_SIZE);

const getPageNumbers = (code) => {
  const total = getTotalPages(code);
  const cur   = getBagianPage(code);
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (cur > 3)            pages.push("…");
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
  if (cur < total - 2)    pages.push("…");
  pages.push(total);
  return pages;
};

const getItemsByBagian  = (code) => indikatorList.value.filter((i) => getBagianCode(i) === code);
const getPaginatedItems = (code) => {
  const pg    = getBagianPage(code);
  const start = (pg - 1) * PAGE_SIZE;
  return getItemsByBagian(code).slice(start, start + PAGE_SIZE);
};

const visibleBagianList = computed(() => {
  return EDM_BAGIAN_LIST.filter((b) => {
    const hasItems = getItemsByBagian(b.code).length > 0;
    if (!hasItems) return false;
    return activeBagianTab.value ? b.code === activeBagianTab.value : true;
  });
});

// ── Import Modal ──────────────────────────────────────────────
const showImportModal = ref(false);
const importPreview   = ref([]);
const fileInput       = ref(null);

// ── Helpers ───────────────────────────────────────────────────
const bagianColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] ?? "bg-zinc-600";
};

const getBagianCode    = (item) => item?.bagian_target || item?.kelompok_target || "A";
const getBagianFullName = (code) => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  return meta ? meta.name : `Bagian ${code}`;
};

const bagianStats = computed(() => {
  const counts = {};
  indikatorList.value.forEach((item) => {
    const code = getBagianCode(item);
    counts[code] = (counts[code] || 0) + 1;
  });
  return EDM_BAGIAN_LIST
    .map((b) => ({ code: b.code, count: counts[b.code] || 0 }))
    .filter((b) => b.count > 0);
});

const getPilihanCount = (item) => Array.isArray(item.pilihan) ? item.pilihan.length : 0;

// ── CRUD ──────────────────────────────────────────────────────
const loadData = async () => {
  if (!selectedTahunId.value) return;
  indikatorList.value = await fetchIndikator(
    selectedTahunId.value,
    filterBagian.value || undefined,
  );
  bagianPages.value = {};
};

const handleDelete = (item) => {
  Confirm?.show(
    "Hapus Indikator",
    `Apakah Anda yakin ingin menghapus indikator #${item.nomor_urut}?`,
    "Ya, Hapus", "Batal",
    async () => { const ok = await deleteIndikator(item.id); if (ok) await loadData(); },
    () => {},
  );
};

// ── Excel Template Download ───────────────────────────────────
const downloadTemplate = () => {
  const templateData = [{
    bagian_target:      "A",
    nomor_urut:          1,
    pertanyaan:          "Contoh pertanyaan indikator EDM Bagian A",
    bukti_yang_diminta:  "Dokumen kedisiplinan madrasah",
    pilihan_1:           "Kurang",
    pilihan_2:           "Cukup",
    pilihan_3:           "Baik",
    pilihan_4:           "Sangat Baik",
  }];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Indikator");
  XLSX.writeFile(wb, "template_indikator_edm.xlsx");
};

// ── Excel Import ──────────────────────────────────────────────
const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(data, { type: "array" });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);
    importPreview.value = rows.map((row) => ({
      bagian_target:      String(row.bagian_target || row.kelompok_target || "A").toUpperCase(),
      nomor_urut:          parseInt(row.nomor_urut) || 0,
      pertanyaan:          row.pertanyaan || "",
      bukti_yang_diminta:  row.bukti_yang_diminta || "",
      pilihan: JSON.stringify([
        { skor: 1, label: row.pilihan_1 || "Kurang" },
        { skor: 2, label: row.pilihan_2 || "Cukup" },
        { skor: 3, label: row.pilihan_3 || "Baik" },
        { skor: 4, label: row.pilihan_4 || "Sangat Baik" },
      ]),
    }));
  } catch {
    Notify?.failure?.("Gagal membaca file Excel");
    importPreview.value = [];
  }
};

const handleImport = async () => {
  if (!selectedTahunId.value || importPreview.value.length === 0) return;
  const ok = await saveIndikator({
    tahun_anggaran_id: selectedTahunId.value,
    items:             importPreview.value,
  });
  if (ok) {
    showImportModal.value = false;
    importPreview.value   = [];
    if (fileInput.value) fileInput.value.value = "";
    await loadData();
  }
};

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
  await fetchTahunAnggaran();
  if (selectedTahunId.value) await loadData();
});
</script>
