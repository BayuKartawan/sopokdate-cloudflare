<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Modal Container -->
        <div
          class="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all"
          :style="{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
          }"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b shrink-0"
            :style="{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
            }"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold" :style="{ color: 'var(--text-primary)' }">
                  {{ targetTable === 'alumni' ? 'Upload Banyak Alumni' : targetTable === 'mutasi_siswa' ? 'Upload Banyak Siswa Mutasi' : 'Upload Banyak Siswa' }}
                </h3>
                <p class="text-xs text-zinc-400">
                  {{ targetTable === 'alumni' ? 'Import data alumni menggunakan template Excel' : targetTable === 'mutasi_siswa' ? 'Import data mutasi siswa menggunakan template Excel' : 'Import data siswa menggunakan template Excel' }}
                </p>
              </div>
            </div>
            <button
              @click="closeModal"
              class="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-zinc-400 hover:text-zinc-200"
              :disabled="isUploading"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Step 1: Download Template or Upload File -->
            <div v-if="!parsedRows.length && !isUploading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left: Download Section -->
              <div class="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between">
                <div>
                  <h4 class="font-medium text-sm text-zinc-200 mb-2 flex items-center gap-2">
                    <Download class="w-4 h-4 text-emerald-400" />
                    1. Unduh Template Excel
                  </h4>
                  <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                    Gunakan template Excel standar yang disediakan untuk memastikan format data yang di-upload sudah sesuai dengan sistem database.
                  </p>
                </div>
                <button
                  type="button"
                  @click="downloadTemplate"
                  class="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
                >
                  <Download class="w-4 h-4" />
                  Unduh Template Excel
                </button>
              </div>

              <!-- Right: Upload Section -->
              <div
                class="p-5 rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/20 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px]"
                @click="triggerFileSelect"
                @dragover.prevent
                @drop.prevent="handleFileDrop"
              >
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden"
                  accept=".xlsx, .xls"
                  @change="handleFileSelect"
                />
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

            <!-- Step 2: Upload Progress -->
            <div v-if="isUploading" class="space-y-4 py-8">
              <div class="flex items-center justify-between text-sm">
                <span class="text-zinc-400">Memproses upload...</span>
                <span class="font-medium text-emerald-400">{{ uploadProgress }}% ({{ uploadIndex }}/{{ totalToUpload }})</span>
              </div>
              <div class="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div
                  class="bg-emerald-500 h-full transition-all duration-300"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
              <p class="text-xs text-zinc-500 text-center">
                Jangan tutup modal ini hingga seluruh baris selesai diproses.
              </p>
            </div>

            <!-- Step 3: Preview Data & Verification Summary -->
            <div v-if="parsedRows.length && !isUploading && !isParsing" class="space-y-6">
              <!-- Summary Metrics Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <p class="text-[10px] uppercase text-zinc-500 font-bold">Total Baris</p>
                  <p class="text-2xl font-bold text-zinc-200">{{ parsedRows.length }}</p>
                </div>
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-emerald-400 font-bold">
                    {{ targetTable === 'alumni' ? 'Alumni Baru (Insert)' : 'Siswa Baru (Insert)' }}
                  </p>
                  <p class="text-2xl font-bold text-emerald-400">{{ summary.newCount }}</p>
                </div>
                <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-blue-400 font-bold">Update Data (NIS Sama)</p>
                  <p class="text-2xl font-bold text-blue-400">{{ summary.updateCount }}</p>
                </div>
                <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p class="text-[10px] uppercase text-red-400 font-bold">Ditolak / Error</p>
                  <p class="text-2xl font-bold text-red-400">{{ summary.errorCount }}</p>
                </div>
              </div>

              <!-- Warning Alert -->
              <div
                v-if="summary.updateCount > 0"
                class="p-4 rounded-xl border flex items-start gap-3 bg-blue-500/10 border-blue-500/20 text-blue-300 text-xs"
              >
                <AlertTriangle class="w-5 h-5 shrink-0 text-blue-400" />
                <div>
                  <span class="font-bold">Info Integrasi:</span> Terdapat <span class="font-bold">{{ summary.updateCount }} {{ targetTable === 'alumni' ? 'alumni' : 'siswa' }}</span> dengan NIS Lokal yang sama dengan data di database. Baris data ini tidak akan terduplikat, namun data lamanya di database akan diperbarui dengan data baru dari Excel.
                </div>
              </div>

              <!-- Table Preview -->
              <div class="border border-zinc-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-zinc-900 text-zinc-400 sticky top-0 border-b border-zinc-800">
                    <tr>
                      <th class="p-3 font-semibold">No</th>
                      <th class="p-3 font-semibold">Nama</th>
                      <th class="p-3 font-semibold">NIS Lokal</th>
                      <th class="p-3 font-semibold">{{ targetTable === 'alumni' ? 'Tahun Lulus' : 'Kelas' }}</th>
                      <th class="p-3 font-semibold">JK</th>
                      <th class="p-3 font-semibold">Status Aksi</th>
                      <th class="p-3 font-semibold text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/50 bg-zinc-950/20">
                    <tr v-for="(row, idx) in parsedRows" :key="idx" class="hover:bg-zinc-900/30">
                      <td class="p-3 text-zinc-500">{{ idx + 1 }}</td>
                      <td class="p-3 font-medium text-zinc-200">{{ row.nama || '-' }}</td>
                      <td class="p-3 text-zinc-300 font-mono">{{ row.nis_lokal || '-' }}</td>
                      <td class="p-3 text-zinc-400">{{ targetTable === 'alumni' ? (row.thn_lulus || '-') : (row._displayClass || '-') }}</td>
                      <td class="p-3 text-zinc-400">{{ row.jenis_kelamin || '-' }}</td>
                      <td class="p-3">
                        <span
                          v-if="row._mode === 'create'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {{ targetTable === 'alumni' ? 'Alumni Baru' : 'Siswa Baru' }}
                        </span>
                        <span
                          v-else-if="row._mode === 'update'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        >
                          Perbarui Data
                        </span>
                        <span
                          v-else
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          Error / Ditolak
                        </span>
                      </td>
                      <td class="p-3 text-right text-zinc-500 text-[10px]">
                        {{ row._errorMsg || 'Siap diimport' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-between px-6 py-4 border-t shrink-0"
            :style="{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
            }"
          >
            <!-- Left: Reset file -->
            <button
              v-if="parsedRows.length && !isUploading"
              type="button"
              @click="resetState"
              class="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              Reset & Pilih File Lain
            </button>
            <div v-else></div>

            <!-- Right Actions -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-800 text-zinc-300"
                :disabled="isUploading"
              >
                Batal
              </button>
              <button
                v-if="parsedRows.length && !isUploading"
                type="button"
                @click="processUpload"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/10"
                :disabled="summary.newCount === 0 && summary.updateCount === 0"
              >
                <Play class="w-4 h-4" />
                Proses Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  X,
  AlertTriangle,
  RefreshCw,
  Play,
} from "lucide-vue-next";
import * as XLSX from "xlsx";
import { postToApi, putToApi } from "~/utils/api";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  dataSiswa: {
    type: Array,
    required: true,
    default: () => [],
  },
  dataKelas: {
    type: Array,
    default: () => [],
  },
  targetTable: {
    type: String,
    default: "data_siswa",
  },
});

