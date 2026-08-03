<template>
  <div class="min-h-screen">
    <div class="page-layout">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--text-heading)">Indikator / Soal EDM</h1>
        <p class="mt-1 text-sm" style="color: var(--text-muted)">
          Kelola pertanyaan, bukti, pilihan, dan keterangan evaluasi diri
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <select v-model="selectedTahunId" @change="loadData"
          class="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)">
          <option v-for="t in listTahun" :key="t.id" :value="t.id">TA {{ t.tahun }}</option>
        </select>
        <select v-model="filterKelompok" @change="loadData"
          class="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)">
          <option value="">Semua Kelompok</option>
          <option v-for="k in ['A','B','C','D','E']" :key="k" :value="k">Kelompok {{ k }}</option>
        </select>
        <button @click="showImportModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary)">
          <Upload class="w-4 h-4" />
          Import Excel
        </button>
        <button @click="openAddForm"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-sm">
          <Plus class="w-4 h-4" />
          Tambah Indikator
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Indikator List -->
    <template v-else>
      <!-- Stats Bar -->
      <div class="flex items-center gap-4 mb-4 flex-wrap">
        <span class="text-sm font-medium" style="color: var(--text-secondary)">
          Total: <strong>{{ indikatorList.length }}</strong> indikator
        </span>
        <span v-for="k in kelompokStats" :key="k.name" class="text-xs px-2 py-0.5 rounded-full"
          style="background: var(--bg-secondary); color: var(--text-muted)">
          Kel. {{ k.name }}: {{ k.count }}
        </span>
      </div>

      <!-- Empty State -->
      <div v-if="indikatorList.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center rounded-xl"
        style="background: var(--bg-card); border: 1px solid var(--border-primary)">
        <ListChecks class="w-12 h-12 mb-3 opacity-30" style="color: var(--text-muted)" />
        <p class="font-medium mb-1" style="color: var(--text-heading)">Belum ada indikator</p>
        <p class="text-sm" style="color: var(--text-muted)">Tambah indikator satu-persatu atau import dari Excel</p>
      </div>

      <!-- Indikator Cards -->
      <div v-else class="space-y-3">
        <div v-for="(item, idx) in indikatorList" :key="item.id"
          class="rounded-xl p-4 transition-all duration-200 hover:shadow-md group"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <!-- Top Row: Number + Kelompok Badge + Komponen -->
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="text-xs font-mono px-2 py-0.5 rounded"
                  style="background: var(--bg-secondary); color: var(--text-muted)">
                  #{{ item.nomor_urut }}
                </span>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  :class="kelompokColor(item.kelompok_target)">
                  Kel. {{ item.kelompok_target }}
                </span>
                <span v-if="item.komponen" class="text-xs px-2 py-0.5 rounded"
                  style="background: var(--bg-secondary); color: var(--text-secondary)">
                  {{ item.komponen }}
                </span>
                <span v-if="item.sub_komponen" class="text-xs" style="color: var(--text-muted)">
                  › {{ item.sub_komponen }}
                </span>
              </div>

              <!-- Pertanyaan -->
              <p class="text-sm font-medium mb-2" style="color: var(--text-primary)">
                {{ item.pertanyaan }}
              </p>

              <!-- Details Row -->
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs" style="color: var(--text-muted)">
                <span v-if="item.bukti_yang_diminta" class="flex items-center gap-1">
                  <FileCheck class="w-3 h-3" />
                  Bukti: {{ item.bukti_yang_diminta }}
                </span>
                <span v-if="getPilihanCount(item)" class="flex items-center gap-1">
                  <CircleDot class="w-3 h-3" />
                  {{ getPilihanCount(item) }} pilihan
                </span>
                <span v-if="item.keterangan" class="flex items-center gap-1">
                  <Info class="w-3 h-3" />
                  {{ item.keterangan }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button @click="openEditForm(item)"
                class="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="handleDelete(item)"
                class="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal: Tambah/Edit Indikator -->
    <Teleport to="body">
      <div v-if="showFormModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style="background: var(--shadow-overlay)">
        <div class="relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <h3 class="text-lg font-semibold mb-5" style="color: var(--text-heading)">
            {{ editingItem ? 'Edit Indikator' : 'Tambah Indikator Baru' }}
          </h3>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Kelompok Target</label>
                <select v-model="formItem.kelompok_target"
                  class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)">
                  <option v-for="k in ['A','B','C','D','E']" :key="k" :value="k">Kelompok {{ k }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Nomor Urut</label>
                <input v-model.number="formItem.nomor_urut" type="number" min="1"
                  class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Komponen</label>
                <input v-model="formItem.komponen" type="text"
                  class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                  placeholder="Misal: Standar Isi">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Sub Komponen</label>
                <input v-model="formItem.sub_komponen" type="text"
                  class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                  placeholder="Misal: Kurikulum">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Pertanyaan *</label>
              <textarea v-model="formItem.pertanyaan" rows="3"
                class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
                style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                placeholder="Tulis pertanyaan indikator..."></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Bukti yang Diminta</label>
              <input v-model="formItem.bukti_yang_diminta" type="text"
                class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                placeholder="Misal: Dokumen kurikulum, foto kegiatan">
            </div>

            <!-- Pilihan Jawaban (Skor 1-4) -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">
                Pilihan Jawaban (Skor 1–4)
              </label>
              <div class="space-y-2">
                <div v-for="(p, i) in formPilihan" :key="i" class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white bg-emerald-600 flex-shrink-0">
                    {{ p.skor }}
                  </span>
                  <input v-model="p.label" type="text"
                    class="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                    :placeholder="`Label skor ${p.skor}`">
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--text-secondary)">Keterangan</label>
              <textarea v-model="formItem.keterangan" rows="2"
                class="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
                style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                placeholder="Keterangan tambahan..."></textarea>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button @click="showFormModal = false"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style="color: var(--text-secondary); background: var(--bg-secondary)">
              Batal
            </button>
            <button @click="handleSaveForm" :disabled="isSaving"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all">
              {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Import Excel -->
    <Teleport to="body">
      <div v-if="showImportModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4"
        style="background: var(--shadow-overlay)">
        <div class="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl"
          style="background: var(--bg-card); border: 1px solid var(--border-primary)">
          <h3 class="text-lg font-semibold mb-2" style="color: var(--text-heading)">Import Indikator dari Excel</h3>
          <p class="text-sm mb-5" style="color: var(--text-muted)">
            Upload file Excel (.xlsx) dengan kolom: kelompok_target, nomor_urut, komponen, sub_komponen, pertanyaan, bukti_yang_diminta, pilihan_1, pilihan_2, pilihan_3, pilihan_4, keterangan
          </p>

          <!-- Download Template -->
          <button @click="downloadTemplate"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-4 transition-all"
            style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary)">
            <Download class="w-4 h-4" />
            Download Template Excel
          </button>

          <!-- File Input -->
          <div class="mb-4">
            <input ref="fileInput" type="file" accept=".xlsx,.xls" @change="onFileChange"
              class="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
              style="color: var(--text-primary)">
          </div>

          <!-- Preview -->
          <div v-if="importPreview.length > 0" class="mb-4">
            <p class="text-sm font-medium mb-2" style="color: var(--text-secondary)">
              Preview: {{ importPreview.length }} indikator ditemukan
            </p>
            <div class="max-h-40 overflow-y-auto rounded-lg text-xs"
              style="background: var(--bg-secondary); border: 1px solid var(--border-primary)">
              <div v-for="(row, i) in importPreview.slice(0, 5)" :key="i" class="px-3 py-2"
                style="border-bottom: 1px solid var(--border-primary)">
                <span class="font-medium">Kel. {{ row.kelompok_target }} #{{ row.nomor_urut }}</span> — {{ row.pertanyaan }}
              </div>
              <div v-if="importPreview.length > 5" class="px-3 py-2 text-center" style="color: var(--text-muted)">
                ... dan {{ importPreview.length - 5 }} lainnya
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <button @click="showImportModal = false"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style="color: var(--text-secondary); background: var(--bg-secondary)">
              Batal
            </button>
            <button @click="handleImport" :disabled="isSaving || importPreview.length === 0"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all">
              {{ isSaving ? 'Mengimpor...' : `Import ${importPreview.length} Indikator` }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useEdm } from "~/composables/edm/useEdm";
