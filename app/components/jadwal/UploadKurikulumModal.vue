<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeModal">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Modal Container -->
        <div
          class="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all"
          :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
          }">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b shrink-0" :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold" :style="{ color: 'var(--text-primary)' }">
                  Upload Kurikulum Pelajaran
                </h3>
                <p class="text-xs text-zinc-400">Import alokasi jam mengajar menggunakan template Excel</p>
              </div>
            </div>
            <button @click="closeModal"
              class="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-zinc-400 hover:text-zinc-200"
              :disabled="isParsing">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Step 1: Download Template or Upload File -->
            <div v-if="!parsedRows.length && !isParsing" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left: Download Section -->
              <div class="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between">
                <div>
                  <h4 class="font-medium text-sm text-zinc-200 mb-2 flex items-center gap-2">
                    <Download class="w-4 h-4 text-emerald-400" />
                    1. Unduh Template Excel
                  </h4>
                  <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                    Gunakan template Excel dinamis yang disesuaikan dengan tingkat kelas terdaftar saat ini. Isi alokasi
                    JP per mata pelajaran.
                  </p>
                </div>
                <button type="button" @click="downloadTemplate"
                  class="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                  <Download class="w-4 h-4" />
                  Unduh Template Excel
                </button>
              </div>

              <!-- Right: Upload Section -->
              <div
                class="p-5 rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/20 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
                @click="triggerFileSelect" @dragover.prevent @drop.prevent="handleFileDrop">
                <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleFileSelect" />
                <UploadCloud class="w-12 h-12 text-zinc-500 mb-3" />
                <h4 class="font-medium text-sm text-zinc-200 mb-1">
                  2. Pilih atau Drop File Excel
                </h4>
                <p class="text-xs text-zinc-500 max-w-[200px]">
                  Klik untuk menelusuri atau seret file Excel ke sini
                </p>
              </div>
            </div>

            <!-- Loading Spinner (File Parsing) -->
            <div v-if="isParsing" class="flex flex-col items-center justify-center py-12">
              <RefreshCw class="w-10 h-10 text-emerald-400 animate-spin mb-4" />
              <p class="text-sm text-zinc-300 font-medium">Membaca file Excel...</p>
            </div>

            <!-- Step 3: Preview Data & Verification Summary -->
            <div v-if="parsedRows.length && !isParsing" class="space-y-6">
              <!-- Summary Metrics Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <p class="text-[10px] uppercase text-zinc-500 font-bold">Total Baris</p>
                  <p class="text-2xl font-bold text-zinc-200">{{ parsedRows.length }}</p>
                </div>
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-emerald-400 font-bold">Mapel Baru (Tambah)</p>
                  <p class="text-2xl font-bold text-emerald-400">{{ summary.newCount }}</p>
                </div>
                <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-blue-400 font-bold">Update JP (Mapel Sama)</p>
                  <p class="text-2xl font-bold text-blue-400">{{ summary.updateCount }}</p>
                </div>
                <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-red-400 font-bold">Ditolak / Error</p>
                  <p class="text-2xl font-bold text-red-400">{{ summary.errorCount }}</p>
                </div>
              </div>

              <!-- Warning Alert -->
              <div v-if="summary.updateCount > 0"
                class="p-4 rounded-xl border flex items-start gap-3 bg-blue-500/10 border-blue-500/20 text-blue-300 text-xs">
                <AlertTriangle class="w-5 h-5 shrink-0 text-blue-400" />
                <div>
                  <span class="font-bold">Info Integrasi:</span> Terdapat <span class="font-bold">{{ summary.updateCount
                    }} mata pelajaran</span> yang sudah ada di database/tabel. Alokasi JP dan Kode Abreviasi pada
                  mapel-mapel ini akan diperbarui sesuai file Excel yang Anda upload.
                </div>
              </div>

              <!-- Table Preview -->
              <div class="border border-zinc-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-zinc-900 text-zinc-400 sticky top-0 border-b border-zinc-800">
                    <tr>
                      <th class="p-3 font-semibold w-12">No</th>
                      <th class="p-3 font-semibold">Nama Mata Pelajaran</th>
                      <th class="p-3 font-semibold w-32">Kode Abreviasi</th>
                      <th v-for="t in tingkatList" :key="t" class="p-3 font-semibold text-center w-24">
                        Kelas {{ t }} (JP)
                      </th>
                      <th class="p-3 font-semibold w-32 text-center">Status Aksi</th>
                      <th class="p-3 font-semibold text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/50 bg-zinc-950/20">
                    <tr v-for="(row, idx) in parsedRows" :key="idx" class="hover:bg-zinc-900/30">
                      <td class="p-3 text-zinc-500">{{ idx + 1 }}</td>
                      <td class="p-3 font-medium text-zinc-200">{{ row.nama_mapel || '-' }}</td>
                      <td class="p-3 text-zinc-300 font-mono">{{ row.kode_mapel || '-' }}</td>
                      <td v-for="t in tingkatList" :key="t" class="p-3 text-center text-zinc-400 font-bold">
                        {{ row.hours[t]?.alokasi_jam || '-' }}
                      </td>
                      <td class="p-3 text-center">
                        <span v-if="row._mode === 'create'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Mapel Baru
                        </span>
                        <span v-else-if="row._mode === 'update'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Perbarui JP
                        </span>
                        <span v-else
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          Error / Ditolak
                        </span>
                      </td>
                      <td class="p-3 text-right text-zinc-500 text-[10px]">
                        {{ row._errorMsg || 'Siap diterapkan' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t shrink-0" :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }">
            <!-- Left: Reset file -->
            <button v-if="parsedRows.length && !isParsing" type="button" @click="resetState"
              class="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5">
              <RefreshCw class="w-3.5 h-3.5" />
              Reset & Pilih File Lain
            </button>
            <div v-else></div>

            <!-- Right Actions -->
            <div class="flex items-center gap-3">
              <button type="button" @click="closeModal"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-800 text-zinc-300"
                :disabled="isParsing">
                Batal
              </button>
              <button v-if="parsedRows.length && !isParsing" type="button" @click="applyImport"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/10"
                :disabled="summary.newCount === 0 && summary.updateCount === 0">
                <Check class="w-4 h-4" />
                Terapkan ke Tabel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from "vue";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  X,
  AlertTriangle,
  RefreshCw,
  Check,
} from "lucide-vue-next";
import * as XLSX from "xlsx";

interface HourDetail {
  alokasi_jam: number;
  id?: string | number;
}

interface ParsedSubjectRow {
  rowId?: string | number;
  nama_mapel: string;
  kode_mapel: string;
  hours: Record<string | number, HourDetail>;
  _mode?: "create" | "update" | "error";
  _errorMsg?: string;
}

interface ExistingRow {
  rowId?: string | number;
  nama_mapel?: string;
  hours?: Record<string | number, HourDetail>;
  [key: string]: any;
}

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  tingkatList: {
    type: Array as PropType<(string | number)[]>,
    required: true,
    default: () => [],
  },
  existingRows: {
    type: Array as PropType<ExistingRow[]>,
    required: true,
    default: () => [],
  },
});

