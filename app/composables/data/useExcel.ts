import { ref, computed } from "vue";
import * as XLSX from "xlsx";
import { useNotiflix } from "~/composables/ui/useFeedback";

interface ExcelField {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  [key: string]: any;
}

// ============================================================================
// EXCEL PROCESSOR (from useExcelProcessor.ts)
// ============================================================================
export function useExcelProcessor() {
  const uploadedFile = ref<File | null>(null);
  const excelData = ref<Record<string, any>[]>([]);
  const excelHeaders = ref<string[]>([]);
  const isDragOver = ref(false);

  const previewData = computed(() => {
    return excelData.value.slice(0, 5); // Show first 5 rows
  });

  // ========================================
  // FIELD TYPE HELPERS
  // ========================================

  const getExampleValue = (field: ExcelField): string => {
    const examples: Record<string, string> = {
      text: "Contoh Teks",
      number: "100",
      date: "2025-01-08",
      time: "09:00",
      email: "email@example.com",
      tel: "081234567890",
      select: field.options?.[0] || "Pilihan 1",
      gender: "Laki-laki",
      hari: "Senin",
      semester: "I ( GANJIL )",
      class: "I ( Satu )",
      month: "Januari",
      "no-surat": "001",
      "academic-year": "2024/2025",
      "year-range": "2025",
    };
    return examples[field.type || "text"] || "Contoh Data";
  };

  const getFieldDescription = (field: ExcelField): string => {
    const descriptions: Record<string, string> = {
      text: "Teks bebas",
      number: "Angka saja",
      date: "Format: YYYY-MM-DD (contoh: 2025-01-08)",
      time: "Format: HH:mm (contoh: 09:00)",
      email: "Format email valid (contoh: email@example.com)",
      tel: "Nomor telepon",
      select: `Pilihan: ${field.options?.join(", ") || "Sesuai opsi"}`,
      gender: "Pilihan: Laki-laki, Perempuan",
      hari: "Pilihan: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu",
      semester: "Pilihan: I ( GANJIL ), II ( GENAP )",
      class:
        "Pilihan: I ( Satu ), II ( Dua ), III ( Tiga ), IV ( Empat ), V ( Lima ), VI ( Enam )",
      month:
        "Pilihan: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember",
      "no-surat":
        "Format: 3 digit angka (001-999). Akan auto-format menjadi: 001/MI-B/087/VII/2025",
      "academic-year": "Format: YYYY/YYYY (contoh: 2024/2025)",
      "year-range": "Format: YYYY (contoh: 2025)",
    };
    return descriptions[field.type || "text"] || "Sesuai ketentuan";
  };

  const getValidationRule = (field: ExcelField): string => {
    const rules: Record<string, string> = {
      text: "Wajib diisi, teks tidak boleh kosong",
      number: "Wajib diisi, harus angka positif",
      date: "Wajib diisi, format tanggal YYYY-MM-DD",
      time: "Wajib diisi, format waktu HH:mm",
      email: "Wajib diisi, format email valid",
      tel: "Wajib diisi, nomor telepon valid",
      select: "Wajib diisi, pilih salah satu opsi",
      gender: "Wajib diisi, pilih: Laki-laki atau Perempuan",
      hari: "Wajib diisi, pilih salah satu hari",
      semester: "Wajib diisi, pilih semester",
      class: "Wajib diisi, pilih kelas",
      month: "Wajib diisi, pilih bulan",
      "no-surat": "Wajib diisi, 3 digit angka (001-999)",
      "academic-year": "Wajib diisi, format tahun ajaran",
      "year-range": "Wajib diisi, tahun dalam format YYYY",
    };
    return rules[field.type || "text"] || "Wajib diisi";
  };

  const getSelectOptions = (
    type: string,
    fieldOptions?: string[] | null,
  ): string[] | null => {
    const optionMap: Record<string, string[]> = {
      gender: ["Laki-laki", "Perempuan"],
      hari: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
      semester: ["I ( GANJIL )", "II ( GENAP )"],
      class: [
        "I ( Satu )",
        "II ( Dua )",
        "III ( Tiga )",
        "IV ( Empat )",
        "V ( Lima )",
        "VI ( Enam )",
      ],
      month: [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ],
    };

    return optionMap[type] || fieldOptions || null;
  };

  // ========================================
  // FILE PROCESSING
  // ========================================

  const processFile = (
    file: File,
  ): Promise<{ headers: string[]; data: Record<string, any>[] }> => {
    return new Promise((resolve, reject) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        reject(new Error("Please select a valid Excel file (.xlsx or .xls)"));
        return;
      }

      uploadedFile.value = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
            header: 1,
            defval: "",
          });

          if (jsonData.length < 2) {
            reject(
              new Error(
                "File Excel harus memiliki minimal 2 baris (header + data)",
              ),
            );
            return;
          }

          const headers = (jsonData[0] as any[])
            .filter((header) => header && String(header).trim())
            .map((header) => String(header));

          const dataRows = (jsonData.slice(1) as any[][]).filter((row) =>
            row.some(
              (cell) =>
                cell !== undefined &&
                cell !== null &&
                String(cell).trim() !== "",
            ),
          );

          excelHeaders.value = headers;
          excelData.value = dataRows.map((row) => {
            const rowObj: Record<string, any> = {};
            headers.forEach((header, index) => {
              rowObj[header] =
                row[index] !== undefined && row[index] !== null
                  ? row[index]
                  : "";
            });
            return rowObj;
          });

          resolve({
            headers: excelHeaders.value,
            data: excelData.value,
          });
        } catch {
          reject(
            new Error("Error membaca file Excel. Pastikan format file benar."),
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const removeFile = (): void => {
    uploadedFile.value = null;
    excelData.value = [];
    excelHeaders.value = [];
  };

  // ========================================
  // TEMPLATE GENERATION
  // ========================================

  const downloadTemplate = (
    selectedSurat: string,
    suratData: Record<string, any>,
  ): void => {
    if (!selectedSurat || !suratData[selectedSurat]) {
      alert("Pilih jenis surat terlebih dahulu!");
      return;
    }

    const config = suratData[selectedSurat];
    const fields: ExcelField[] = config.placeholder || [];

    if (fields.length === 0) {
      alert("Tidak ada field untuk surat ini!");
      return;
    }

    const wb = XLSX.utils.book_new();

    // SHEET 1: Data
    const headers = fields.map((field) => field.key);
    const exampleRow = fields.map((field) => getExampleValue(field));
    const exampleRow2 = fields.map((field) => getExampleValue(field));
    const exampleRow3 = fields.map((field) => getExampleValue(field));

    const wsData = [headers, exampleRow, exampleRow2, exampleRow3];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = headers.map(() => ({ wch: 20 }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Data");

    // SHEET 2: Panduan
    const guideData: any[][] = [
      ["PANDUAN PENGGUNAAN TEMPLATE EXCEL"],
      [""],
      ["Jenis Surat:", selectedSurat],
      ["Jumlah Field:", fields.length],
      [""],
      ["INFORMASI PENTING:"],
      ['1. Jangan ubah nama kolom (header) di sheet "Data"'],
      ["2. Hapus baris contoh dan isi dengan data Anda"],
      ["3. Pastikan semua field wajib terisi"],
      ["4. Perhatikan format dan validasi setiap field"],
      ["5. Gunakan sheet ini sebagai referensi"],
      [""],
      ["DETAIL FIELD:"],
      [""],
      ["No", "Nama Field", "Key", "Tipe", "Deskripsi", "Contoh", "Validasi"],
    ];

    fields.forEach((field, index) => {
      guideData.push([
        index + 1,
        field.label,
        field.key,
        field.type || "text",
        getFieldDescription(field),
        getExampleValue(field),
        getValidationRule(field),
      ]);
    });

    guideData.push([""]);
    guideData.push(["CATATAN KHUSUS:"]);
    guideData.push([""]);

    if (fields.some((f) => f.type === "time")) {
      guideData.push(["⏰ FIELD TIME (WAKTU):"]);
      guideData.push(["  - Input format: HH:mm (contoh: 09:00, 13:30)"]);
      guideData.push(["  - Output otomatis: HH.mm (contoh: 09.00, 13.30)"]);
      guideData.push([""]);
    }

    if (fields.some((f) => f.type === "no-surat")) {
      guideData.push(["📝 FIELD NO-SURAT:"]);
      guideData.push(["  - Input: 3 digit angka (001-999)"]);
      guideData.push(["  - Output otomatis: 001/MI-B/087/VII/2025"]);
      guideData.push(["  - Bulan dan tahun otomatis dari sistem"]);
      guideData.push([""]);
    }

    if (fields.some((f) => f.type === "academic-year")) {
      guideData.push(["📅 FIELD ACADEMIC-YEAR (TAHUN AJARAN):"]);
      guideData.push(["  - Format: YYYY/YYYY"]);
      guideData.push(["  - Contoh: 2024/2025, 2025/2026"]);
      guideData.push([""]);
    }

    const selectFields = fields.filter(
      (f) =>
        f.type === "select" ||
        f.type === "gender" ||
        f.type === "hari" ||
        f.type === "semester" ||
        f.type === "class" ||
        f.type === "month",
    );
    if (selectFields.length > 0) {
      guideData.push(["📋 FIELD PILIHAN (SELECT):"]);
      guideData.push(["  - Isi dengan salah satu opsi yang tersedia"]);
      guideData.push(["  - Perhatikan penulisan (case sensitive)"]);
      guideData.push(['  - Lihat kolom "Deskripsi" untuk opsi lengkap']);
      guideData.push([""]);
    }

    const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
    wsGuide["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 50 },
      { wch: 25 },
      { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan");

    // SHEET 3: Opsi Pilihan
    const optionsData: any[][] = [
      ["DAFTAR OPSI UNTUK FIELD PILIHAN"],
      [""],
      ["Field", "Opsi yang Tersedia"],
    ];

    const selectFieldTypes: Record<string, string[]> = {
      gender: ["Laki-laki", "Perempuan"],
      hari: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
      semester: ["I ( GANJIL )", "II ( GENAP )"],
      class: [
        "I ( Satu )",
        "II ( Dua )",
        "III ( Tiga )",
        "IV ( Empat )",
        "V ( Lima )",
        "VI ( Enam )",
      ],
      month: [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ],
    };

    fields.forEach((field) => {
      if (field.type && selectFieldTypes[field.type]) {
        optionsData.push([""]);
        optionsData.push([`${field.label} (${field.key}):`]);
        selectFieldTypes[field.type].forEach((option) => {
          optionsData.push(["", option]);
        });
      } else if (field.type === "select" && field.options) {
        optionsData.push([""]);
        optionsData.push([`${field.label} (${field.key}):`]);
        field.options.forEach((option) => {
          optionsData.push(["", option]);
        });
      }
    });

    if (fields.some((f) => f.type === "academic-year")) {
      optionsData.push([""]);
      optionsData.push(["Tahun Ajaran (academic-year):"]);
      const currentYear = new Date().getFullYear();
      for (let i = -2; i <= 3; i++) {
        const year1 = currentYear + i;
        const year2 = year1 + 1;
        optionsData.push(["", `${year1}/${year2}`]);
      }
    }

    if (fields.some((f) => f.type === "year-range")) {
      optionsData.push([""]);
      optionsData.push(["Tahun (year-range):"]);
      const currentYear = new Date().getFullYear();
      for (let i = -2; i <= 3; i++) {
        optionsData.push(["", `${currentYear + i}`]);
      }
    }

    const wsOptions = XLSX.utils.aoa_to_sheet(optionsData);
    wsOptions["!cols"] = [{ wch: 30 }, { wch: 40 }];

    XLSX.utils.book_append_sheet(wb, wsOptions, "Opsi Pilihan");

    const fileName = `Template_${selectedSurat.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ========================================
  // VALIDATION
  // ========================================

  const getValidationErrors = (
    selectedSurat: string,
    suratData: Record<string, any>,
  ): string[] => {
    const errors: string[] = [];

    if (!selectedSurat || !suratData[selectedSurat]) {
      return errors;
    }

    if (excelData.value.length === 0) {
      return errors;
    }

    const config = suratData[selectedSurat];
    const requiredFields: ExcelField[] = config.placeholder || [];
    const requiredKeys = requiredFields.map((f) => f.key);

    const missingFields = requiredKeys.filter(
      (key) => !excelHeaders.value.includes(key),
    );
    if (missingFields.length > 0) {
      errors.push(`Field yang hilang: ${missingFields.join(", ")}`);
    }

    const extraFields = excelHeaders.value.filter(
      (header) => !requiredKeys.includes(header),
    );
    if (extraFields.length > 0) {
      errors.push(`Field tambahan (akan diabaikan): ${extraFields.join(", ")}`);
    }

    excelData.value.forEach((row, index) => {
      requiredFields.forEach((field) => {
        const value = row[field.key];

        if (value === undefined || value === null || value === "") {
          errors.push(
            `Baris ${index + 2}: Field "${field.label}" (${field.key}) kosong`,
          );
          return;
        }

        switch (field.type) {
          case "number":
            if (isNaN(value as any) || Number(value) <= 0) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" harus berisi angka positif`,
              );
            }
            break;

          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" bukan email yang valid`,
              );
            }
            break;

          case "date":
            if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" harus format YYYY-MM-DD`,
              );
            }
            break;

          case "time":
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(String(value))) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" harus format HH:mm`,
              );
            }
            break;

          case "no-surat":
            if (!/^\d{1,3}$/.test(String(value))) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" harus 3 digit angka (001-999)`,
              );
            }
            break;

          case "academic-year":
            if (!/^\d{4}\/\d{4}$/.test(String(value))) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" harus format YYYY/YYYY`,
              );
            }
            break;

          case "year-range":
            if (!/^\d{4}$/.test(String(value))) {
              errors.push(
                `Baris ${index + 2}: "${field.label}" harus format YYYY`,
              );
            }
            break;

          case "select":
          case "gender":
          case "hari":
          case "semester":
          case "class":
          case "month": {
            if (field.type) {
              const allowedOptions = getSelectOptions(
                field.type,
                field.options,
              );
              if (allowedOptions && !allowedOptions.includes(String(value))) {
                errors.push(
                  `Baris ${index + 2}: "${field.label}" nilai "${value}" tidak valid. Pilihan: ${allowedOptions.join(", ")}`,
                );
              }
            }
            break;
          }
        }
      });
    });

    return errors;
  };

  const isValidField = (
    header: string,
    selectedSurat: string,
    suratData: Record<string, any>,
  ): boolean => {
    if (!selectedSurat || !suratData[selectedSurat]) return false;
    const requiredFields = (
      suratData[selectedSurat].placeholder as ExcelField[]
    ).map((p) => p.key);
    return requiredFields.includes(header);
  };

  // ========================================
  // UTILITIES
  // ========================================

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrop = async (e: DragEvent): Promise<void> => {
    e.preventDefault();
    isDragOver.value = false;

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: any): Promise<void> => {
    if (e.target && e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files as FileList);
      await processFile(files[0]);
    }
  };

  return {
    uploadedFile,
    excelData,
    excelHeaders,
    isDragOver,
    previewData,
    processFile,
    removeFile,
    downloadTemplate,
    getValidationErrors,
    isValidField,
    formatFileSize,
    handleDrop,
    handleFileSelect,
  };
}

// ============================================================================
// EXPORT EXCEL TO CSV (from useExportExcel.ts)
// ============================================================================
export function useExportExcel() {
  const { Notify } = useNotiflix();

  const exportToCSV = (
    data: any[],
    headers: string[],
    fileName: string = "export_data",
  ): void => {
    if (!data || data.length === 0) {
      Notify?.warning?.("Tidak ada data untuk diekspor");
      return;
    }

    try {
      const csvRows: string[] = [];
      csvRows.push(headers.join(","));

      data.forEach((item) => {
        const values = Object.values(item).map((value) => {
          const escaped = ("" + value).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      });

      const csvString = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Notify?.success?.("File berhasil diunduh");
      }
    } catch {
      Notify?.failure?.("Gagal mengekspor data");
    }
  };

  return {
    exportToCSV,
  };
}
