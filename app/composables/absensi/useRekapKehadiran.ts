import { ref, computed, watch, type Ref } from "vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch } from "~/utils/api";
import { exportStyledExcel } from "~/utils/excelExport";
import type { RekapSiswa, RekapType } from "~/types/absensi";

export const monthNames: string[] = [
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

export function useRekapKehadiran(dataKelas: Ref<any[]>) {
  const { Notify } = useNotiflix();

  const selectedClass = ref<string>("");
  const selectedTapel = ref<string>("");
  const selectedSemester = ref<string>("Ganjil");
  const rekapType = ref<RekapType>("semester");
  const selectedMonth = ref<number>(new Date().getMonth() + 1);
  const startDate = ref<string>("");
  const endDate = ref<string>("");
  const rekapData = ref<RekapSiswa[]>([]);

  const isLoading = ref<boolean>(false);
  const isExporting = ref<boolean>(false);

  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(now.setDate(diffToMonday + 6));

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${date}`;
    };

    return {
      start: formatDate(monday),
      end: formatDate(sunday),
    };
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

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const hitungPersentase = (hadir: number | string, total: number | string) => {
    const numTotal = Number(total);
    const numHadir = Number(hadir);
    if (!numTotal || numTotal === 0) return "0.0";
    return ((numHadir / numTotal) * 100).toFixed(1);
  };

  const monthRange = computed(() => {
    if (!selectedTapel.value || !selectedMonth.value) return null;
    const parts = selectedTapel.value.split("/");
    if (parts.length !== 2) return null;
    const year = selectedMonth.value >= 7 ? parseInt(parts[0]) : parseInt(parts[1]);

    const startDay = "01";
    const formattedMonth = String(selectedMonth.value).padStart(2, "0");
    const startDateStr = `${year}-${formattedMonth}-${startDay}`;

    const lastDay = new Date(year, selectedMonth.value, 0).getDate();
    const endDateStr = `${year}-${formattedMonth}-${String(lastDay).padStart(2, "0")}`;

    return {
      start: startDateStr,
      end: endDateStr,
    };
  });

  const tapelOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const options: string[] = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      options.push(`${y}/${y + 1}`);
    }
    return options;
  });

  const currentClassName = computed(() => {
    if (!selectedClass.value) return "";
    const match = dataKelas.value?.find((k: any) => k.idKelas === selectedClass.value);
    return match ? match.namaKelas : selectedClass.value;
  });

  // In-memory cache untuk menghemat D1 Rows Read
  const rekapCache = new Map<string, RekapSiswa[]>();

  const fetchRekap = async (force: boolean = false) => {
    if (!selectedClass.value || !selectedTapel.value) {
      rekapData.value = [];
      return;
    }

    let url = `/api/absensi/rekap?kelas_id=${encodeURIComponent(selectedClass.value)}&tahun_pelajaran=${encodeURIComponent(selectedTapel.value)}`;

    if (rekapType.value === "semester") {
      url += `&semester=${encodeURIComponent(selectedSemester.value)}`;
    } else if (rekapType.value === "bulanan" && monthRange.value) {
      url += `&start_date=${encodeURIComponent(monthRange.value.start)}&end_date=${encodeURIComponent(monthRange.value.end)}`;
    } else if (rekapType.value === "mingguan") {
      if (!startDate.value || !endDate.value) {
        rekapData.value = [];
        return;
      }
      url += `&start_date=${encodeURIComponent(startDate.value)}&end_date=${encodeURIComponent(endDate.value)}`;
    }

    // Cek cache jika bukan force refresh
    if (!force && rekapCache.has(url)) {
      rekapData.value = rekapCache.get(url)!;
      return;
    }

    isLoading.value = true;
    try {
      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        rekapData.value = data;
        rekapCache.set(url, data);
      } else {
        rekapData.value = [];
      }
    } catch (err) {
      console.error("Gagal memuat rekap absensi:", err);
      Notify.failure("Gagal mengambil data rekap absensi");
      rekapData.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  watch(
    [selectedClass, selectedTapel, selectedSemester, rekapType, selectedMonth, startDate, endDate],
    async () => {
      await fetchRekap();
    }
  );

  const exportToExcel = () => {
    if (rekapData.value.length === 0) return;

    try {
      isExporting.value = true;

      const excelRows = rekapData.value.map((siswa, index) => ({
        No: index + 1,
        "Nama Siswa": toTitleCase(siswa.nama),
        NISN: siswa.nisn || "-",
        "Hadir (H)": siswa.total_hadir,
        "Sakit (S)": siswa.total_sakit,
        "Izin (I)": siswa.total_izin,
        "Alpa (A)": siswa.total_alpa,
        "Hari Efektif": siswa.total_hari_efektif,
        "Persentase Kehadiran (%)": `${hitungPersentase(siswa.total_hadir, siswa.total_hari_efektif)}%`,
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      let periodSuffix = "";
      if (rekapType.value === "semester") {
        periodSuffix = `Smt_${selectedSemester.value}`;
      } else if (rekapType.value === "bulanan") {
        periodSuffix = `Bulan_${monthNames[selectedMonth.value - 1]}`;
      } else if (rekapType.value === "mingguan") {
        periodSuffix = `Rentang_${startDate.value}_sd_${endDate.value}`;
      }
      const filename = `Rekap_Absensi_${currentClassName.value.replace(/[^a-zA-Z0-9]/g, "_")}_${periodSuffix}_${dateStr}.xlsx`;

      exportStyledExcel({
        data: excelRows,
        sheetName: "Rekap Absensi",
        filename,
        cols: [
          { wch: 5 },
          { wch: 28 },
          { wch: 15 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 12 },
          { wch: 24 },
        ],
      });

      setTimeout(() => {
        Notify.success(`Rekap berhasil diekspor ke file: ${filename}`);
      }, 100);
    } catch (err) {
      console.error("Gagal export excel:", err);
      Notify.failure("Gagal mengekspor rekap absensi.");
    } finally {
      isExporting.value = false;
    }
  };

  return {
    selectedClass,
    selectedTapel,
    selectedSemester,
    rekapType,
    selectedMonth,
    startDate,
    endDate,
    rekapData,
    isLoading,
    isExporting,
    monthRange,
    tapelOptions,
    currentClassName,
    monthNames,
    getWeekRange,
    formatDateIndo,
    toTitleCase,
    hitungPersentase,
    fetchRekap,
    exportToExcel,
  };
}
