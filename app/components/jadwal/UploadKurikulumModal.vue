<template>
  <BaseExcelUploadModal
    :show="show"
    title="Upload Kurikulum Pelajaran"
    subtitle="Import alokasi jam mengajar menggunakan template Excel"
    download-description="Gunakan template Excel dinamis yang disesuaikan dengan tingkat kelas terdaftar saat ini. Isi alokasi JP per mata pelajaran."
    :is-parsing="isParsing"
    :has-parsed-data="parsedRows.length > 0"
    :total-rows="parsedRows.length"
    :summary="summary"
    :summary-labels="summaryLabels"
    :warning-text="warningText"
    submit-button-text="Terapkan ke Tabel"
    submit-icon="check"
    :submit-disabled="summary.newCount === 0 && summary.updateCount === 0"
    @close="closeModal"
    @download-template="downloadTemplate"
    @file-selected="processFile"
    @reset="resetState"
    @submit="applyImport"
  >
    <template #table-header>
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
    </template>

    <template #table-body>
      <tr v-for="(row, idx) in parsedRows" :key="idx" class="hover:bg-zinc-900/30">
        <td class="p-3 text-zinc-500">{{ idx + 1 }}</td>
        <td class="p-3 font-medium text-zinc-200">{{ row.nama_mapel || '-' }}</td>
        <td class="p-3 text-zinc-300 font-mono">{{ row.kode_mapel || '-' }}</td>
        <td v-for="t in tingkatList" :key="t" class="p-3 text-center text-zinc-400 font-bold">
          {{ row.hours[t]?.alokasi_jam || '-' }}
        </td>
        <td class="p-3 text-center">
          <span
            v-if="row._mode === 'create'"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          >
            Mapel Baru
          </span>
          <span
            v-else-if="row._mode === 'update'"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
          >
            Perbarui JP
          </span>
          <span
            v-else
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"
          >
            Error / Ditolak
          </span>
        </td>
        <td class="p-3 text-right text-zinc-500 text-[10px]">
          {{ row._errorMsg || 'Siap diterapkan' }}
        </td>
      </tr>
    </template>
  </BaseExcelUploadModal>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from "vue";
import * as XLSX from "xlsx";
import BaseExcelUploadModal from "~/components/ui/BaseExcelUploadModal.vue";

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

const emit = defineEmits<{
  (e: "close"): void;
  (e: "apply", rows: ParsedSubjectRow[]): void;
}>();

const parsedRows = ref<ParsedSubjectRow[]>([]);
const isParsing = ref(false);

const summaryLabels = {
  newLabel: "Mapel Baru (Tambah)",
  updateLabel: "Update JP (Mapel Sama)",
  errorLabel: "Ditolak / Error",
};

const warningText = computed(() => {
  if (summary.value.updateCount === 0) return "";
  return `Info Integrasi: Terdapat ${summary.value.updateCount} mata pelajaran yang sudah ada di database/tabel. Alokasi JP dan Kode Abreviasi pada mapel-mapel ini akan diperbarui sesuai file Excel yang Anda upload.`;
});

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
};

const closeModal = () => {
  if (!isParsing.value) {
    resetState();
    emit("close");
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
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

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