import { useNotiflix } from "~/composables/ui/useFeedback";
import {
  Plus, Upload, Download, Pencil, Trash2, ListChecks,
  FileCheck, CircleDot, Info,
} from "lucide-vue-next";
import * as XLSX from "xlsx";

const { Notify, Confirm } = useNotiflix();
const {
  isLoading, isSaving, listTahun, selectedTahunId,
  fetchTahunAnggaran, fetchIndikator, saveIndikator, updateIndikator, deleteIndikator,
} = useEdm();

const indikatorList = ref([]);
const filterKelompok = ref("");

const showFormModal = ref(false);
const editingItem = ref(null);
const formItem = reactive({
  kelompok_target: "A",
  nomor_urut: 1,
  komponen: "",
  sub_komponen: "",
  pertanyaan: "",
  bukti_yang_diminta: "",
  keterangan: "",
});
const formPilihan = ref([
  { skor: 1, label: "Kurang" },
  { skor: 2, label: "Cukup" },
  { skor: 3, label: "Baik" },
  { skor: 4, label: "Sangat Baik" },
]);

const showImportModal = ref(false);
const importPreview = ref([]);
const fileInput = ref(null);

const kelompokColor = (name) => {
  const c = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return c[name] || "bg-zinc-600";
};

const kelompokStats = computed(() => {
  const counts = {};
  indikatorList.value.forEach((item) => {
    counts[item.kelompok_target] = (counts[item.kelompok_target] || 0) + 1;
  });
  return ["A", "B", "C", "D", "E"]
    .filter((k) => counts[k])
    .map((k) => ({ name: k, count: counts[k] }));
});

