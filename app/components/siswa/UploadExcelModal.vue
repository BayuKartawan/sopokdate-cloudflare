<template>
  <BaseExcelUploadModal
    :show="show"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    :is-parsing="isParsing"
    :is-uploading="isUploading"
    :upload-progress="uploadProgress"
    :upload-index="uploadIndex"
    :total-to-upload="totalToUpload"
    :has-parsed-data="parsedRows.length > 0"
    :total-rows="parsedRows.length"
    :summary="summary"
    :summary-labels="summaryLabels"
    :warning-text="warningText"
    submit-button-text="Proses Upload"
    submit-icon="play"
    :submit-disabled="summary.newCount === 0 && summary.updateCount === 0"
    @close="closeModal"
    @download-template="downloadTemplate"
    @file-selected="processFile"
    @reset="resetState"
    @submit="processUpload"
  >
    <template #table-header>
      <tr>
        <th class="p-3 font-semibold">No</th>
        <th class="p-3 font-semibold">Nama</th>
        <th class="p-3 font-semibold">NIS Lokal</th>
        <th class="p-3 font-semibold">{{ targetTable === 'alumni' ? 'Tahun Lulus' : 'Kelas' }}</th>
        <th class="p-3 font-semibold">JK</th>
        <th class="p-3 font-semibold">Status Aksi</th>
        <th class="p-3 font-semibold text-right">Detail</th>
      </tr>
    </template>

    <template #table-body>
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
    </template>
  </BaseExcelUploadModal>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from "vue";
import * as XLSX from "xlsx";
import { postToApi, putToApi } from "~/utils/api";
import BaseExcelUploadModal from "~/components/ui/BaseExcelUploadModal.vue";

interface KelasItem {
  id_kelas: string | number;
  nama_kelas: string;
  [key: string]: any;
}

interface ParsedStudentRow {
  nama?: string;
  nis_lokal?: string;
  kelas?: string | number;
  _displayClass?: string;
  jenis_kelamin?: string;
  thn_lulus?: string;
  _mode?: "create" | "update" | "error";
  _errorMsg?: string;
  _id?: string | number;
  [key: string]: any;
}

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  dataSiswa: {
    type: Array as PropType<Record<string, any>[]>,
    required: true,
    default: () => [],
  },
  dataKelas: {
    type: Array as PropType<KelasItem[]>,
    default: () => [],
  },
  targetTable: {
    type: String,
    default: "data_siswa",
  },
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const parsedRows = ref<ParsedStudentRow[]>([]);
const isParsing = ref(false);
const isUploading = ref(false);
const uploadIndex = ref(0);
const totalToUpload = ref(0);

const modalTitle = computed(() => {
  if (props.targetTable === "alumni") return "Upload Banyak Alumni";
  if (props.targetTable === "mutasi_siswa") return "Upload Banyak Siswa Mutasi";
  return "Upload Banyak Siswa";
});

const modalSubtitle = computed(() => {
  if (props.targetTable === "alumni") return "Import data alumni menggunakan template Excel";
  if (props.targetTable === "mutasi_siswa") return "Import data mutasi siswa menggunakan template Excel";
  return "Import data siswa menggunakan template Excel";
});

const summaryLabels = computed(() => ({
  newLabel: props.targetTable === "alumni" ? "Alumni Baru (Insert)" : "Siswa Baru (Insert)",
  updateLabel: "Update Data (NIS Sama)",
  errorLabel: "Ditolak / Error",
}));

const warningText = computed(() => {
  if (summary.value.updateCount === 0) return "";
  const labelText = props.targetTable === "alumni" ? "alumni" : "siswa";
  return `Info Integrasi: Terdapat ${summary.value.updateCount} ${labelText} dengan NIS Lokal yang sama dengan data di database. Baris data ini tidak akan terduplikat, namun data lamanya di database akan diperbarui dengan data baru dari Excel.`;
});

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

const resetState = () => {
  parsedRows.value = [];
  isParsing.value = false;
  isUploading.value = false;
  uploadIndex.value = 0;
  totalToUpload.value = 0;
};

const closeModal = () => {
  if (!isUploading.value) {
    resetState();
    emit("close");
  }
};

// Map common headers to DB keys
const fieldMapping: Record<string, string> = {
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
  "nik wali": "nik_wali",
  nik_wali: "nik_wali",
  status: "status",
  "tahun lulus": "thn_lulus",
  thn_lulus: "thn_lulus",
  "thn lulus": "thn_lulus",
  "melanjutkan ke": "menjutkan_ke",
  menjutkan_ke: "menjutkan_ke",
  "studi lanjut": "menjutkan_ke",
  "tingkat kelas": "kelas",
  "tahun ajaran mutasi": "tahun_ajaran",
  "tahun ajaran": "tahun_ajaran",
  tahun_ajaran: "tahun_ajaran",
  "jenis mutasi": "jenis_mutasi",
  jenis_mutasi: "jenis_mutasi",
  "sekolah tujuan": "sekolah_tujuan",
  sekolah_tujuan: "sekolah_tujuan",
  "tanggal mutasi": "tanggal_mutasi",
  tanggal_mutasi: "tanggal_mutasi",
  keterangan: "keterangan",
};

// Function to resolve classes dynamically
const resolveClass = (rawClass: any): { id: string | number; display: string } => {
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
  return { id: rawClass, display: String(rawClass) }; // Fallback to raw value
};

// Handle File Processing
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
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      if (jsonData.length === 0) {
        alert("File Excel kosong atau tidak memiliki data.");
        isParsing.value = false;
        return;
      }

      const rows: ParsedStudentRow[] = jsonData.map((rawRow) => {
        const student: ParsedStudentRow = {};
        
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
      const payload: Record<string, any> = { ...student };
      
      // Clean up internal keys before sending to API
      delete payload._id;
      delete payload._mode;
      delete payload._displayClass;
      delete payload._errorMsg;
      if (props.targetTable === "alumni" || props.targetTable === "mutasi_siswa") {
        delete payload.umur;
      }
      if (props.targetTable === "alumni") {
        delete payload.kelas;
      }

      if (student._mode === "create") {
        await postToApi(props.targetTable, payload);
      } else if (student._mode === "update" && student._id) {
        await putToApi(props.targetTable, student._id, payload);
      }

      uploadIndex.value = i + 1;
    }

    alert(`Upload berhasil! ${rowsToUpload.length} data ${props.targetTable === 'alumni' ? 'alumni' : props.targetTable === 'mutasi_siswa' ? 'mutasi' : 'siswa'} diproses.`);
    emit("success");
    closeModal();
  } catch (err: any) {
    console.error(err);
    alert(`Terjadi kesalahan saat upload di baris ke-${uploadIndex.value + 1}: ${err?.message || err}`);
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
      "NIK Wali",
    ];

    const sampleData: Record<string, any>[] = [
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
        "NIK Wali": "",
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
      "Tingkat Kelas",
      "Tahun Ajaran Mutasi",
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
      "NIK Wali",
    ];

    const sampleData: Record<string, any>[] = [
      {
        "Nama": "Budi Santoso",
        "NISN": "3115568599",
        "NIS Lokal": "111252030083170799",
        "NIK": "5203042206110099",
        "No KK": "5203042206110001",
        "Tempat Lahir": "Mataram",
        "Tanggal Lahir": "2011-01-12",
        "Tingkat Kelas": "6",
        "Tahun Ajaran Mutasi": "2025/2026",
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
        "NIK Wali": "",
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
    "NIK Wali",
  ];

  const sampleData: Record<string, any>[] = [
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
      "NIK Wali": "",
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
