/**
 * Formats a date string (ISO, YYYY-MM-DD, etc.) into formal Indonesian format (e.g., "13 Juni 2026").
 * It is timezone-safe and locks to Asia/Makassar (WITA, UTC+8) timezone, which is the local timezone
 * for Penyenggir (Lombok, Central Indonesia).
 *
 * @param {string|Date} dateString - The date to format
 * @returns {string} The formatted Indonesian date or original string if parsing fails
 */
export function formatTanggalIndo(dateString: string | Date): string {
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

export function parseIndonesianDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  let s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s);
  }
  const monthsMap: Record<string, string> = {
    jan: "Jan", januari: "Jan",
    feb: "Feb", peb: "Feb", februari: "Feb", pebruari: "Feb",
    mar: "Mar", maret: "Mar",
    apr: "Apr", april: "Apr",
    mei: "May",
    jun: "Jun", juni: "Jun",
    jul: "Jul", juli: "Jul",
    agt: "Aug", agu: "Aug", agustus: "Aug",
    sep: "Sep", september: "Sep",
    okt: "Oct", oktober: "Oct",
    nov: "Nov", nop: "Nov", november: "Nov", nopember: "Nov",
    des: "Dec", desember: "Dec"
  };
  for (const [indo, eng] of Object.entries(monthsMap)) {
    const regex = new RegExp(`\\b${indo}\\b`, "i");
    if (regex.test(s)) {
      s = s.replace(regex, eng);
      break;
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function calculateAge(birthDateString: any): string {
  if (!birthDateString) return "-";
  if (typeof birthDateString === "string" && birthDateString.includes("Tahun")) {
    return birthDateString;
  }
  const birthDate = parseIndonesianDate(birthDateString);
  if (!birthDate) return "-";

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} Tahun, ${months} Bulan, ${days} Hari`;
}