const emit = defineEmits < {
  (e: "close"): void;
(e: "apply", rows: ParsedSubjectRow[]): void;
}> ();

const fileInput = ref < HTMLInputElement | null > (null);
const parsedRows = ref < ParsedSubjectRow[] > ([]);
const isParsing = ref(false);

const summary = computed(() => {
  let newCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  parsedRows.value.forEach((r) => {
    if (r._mode === "create") newCount++;
    else if (r._mode === "update") updateCount++;
    else errorCount++;
  });

  return { newCount, updateCount, errorCount };
});

const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const resetState = () => {
  parsedRows.value = [];
  isParsing.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const closeModal = () => {
  if (!isParsing.value) {
    resetState();
    emit("close");
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleFileDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file: File) => {
  if (!file) return;
  isParsing.value = true;

  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    try {
      const target = e.target;
      if (!target || !target.result) {
        isParsing.value = false;
        return;
      }
      const data = new Uint8Array(target.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json < Record < string, any>> (worksheet);

      if (jsonData.length === 0) {
        alert("File Excel kosong atau tidak memiliki data.");
        isParsing.value = false;
        return;
      }

      // Group rows by subject name
      const grouped: Record<string, ParsedSubjectRow> = {};

      jsonData.forEach((rawRow) => {
        let rawKelas = "";
        let rawNama = "";
        let rawKode = "";
        let rawJP = 0;

        Object.entries(rawRow).forEach(([key, val]) => {
          const cleanKey = String(key).trim().toLowerCase();
          if (cleanKey === "kelas" || cleanKey === "tingkat") {
            rawKelas = val !== undefined && val !== null ? String(val).trim() : "";
          } else if (cleanKey === "nama mata pelajaran" || cleanKey === "nama_mapel" || cleanKey === "nama") {
            rawNama = val !== undefined && val !== null ? String(val).trim() : "";
          } else if (cleanKey === "kode abreviasi" || cleanKey === "kode_mapel" || cleanKey === "kode") {
            rawKode = val !== undefined && val !== null ? String(val).trim().toUpperCase() : "";
          } else if (cleanKey === "jp" || cleanKey === "jam" || cleanKey === "alokasi_jam" || cleanKey === "alokasi jam") {
            const parsed = parseInt(String(val), 10);
            rawJP = isNaN(parsed) || parsed < 0 ? 0 : parsed;
          }
        });

        if (!rawNama) return;

        const nameKey = rawNama.toLowerCase();
        if (!grouped[nameKey]) {
          grouped[nameKey] = {
            nama_mapel: rawNama,
            kode_mapel: rawKode,
            hours: {},
          };
        }

        // Try to match the rawKelas with existing levels in tingkatList
        const matchedTingkat = props.tingkatList.find(
          (t) => String(t).toLowerCase() === rawKelas.toLowerCase()
        );
        if (matchedTingkat) {
          grouped[nameKey].hours[matchedTingkat] = {
            alokasi_jam: rawJP,
          };
        }

        if (rawKode && !grouped[nameKey].kode_mapel) {
          grouped[nameKey].kode_mapel = rawKode;
        }
      });

      const rows: ParsedSubjectRow[] = Object.values(grouped).map((subjectRow) => {
        // Initialize missing levels with 0 alokasi_jam
        props.tingkatList.forEach((t) => {
          if (!subjectRow.hours[t]) {
            subjectRow.hours[t] = { alokasi_jam: 0 };
          }
        });

        // Check if exists in existingRows
        const existing = props.existingRows.find(
          (r) => String(r.nama_mapel).trim().toLowerCase() === subjectRow.nama_mapel.toLowerCase()
        );

        if (existing) {
          subjectRow.rowId = existing.rowId;
          // Preserve database IDs for hours if present, so we modify instead of deleting/re-creating
          props.tingkatList.forEach((t) => {
            if (existing.hours && existing.hours[t] && existing.hours[t].id !== undefined) {
              subjectRow.hours[t].id = existing.hours[t].id;
            }
          });
          subjectRow._mode = "update";
          subjectRow._errorMsg = "Memperbarui alokasi jam";
        } else {
          subjectRow.rowId = `temp_${Date.now()}_${Math.random()}`;
          subjectRow._mode = "create";
          subjectRow._errorMsg = "Mata pelajaran baru";
        }

        return subjectRow;
      });

      // Filter out empty/useless rows but show them as error if they have headers filled but no name
      parsedRows.value = rows.filter((r) => r && (r.nama_mapel || r._mode === "error"));
    } catch (err) {
      console.error(err);
      alert("Gagal membaca file Excel. Pastikan format file sesuai.");
    } finally {
      isParsing.value = false;
    }
  };

  reader.onerror = () => {
    alert("Terjadi kesalahan membaca file.");
    isParsing.value = false;
  };

  reader.readAsArrayBuffer(file);
};

const applyImport = () => {
  const validRows = parsedRows.value.filter((r) => r._mode === "create" || r._mode === "update");
  if (validRows.length === 0) return;

  emit("apply", validRows);
  closeModal();
};

const downloadTemplate = () => {
  const headers = ["Kelas", "Nama Mata Pelajaran", "Kode Abreviasi", "JP"];

  const sampleData: Record<string, any>[] = [];

  // Create sample entries representing different classes for the subjects
  props.tingkatList.forEach((t) => {
    sampleData.push({
      "Kelas": t,
      "Nama Mata Pelajaran": "Pendidikan Pancasila",
      "Kode Abreviasi": "PPNS",
      "JP": 2,
    });
  });

  props.tingkatList.forEach((t) => {
    sampleData.push({
      "Kelas": t,
      "Nama Mata Pelajaran": "Matematika",
      "Kode Abreviasi": "MAT",
      "JP": 4,
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Column Widths
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Template Kurikulum");
  XLSX.writeFile(wb, "Template_Rencana_Kurikulum.xlsx");
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