const getPilihanCount = (item) => {
  if (Array.isArray(item.pilihan)) return item.pilihan.length;
  return 0;
};

const loadData = async () => {
  if (!selectedTahunId.value) return;
  indikatorList.value = await fetchIndikator(
    selectedTahunId.value,
    filterKelompok.value || undefined,
  );
};

const openAddForm = () => {
  editingItem.value = null;
  Object.assign(formItem, {
    kelompok_target: filterKelompok.value || "A",
    nomor_urut: indikatorList.value.length + 1,
    komponen: "",
    sub_komponen: "",
    pertanyaan: "",
    bukti_yang_diminta: "",
    keterangan: "",
  });
  formPilihan.value = [
    { skor: 1, label: "Kurang" },
    { skor: 2, label: "Cukup" },
    { skor: 3, label: "Baik" },
    { skor: 4, label: "Sangat Baik" },
  ];
  showFormModal.value = true;
};

const openEditForm = (item) => {
  editingItem.value = item;
  Object.assign(formItem, {
    kelompok_target: item.kelompok_target,
    nomor_urut: item.nomor_urut,
    komponen: item.komponen || "",
    sub_komponen: item.sub_komponen || "",
    pertanyaan: item.pertanyaan,
    bukti_yang_diminta: item.bukti_yang_diminta || "",
    keterangan: item.keterangan || "",
  });
  if (Array.isArray(item.pilihan) && item.pilihan.length > 0) {
    formPilihan.value = item.pilihan.map((p) => ({ ...p }));
  } else {
    formPilihan.value = [
      { skor: 1, label: "Kurang" },
      { skor: 2, label: "Cukup" },
      { skor: 3, label: "Baik" },
      { skor: 4, label: "Sangat Baik" },
    ];
  }
  showFormModal.value = true;
};

const handleSaveForm = async () => {
  if (!formItem.pertanyaan.trim()) {
    Notify?.failure?.("Pertanyaan wajib diisi");
    return;
  }

  const payload = {
    ...formItem,
    pilihan: JSON.stringify(formPilihan.value),
  };

  let ok;
  if (editingItem.value) {
    ok = await updateIndikator(editingItem.value.id, payload);
  } else {
    ok = await saveIndikator({
      tahun_anggaran_id: selectedTahunId.value,
      ...payload,
    });
  }

  if (ok) {
    showFormModal.value = false;
    await loadData();
  }
};

const handleDelete = (item) => {
  Confirm?.show(
    "Hapus Indikator",
    `Apakah Anda yakin ingin menghapus indikator #${item.nomor_urut}?`,
    "Ya, Hapus",
    "Batal",
    async () => {
      const ok = await deleteIndikator(item.id);
      if (ok) await loadData();
    },
    () => {},
  );
};

// ---- Excel Template Download ----
const downloadTemplate = () => {
  const templateData = [
    {
      kelompok_target: "A",
      nomor_urut: 1,
      komponen: "Standar Isi",
      sub_komponen: "Kurikulum",
      pertanyaan: "Contoh pertanyaan indikator EDM",
      bukti_yang_diminta: "Dokumen kurikulum",
      pilihan_1: "Kurang",
      pilihan_2: "Cukup",
      pilihan_3: "Baik",
      pilihan_4: "Sangat Baik",
      keterangan: "Keterangan tambahan",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Indikator");
  XLSX.writeFile(wb, "template_indikator_edm.xlsx");
};

// ---- Excel Import ----
const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    importPreview.value = rows.map((row) => ({
      kelompok_target: String(row.kelompok_target || "A").toUpperCase(),
      nomor_urut: parseInt(row.nomor_urut) || 0,
      komponen: row.komponen || "",
      sub_komponen: row.sub_komponen || "",
      pertanyaan: row.pertanyaan || "",
      bukti_yang_diminta: row.bukti_yang_diminta || "",
      pilihan: JSON.stringify([
        { skor: 1, label: row.pilihan_1 || "Kurang" },
        { skor: 2, label: row.pilihan_2 || "Cukup" },
        { skor: 3, label: row.pilihan_3 || "Baik" },
        { skor: 4, label: row.pilihan_4 || "Sangat Baik" },
      ]),
      keterangan: row.keterangan || "",
    }));
  } catch (err) {
    Notify?.failure?.("Gagal membaca file Excel");
    importPreview.value = [];
  }
};

const handleImport = async () => {
  if (!selectedTahunId.value || importPreview.value.length === 0) return;

  const ok = await saveIndikator({
    tahun_anggaran_id: selectedTahunId.value,
    items: importPreview.value,
  });

  if (ok) {
    showImportModal.value = false;
    importPreview.value = [];
    if (fileInput.value) fileInput.value.value = "";
    await loadData();
  }
};

onMounted(async () => {
  await fetchTahunAnggaran();
  if (selectedTahunId.value) {
    await loadData();
  }
});
</script>
