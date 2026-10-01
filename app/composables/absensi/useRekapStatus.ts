import { ref, computed, watch, type Ref } from "vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch, fetchFromApi } from "~/utils/api";
import { exportStyledExcel } from "~/utils/excelExport";
import type { StatusRow } from "~/types/absensi";

export function useRekapStatus(dataKelas: Ref<any[]>) {
  const { Notify } = useNotiflix();

  const statusTapel = ref<string>("");
  const statusSemester = ref<string>("Ganjil");
  const isLoadingStatus = ref<boolean>(false);
  const isExportingStatus = ref<boolean>(false);
  const statusRawData = ref<any[]>([]);
  const dataGtk = ref<any[]>([]);
  const hariLiburKalender = ref<any[]>([]);
  const hariLiburMingguanIndex = ref<number>(0);

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const semesterDateRange = computed(() => {
    if (!statusTapel.value) return null;
    const parts = statusTapel.value.split("/");
    if (parts.length !== 2) return null;

    const tahunAwal = parseInt(parts[0]);
    const tahunAkhir = parseInt(parts[1]);

    let rangeStart: string, rangeEnd: string;
    if (statusSemester.value === "Ganjil") {
      rangeStart = `${tahunAwal}-07-01`;
      rangeEnd = `${tahunAwal}-12-31`;
    } else {
      rangeStart = `${tahunAkhir}-01-01`;
      rangeEnd = `${tahunAkhir}-06-30`;
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (rangeEnd > todayStr) {
      rangeEnd = todayStr;
    }

    if (rangeStart > rangeEnd) return null;

    return { start: rangeStart, end: rangeEnd };
  });

  const totalHariEfektifSemester = computed(() => {
    if (!semesterDateRange.value) return 0;

    const { start, end } = semesterDateRange.value;
    let count = 0;
    const current = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

      if (current.getDay() === hariLiburMingguanIndex.value) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const isHoliday = hariLiburKalender.value.some(
        (h: any) => dateStr >= h.tanggal_mulai && dateStr <= h.tanggal_selesai,
      );
      if (isHoliday) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  });

  const gtkNameMap = computed(() => {
    const map: Record<string, string> = {};
    dataGtk.value.forEach((g: any) => {
      const nama = toTitleCase(
        g.title || g.NamaLengkap || g["Nama Lengkap"] || g.nama_lengkap || "",
      );
      if (!nama) return;

      if (g.id != null) map[String(g.id).trim()] = nama;
      const pegId = g.PegID || g["Peg ID"] || g.peg_id;
      if (pegId) map[String(pegId).trim()] = nama;
      const nameLower = nama.toLowerCase();
      if (nameLower) map[nameLower] = nama;
    });
    return map;
  });

  const resolveWaliKelasName = (raw: string) => {
    if (!raw) return "";
    const trimmed = raw.trim();
    if (gtkNameMap.value[trimmed]) return gtkNameMap.value[trimmed];
    const lower = trimmed.toLowerCase();
    if (gtkNameMap.value[lower]) return gtkNameMap.value[lower];
    return toTitleCase(trimmed);
  };

  const statusTableData = computed<StatusRow[]>(() => {
    if (!dataKelas.value || dataKelas.value.length === 0) return [];

    const hariEfektif = totalHariEfektifSemester.value;

    const statusMap: Record<string, number> = {};
    statusRawData.value.forEach((item: any) => {
      statusMap[item.kelas_id] = item.total_hari_diabsen || 0;
    });

    return dataKelas.value.map((kelas: any) => {
      const kelasId = kelas.idKelas;
      const sudahDiabsen = statusMap[kelasId] || 0;
      const belumDiabsen = Math.max(0, hariEfektif - sudahDiabsen);
      const persentase = hariEfektif > 0 ? (sudahDiabsen / hariEfektif) * 100 : 0;

      return {
        kelas_id: kelasId,
        namaKelas: kelas.namaKelas || kelasId,
        waliKelas: resolveWaliKelasName(kelas.waliKelas || kelas["Wali Kelas"] || kelas.wali_kelas || ""),
        hariEfektif,
        sudahDiabsen,
        belumDiabsen,
        persentase,
      };
    });
  });

  const avgPersentaseStatus = computed(() => {
    if (statusTableData.value.length === 0) return "0.0";
    const total = statusTableData.value.reduce((sum, row) => sum + row.persentase, 0);
    return (total / statusTableData.value.length).toFixed(1);
  });

  const kelasRendahCount = computed(() => {
    return statusTableData.value.filter((row) => row.persentase < 75).length;
  });

  const statusPeriodeLabel = computed(() => {
    if (!semesterDateRange.value) return "-";
    return `${formatDateIndo(semesterDateRange.value.start)} s.d. ${formatDateIndo(semesterDateRange.value.end)}`;
  });

  // In-memory cache untuk status, kalender, dan config tapel
  const statusCache = new Map<string, any[]>();
  const kalenderCache = new Map<string, any[]>();
  const configCache = new Map<string, any[]>();

  const fetchStatusData = async (force: boolean = false) => {
    if (!statusTapel.value || !statusSemester.value) return;

    const cacheKey = `${statusTapel.value}_${statusSemester.value}`;
    if (!force && statusCache.has(cacheKey)) {
      statusRawData.value = statusCache.get(cacheKey)!;
      if (kalenderCache.has(statusTapel.value)) {
        hariLiburKalender.value = kalenderCache.get(statusTapel.value)!;
      }
      return;
    }

    isLoadingStatus.value = true;
    try {
      const url = `/api/absensi/rekap-status?tahun_pelajaran=${encodeURIComponent(statusTapel.value)}&semester=${encodeURIComponent(statusSemester.value)}`;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        statusRawData.value = data;
        statusCache.set(cacheKey, data);
      } else {
        statusRawData.value = [];
      }

      if (!kalenderCache.has(statusTapel.value)) {
        const kalenderData = await fetchFromApi("kalender_pendidikan", false, null, {
          filter_col: "tahun_pelajaran",
          filter_val: statusTapel.value,
        });
        if (Array.isArray(kalenderData)) {
          const holidays = kalenderData.filter((item: any) => item.tipe === "libur");
          hariLiburKalender.value = holidays;
          kalenderCache.set(statusTapel.value, holidays);
        }
      } else {
        hariLiburKalender.value = kalenderCache.get(statusTapel.value)!;
      }

      if (!configCache.has(statusTapel.value)) {
        const configData = await fetchFromApi("pengaturan_tapel", false, null, {
          filter_col: "tahun_pelajaran",
          filter_val: statusTapel.value,
        });
        if (Array.isArray(configData) && configData.length > 0) {
          configCache.set(statusTapel.value, configData);
          const match = configData.find((item: any) => item.tahun_pelajaran === statusTapel.value);
          hariLiburMingguanIndex.value = match ? parseInt(match.hari_libur_mingguan) : 0;
        } else {
          hariLiburMingguanIndex.value = 0;
        }
      } else {
        const configData = configCache.get(statusTapel.value)!;
        const match = configData.find((item: any) => item.tahun_pelajaran === statusTapel.value);
        hariLiburMingguanIndex.value = match ? parseInt(match.hari_libur_mingguan) : 0;
      }
    } catch (err) {
      console.error("Gagal memuat data status pengiriman:", err);
      Notify.failure("Gagal mengambil data status pengiriman absensi");
      statusRawData.value = [];
    } finally {
      isLoadingStatus.value = false;
    }
  };

  const exportStatusToExcel = () => {
    if (statusTableData.value.length === 0) return;

    try {
      isExportingStatus.value = true;

      const excelRows = statusTableData.value.map((row, index) => ({
        No: index + 1,
        Kelas: row.namaKelas,
        "Wali Kelas": row.waliKelas || "-",
        "Hari Efektif": row.hariEfektif,
        "Sudah Diabsen": row.sudahDiabsen,
        "Belum Diabsen": row.belumDiabsen,
        "Persentase (%)": `${row.persentase.toFixed(1)}%`,
        Status: row.persentase >= 90 ? "Baik" : row.persentase >= 75 ? "Cukup" : "Kurang",
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Status_Pengiriman_Absensi_Smt_${statusSemester.value}_${statusTapel.value.replace("/", "-")}_${dateStr}.xlsx`;

      exportStyledExcel({
        data: excelRows,
        sheetName: "Status Pengiriman",
        filename,
        cols: [
          { wch: 5 },
          { wch: 20 },
          { wch: 28 },
          { wch: 14 },
          { wch: 16 },
          { wch: 16 },
          { wch: 15 },
          { wch: 10 },
        ],
      });

      setTimeout(() => {
        Notify.success(`Data berhasil diekspor ke file: ${filename}`);
      }, 100);
    } catch (err) {
      console.error("Gagal export status excel:", err);
      Notify.failure("Gagal mengekspor data status pengiriman.");
    } finally {
      isExportingStatus.value = false;
    }
  };

  return {
    statusTapel,
    statusSemester,
    isLoadingStatus,
    isExportingStatus,
    statusRawData,
    dataGtk,
    hariLiburKalender,
    statusTableData,
    avgPersentaseStatus,
    kelasRendahCount,
    statusPeriodeLabel,
    fetchStatusData,
    exportStatusToExcel,
  };
}
