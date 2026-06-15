import { ref } from "vue";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generateDocx, generateDocxAsBlob } from "~/utils/generateDocx";

const monthToRoman = (month) => {
  const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romanNumerals[month - 1] || "I";
};

const formatNoSurat = (number) => {
  if (!number || String(number).trim() === "") return "";

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const romanMonth = monthToRoman(month);

  const numStr = String(number).replace(/[^0-9]/g, "");
  const paddedNumber = numStr.padStart(3, "0");

  return `${paddedNumber}/MI-B/087/${romanMonth}/${year}`;
};

const formatTime = (timeValue) => {
  if (!timeValue || String(timeValue).trim() === "") return "";
  const timeStr = String(timeValue);
  if (timeStr.includes(".")) return timeStr;
  return timeStr.replace(":", ".");
};

const formatRowData = (rowData, fields) => {
  const formattedData = { ...rowData };

  fields.forEach((field) => {
    const value = rowData[field.key];

    if (value === undefined || value === null || String(value).trim() === "") {
      return;
    }

    switch (field.type) {
      case "time":
        formattedData[field.key] = formatTime(value);
        break;

      case "no-surat":
        formattedData[field.key] = formatNoSurat(value);
        break;

      default:
        formattedData[field.key] = String(value).trim();
        break;
    }
  });

  return formattedData;
};

function resolveTemplatePath(rawPath) {
  if (!rawPath) return "";
  const p = String(rawPath).trim();
  if (/^https?:\/\//i.test(p)) return p;

  let normalized = p.replace(/^[./\\]+/, "");
  if (normalized.toLowerCase().startsWith("public/")) {
    normalized = normalized.slice(7);
  }

  if (!normalized.startsWith("/")) normalized = `/${normalized}`;

  return encodeURI(normalized);
}

export function useBulkDocumentGenerator() {
  const isGenerating = ref(false);
  const generationProgress = ref(0);
  const generationStatus = ref("");
  const generationComplete = ref(false);
  const generatedCount = ref(0);

  const startGeneration = async (selectedSurat, suratData, excelData) => {
    if (!selectedSurat || excelData.length === 0) return;

    isGenerating.value = true;
    generationProgress.value = 0;
    generationStatus.value = "Mempersiapkan generation...";
    generatedCount.value = 0;

    try {
      const suratConfig = suratData[selectedSurat];
      if (!suratConfig) {
        throw new Error("Konfigurasi surat tidak ditemukan: " + selectedSurat);
      }

      const fields = suratConfig.placeholder || [];
      const rawTemplate = suratConfig.templatePath;
      const templatePath = resolveTemplatePath(rawTemplate);

      if (!templatePath) {
        throw new Error(
          "Template path tidak ditemukan untuk surat: " + selectedSurat,
        );
      }

      const totalFiles = excelData.length;

      if (totalFiles === 1) {
        generationStatus.value = "Generating dokumen...";
        const formData = formatRowData(excelData[0], fields);
        const outputName = `${selectedSurat}_${formData.nama_lengkap || "Document"}`;

        await generateDocx(templatePath, formData, outputName);

        generationProgress.value = 100;
        generatedCount.value = 1;
        generationStatus.value = "Selesai!";
      } else {
        generationStatus.value = "Generating multiple dokumen...";
        const zip = new JSZip();

        for (let i = 0; i < totalFiles; i++) {
          const progress = ((i + 1) / totalFiles) * 100;

          generationProgress.value = progress;
          generationStatus.value = `Generating dokumen ${i + 1} dari ${totalFiles}...`;

          try {
            const formData = formatRowData(excelData[i], fields);
            const docBlob = await generateDocxAsBlob(templatePath, formData);

            const fileName = `${selectedSurat}_${formData.nama_lengkap || `Document_${i + 1}`}.docx`;
            zip.file(fileName, docBlob);

            generatedCount.value = i + 1;

            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch {
            // Skip failed documents
          }
        }

        generationStatus.value = "Membuat file ZIP...";
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 6,
          },
        });
        const zipFileName = `${selectedSurat.replace(/\s+/g, "_")}_Bulk_${totalFiles}_dokumen.zip`;
        saveAs(zipBlob, zipFileName);

        generationProgress.value = 100;
        generationStatus.value = "Selesai!";
      }

      generationComplete.value = true;
    } catch (error) {
      throw new Error(
        "Terjadi kesalahan saat generate dokumen: " + error.message,
      );
    } finally {
      isGenerating.value = false;
    }
  };

  const resetGeneration = () => {
    isGenerating.value = false;
    generationProgress.value = 0;
    generationStatus.value = "";
    generationComplete.value = false;
    generatedCount.value = 0;
  };

  return {
    isGenerating,
    generationProgress,
    generationStatus,
    generationComplete,
    generatedCount,
    startGeneration,
    resetGeneration,
  };
}

export const useDocumentGenerator = useBulkDocumentGenerator;
