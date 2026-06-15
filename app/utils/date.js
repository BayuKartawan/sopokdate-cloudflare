/**
 * Formats a date string (ISO, YYYY-MM-DD, etc.) into formal Indonesian format (e.g., "13 Juni 2026").
 * It is timezone-safe and locks to Asia/Makassar (WITA, UTC+8) timezone, which is the local timezone
 * for Penyenggir (Lombok, Central Indonesia).
 *
 * @param {string|Date} dateString - The date to format
 * @returns {string} The formatted Indonesian date or original string if parsing fails
 */
export function formatTanggalIndo(dateString) {
  if (!dateString) return "";

  const str = String(dateString).trim();

  // If already formatted in formal Indonesian format (e.g., contains "Juni", "Agustus"), return as-is
  const monthsPattern =
    /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i;
  if (monthsPattern.test(str)) {
    return str;
  }

  const date = new Date(str);
  if (isNaN(date.getTime())) {
    return str;
  }

  try {
    return date.toLocaleDateString("id-ID", {
      timeZone: "Asia/Makassar",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    // Fallback if timeZone option is not supported in the environment
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}