const emit = defineEmits(["close", "success"]);

const fileInput = ref(null);
const parsedRows = ref([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadIndex = ref(0);
const totalToUpload = ref(0);

const uploadProgress = computed(() => {
  if (totalToUpload.value === 0) return 0;
  return Math.round((uploadIndex.value / totalToUpload.value) * 100);
});

// Summary calculations for preview
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
  isUploading.value = false;
  uploadIndex.value = 0;
  totalToUpload.value = 0;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const closeModal = () => {
  if (!isUploading.value) {
    resetState();
    emit("close");
  }
};

// Map common headers to DB keys
const fieldMapping = {
  nama: "nama",
  "nama lengkap": "nama",
  nisn: "nisn",
  "nis lokal": "nis_lokal",
  nis_lokal: "nis_lokal",
  nik: "nik",
  "no kk": "no_kk",
  no_kk: "no_kk",
  "nomor kk": "no_kk",
  "tempat lahir": "tempat_lahir",
  tempat_lahir: "tempat_lahir",
  "tanggal lahir": "tanggal_lahir",
  tanggal_lahir: "tanggal_lahir",
  kelas: "kelas",
  rombel: "kelas",
  umur: "umur",
  "jenis kelamin": "jenis_kelamin",
  jenis_kelamin: "jenis_kelamin",
  alamat: "alamat",
  "no hp": "no_hp",
  no_hp: "no_hp",
  "no telepon": "no_hp",
  "no kip": "no_kip",
  no_kip: "no_kip",
  "nama ayah": "nama_ayah_kandung",
  "nama ayah kandung": "nama_ayah_kandung",
  nama_ayah_kandung: "nama_ayah_kandung",
  "nama ibu": "nama_ibu_kandung",
  "nama ibu kandung": "nama_ibu_kandung",
  nama_ibu_kandung: "nama_ibu_kandung",
  "nama wali": "nama_wali",
  nama_wali: "nama_wali",
  status: "status",
  "tahun lulus": "thn_lulus",
  thn_lulus: "thn_lulus",
  "thn lulus": "thn_lulus",
  "melanjutkan ke": "menjutkan_ke",
  menjutkan_ke: "menjutkan_ke",
  "studi lanjut": "menjutkan_ke",
  "jenis mutasi": "jenis_mutasi",
  jenis_mutasi: "jenis_mutasi",
  "sekolah tujuan": "sekolah_tujuan",
  sekolah_tujuan: "sekolah_tujuan",
  "tanggal mutasi": "tanggal_mutasi",
  tanggal_mutasi: "tanggal_mutasi",
  keterangan: "keterangan",
};

// Function to resolve classes dynamically
const resolveClass = (rawClass) => {
  if (!rawClass) return { id: "", display: "-" };
  const str = String(rawClass).trim().toLowerCase();

  const match = props.dataKelas.find(
    (k) =>
      String(k.id_kelas).toLowerCase() === str ||
      String(k.nama_kelas).toLowerCase() === str
  );

  if (match) {
    return { id: match.id_kelas, display: match.nama_kelas };
  }
  return { id: rawClass, display: rawClass }; // Fallback to raw value
};

// Handle File Processing
const processFile = (file) => {
  if (!file) return;
  isParsing.value = true;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("File Excel kosong atau tidak memiliki data.");
        isParsing.value = false;
        return;
      }

      const rows = jsonData.map((rawRow) => {
        const student = {};
        
        // Match headers to keys
        Object.entries(rawRow).forEach(([key, val]) => {
          const cleanKey = String(key).trim().toLowerCase();
          const mappedKey = fieldMapping[cleanKey];
          if (mappedKey) {
            student[mappedKey] = val !== undefined && val !== null ? String(val).trim() : "";
          }
        });

        // Resolve Class Name (only for data_siswa)
        if (props.targetTable !== "alumni") {
          const resolved = resolveClass(student.kelas);
          student.kelas = resolved.id;
          student._displayClass = resolved.display;
        } else {
          delete student.kelas;
        }

        // Validation & mode selection
        const nisLokal = student.nis_lokal;
        if (!nisLokal) {
          student._mode = "error";
          student._errorMsg = "NIS Lokal kosong (wajib)";
        } else {
          // Check if exist in database
          const existing = props.dataSiswa.find(
            (s) => String(s.nis_lokal) === String(nisLokal)
          );
          if (existing) {
            student._id = existing.id || existing._id;
            student._mode = "update";
            student._errorMsg = `Update data ${props.targetTable === 'alumni' ? 'alumni' : 'siswa'}: ${existing.nama}`;
          } else {
            student._mode = "create";
            student._errorMsg = `${props.targetTable === 'alumni' ? 'Alumni' : 'Siswa'} Baru`;
          }
        }

        return student;
      });

      parsedRows.value = rows;
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

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  processFile(file);
};

const handleFileDrop = (e) => {
  const file = e.dataTransfer.files[0];
  processFile(file);
};

// Batch Process Upload
const processUpload = async () => {
  const rowsToUpload = parsedRows.value.filter(
    (r) => r._mode === "create" || r._mode === "update"
  );
  if (rowsToUpload.length === 0) return;

  isUploading.value = true;
  uploadIndex.value = 0;
  totalToUpload.value = rowsToUpload.length;

  try {
    for (let i = 0; i < rowsToUpload.length; i++) {
      const student = rowsToUpload[i];
      const payload = { ...student };
      
      // Clean up internal keys before sending to API
      delete payload._id;
      delete payload._mode;
      delete payload._displayClass;
      delete payload._errorMsg;
      if (props.targetTable === "alumni") {
        delete payload.kelas;
        delete payload.umur;
      }

      if (student._mode === "create") {
        await postToApi(props.targetTable, payload);
      } else if (student._mode === "update") {
        await putToApi(props.targetTable, student._id, payload);
      }

      uploadIndex.value = i + 1;
    }

    alert(`Upload berhasil! ${rowsToUpload.length} data ${props.targetTable === 'alumni' ? 'alumni' : 'siswa'} diproses.`);
    emit("success");
    closeModal();
  } catch (err) {
    console.error(err);
    alert(`Terjadi kesalahan saat upload di baris ke-${uploadIndex.value + 1}: ${err.message}`);
  } finally {
    isUploading.value = false;
  }
};

// Template Generator
const downloadTemplate = () => {
  if (props.targetTable === "alumni") {
    const headers = [
      "Nama",
      "NISN",
      "NIS Lokal",
      "NIK",
      "No KK",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Status",
      "Tahun Lulus",
      "Melanjutkan Ke",
      "Alamat",
      "No HP",
      "No KIP",
      "Nama Ayah Kandung",
      "Nama Ibu Kandung",
      "Nama Wali",
    ];

    const sampleData = [
      {
        "Nama": "Budi Santoso",
        "NISN": "3115568599",
        "NIS Lokal": "111252030083170799",
        "NIK": "5203042206110099",
        "No KK": "5203042206110001",
        "Tempat Lahir": "Mataram",
        "Tanggal Lahir": "2011-01-12",
        "Jenis Kelamin": "Laki-laki",
        "Status": "Lulus",
        "Tahun Lulus": "2023",
        "Melanjutkan Ke": "SMP N 1 Mataram",
        "Alamat": "Jl. Pendidikan No. 12",
        "No HP": "081234567890",
        "No KIP": "KIP12345",
        "Nama Ayah Kandung": "Ahmad Santoso",
        "Nama Ibu Kandung": "Siti Aminah",
        "Nama Wali": "",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Template Upload Alumni");
    XLSX.writeFile(wb, "Template_Upload_Alumni.xlsx");
    return;
  }

  if (props.targetTable === "mutasi_siswa") {
    const headers = [
      "Nama",
      "NISN",
      "NIS Lokal",
      "NIK",
      "No KK",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Kelas",
      "Jenis Kelamin",
      "Jenis Mutasi",
      "Sekolah Tujuan",
      "Tanggal Mutasi",
      "Keterangan",
      "Alamat",
      "No HP",
      "No KIP",
      "Nama Ayah Kandung",
      "Nama Ibu Kandung",
      "Nama Wali",
    ];

    const sampleData = [
      {
        "Nama": "Budi Santoso",
        "NISN": "3115568599",
        "NIS Lokal": "111252030083170799",
        "NIK": "5203042206110099",
        "No KK": "5203042206110001",
        "Tempat Lahir": "Mataram",
        "Tanggal Lahir": "2011-01-12",
        "Kelas": "Kelas VI A",
        "Jenis Kelamin": "Laki-laki",
        "Jenis Mutasi": "Pindah Keluar",
        "Sekolah Tujuan": "SMP N 1 Mataram",
        "Tanggal Mutasi": "2024-06-20",
        "Keterangan": "Ikut Orang Tua",
        "Alamat": "Jl. Pendidikan No. 12",
        "No HP": "081234567890",
        "No KIP": "KIP12345",
        "Nama Ayah Kandung": "Ahmad Santoso",
        "Nama Ibu Kandung": "Siti Aminah",
        "Nama Wali": "",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Template Upload Mutasi");
    XLSX.writeFile(wb, "Template_Upload_Mutasi.xlsx");
    return;
  }

  const headers = [
    "Nama",
    "NISN",
    "NIS Lokal",
    "NIK",
    "No KK",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Kelas",
    "Jenis Kelamin",
    "Alamat",
    "No HP",
    "No KIP",
    "Nama Ayah Kandung",
    "Nama Ibu Kandung",
    "Nama Wali",
  ];

  const sampleData = [
    {
      "Nama": "Budi Santoso",
      "NISN": "3115568599",
      "NIS Lokal": "111252030083170799",
      "NIK": "5203042206110099",
      "No KK": "5203042206110001",
      "Tempat Lahir": "Mataram",
      "Tanggal Lahir": "2011-01-12",
      "Kelas": "Kelas I A",
      "Jenis Kelamin": "Laki-Laki",
      "Alamat": "Jl. Pendidikan No. 12",
      "No HP": "081234567890",
      "No KIP": "KIP12345",
      "Nama Ayah Kandung": "Ahmad Santoso",
      "Nama Ibu Kandung": "Siti Aminah",
      "Nama Wali": "",
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Column Widths
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Template Upload Siswa");
  XLSX.writeFile(wb, "Template_Upload_Siswa.xlsx");
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
