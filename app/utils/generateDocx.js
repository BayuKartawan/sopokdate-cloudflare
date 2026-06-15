// src\utils\generateDocx.js
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// Cache untuk menyimpan template yang sudah di-fetch
const templateCache = new Map();

// Fungsi untuk fetch dan cache template
async function getTemplateFromCache(templatePath) {
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath);
  }
  const response = await fetch(templatePath);
  if (!response.ok) throw new Error("Gagal memuat template DOCX");

  const arrayBuffer = await response.arrayBuffer();
  templateCache.set(templatePath, arrayBuffer);
  return arrayBuffer;
}

export async function generateDocx(templatePath, formData, outputName) {
  try {
    // Gunakan template dari cache atau fetch baru
    const arrayBuffer = await getTemplateFromCache(templatePath);

    // Inisialisasi PizZip dengan kompresi optimal
    const zip = new PizZip(arrayBuffer);

    // Inisialisasi Docxtemplater dengan pengaturan optimal
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Nonaktifkan parser yang tidak diperlukan untuk mengurangi overhead
      parser: (tag) => ({ get: tag === "." ? (s) => s : (s) => s[tag] }),
      nullGetter: () => "", // Handle null values dengan string kosong
    });

    // Bersihkan formData dari nilai yang tidak diperlukan
    const cleanedFormData = cleanFormData(formData);

    // Render template dengan data yang sudah dibersihkan
    doc.render(cleanedFormData);

    // Generate blob dengan kompresi optimal
    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE", // Gunakan kompresi DEFLATE untuk ukuran optimal
      compressionOptions: {
        level: 6, // Level kompresi sedang (balance antara speed dan size)
      },
    });

    // Simpan file
    saveAs(blob, `${outputName}.docx`);

    // NOTE: intentionally not logging generated sizes in production
  } catch (error) {
    throw new Error(`Gagal generate DOCX: ${error.message}`);
  }
}

/**
 * Generate DOCX dan return sebagai blob (untuk bulk generation)
 * Menggunakan semua optimasi yang sama dengan generateDocx
 */
export async function generateDocxAsBlob(templatePath, formData) {
  try {
    // Gunakan template dari cache atau fetch baru
    const arrayBuffer = await getTemplateFromCache(templatePath);

    // Inisialisasi PizZip dengan kompresi optimal
    const zip = new PizZip(arrayBuffer);

    // Inisialisasi Docxtemplater dengan pengaturan optimal
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Nonaktifkan parser yang tidak diperlukan untuk mengurangi overhead
      parser: (tag) => ({ get: tag === "." ? (s) => s : (s) => s[tag] }),
      nullGetter: () => "", // Handle null values dengan string kosong
    });

    // Bersihkan formData dari nilai yang tidak diperlukan
    const cleanedFormData = cleanFormData(formData);

    // Render template dengan data yang sudah dibersihkan
    doc.render(cleanedFormData);

    // Generate blob dengan kompresi optimal
    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE", // Gunakan kompresi DEFLATE untuk ukuran optimal
      compressionOptions: {
        level: 6, // Level kompresi sedang (balance antara speed dan size)
      },
    });

    // NOTE: intentionally not logging generated sizes in production

    return blob;
  } catch (error) {
    throw new Error(`Gagal generate DOCX: ${error.message}`);
  }
}

/**
 * Membersihkan form data dari nilai yang tidak diperlukan
 * dan mengoptimalkan untuk template DOCX
 */
function cleanFormData(formData) {
  const cleaned = {};

  // Debug logs removed for production

  for (const [key, value] of Object.entries(formData)) {
    // processing key/value (silent in production)

    if (value === null || value === undefined) {
      cleaned[key] = ""; // Set string kosong untuk nilai null/undefined
      continue;
    }

    // Handle format tanggal - cek berbagai format
    if (typeof value === "string") {
      // Format dd/mm/yyyy
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        try {
          const parts = value.split("/");
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
          const year = parseInt(parts[2], 10);

          const dateObj = new Date(year, month, day);

          if (!isNaN(dateObj.getTime())) {
            const formatted = formatIndonesianDate(dateObj);
            // converted date for internal processing
            cleaned[key] = formatted;
          } else {
            // invalid date detected (handled)
            cleaned[key] = value;
          }
        } catch {
          cleaned[key] = value;
        }
      }
      // Format yyyy-mm-dd (ISO format)
      else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        try {
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            const formatted = formatIndonesianDate(dateObj);
            // converted ISO date for internal processing
            cleaned[key] = formatted;
          } else {
            // invalid ISO date detected (handled)
            cleaned[key] = value;
          }
        } catch {
          cleaned[key] = value;
        }
      }
      // Format yyyy-mm-ddThh:mm:ss (datetime format)
      else if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
        try {
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            const formatted = formatIndonesianDate(dateObj);
            // converted datetime for internal processing
            cleaned[key] = formatted;
          } else {
            // invalid datetime detected (handled)
            cleaned[key] = value;
          }
        } catch {
          cleaned[key] = value;
        }
      }
      // String biasa
      else {
        cleaned[key] = value.trim() || "";
      }
    } else if (typeof value === "boolean") {
      cleaned[key] = value ? "Ya" : "Tidak";
    } else if (Array.isArray(value)) {
      cleaned[key] = value.filter((item) => item != null).join(", ");
    } else {
      cleaned[key] = value;
    }
  }

  // Debug output removed for production
  return cleaned;
}

/**
 * Format tanggal ke format Indonesia
 */
function formatIndonesianDate(dateObj) {
  const months = [
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
  ];

  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Alternative function untuk generate dengan buffer optimization
 * Gunakan ini jika masih ada masalah ukuran file
 */
export async function generateDocxOptimized(
  templatePath,
  formData,
  outputName,
) {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) throw new Error("Gagal memuat template DOCX");

    const arrayBuffer = await response.arrayBuffer();

    // Buat copy dari array buffer untuk avoid corruption
    const templateBuffer = arrayBuffer.slice();

    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "{{",
        end: "}}",
      },
    });

    const cleanedFormData = cleanFormData(formData);
    doc.render(cleanedFormData);

    // Generate dengan pengaturan kompresi maksimal
    const generatedZip = doc.getZip();

    // Optimasi khusus untuk mengurangi ukuran
    const blob = generatedZip.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9, // Kompresi maksimal
      },
      streamFiles: true, // Optimasi untuk file besar
    });

    saveAs(blob, `${outputName}.docx`);

    // NOTE: intentionally not logging optimized sizes in production
  } catch (error) {
    throw new Error(`Gagal generate DOCX: ${error.message}`);
  }
}
