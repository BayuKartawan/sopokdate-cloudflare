/**
 * Menghitung Tahun Pelajaran dan Semester berdasarkan tanggal tertentu
 * Aturan:
 * - Tahun Pelajaran baru dimulai per 1 Juli (reset)
 * - Semester Ganjil: 1 Juli s.d 31 Desember
 * - Semester Genap: 1 Januari s.d 30 Juni
 * 
 * @param {Date|string} inputDate - Tanggal input (default: hari ini)
 * @returns {Object} { tahunPelajaran: "2025/2026", semester: "Ganjil" }
 */
export function dapatkanTahunDanSemester(inputDate = new Date()) {
  let date;
  if (typeof inputDate === "string") {
    // If input is YYYY-MM-DD, parse it as a local date to avoid timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      date = new Date(inputDate + "T00:00:00");
    } else {
      date = new Date(inputDate);
    }
  } else {
    date = inputDate;
  }
  
  // Periksa kevalidan tanggal
  if (isNaN(date.getTime())) {
    const today = new Date();
    return dapatkanTahunDanSemester(today);
  }

  const tahun = date.getFullYear();
  const bulan = date.getMonth() + 1; // 1-indexed (1-12)

  let tahunPelajaran = "";
  let semester = "";

  if (bulan >= 7 && bulan <= 12) {
    tahunPelajaran = `${tahun}/${tahun + 1}`;
    semester = "Ganjil";
  } else {
    tahunPelajaran = `${tahun - 1}/${tahun}`;
    semester = "Genap";
  }

  return { tahunPelajaran, semester };
}
