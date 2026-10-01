import { ref, computed, watch, type Ref } from "vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import { authenticatedFetch } from "~/utils/api";
import { exportStyledExcel } from "~/utils/excelExport";
import type { PeringkatSiswaItem, KategoriPeringkat } from "~/types/absensi";

export function useRekapPeringkat(dataKelas: Ref<any[]>) {
  const { Notify } = useNotiflix();

  const peringkatTapel = ref<string>("");
  const peringkatSemester = ref<string>("Ganjil");
  const kategoriPeringkat = ref<KategoriPeringkat>("alpa");
  const topLimit = ref<number>(5);
  const filterKelasId = ref<string>(""); // "" = Semua Kelas

  const rawData = ref<PeringkatSiswaItem[]>([]);
  const isLoadingPeringkat = ref<boolean>(false);
  const isExportingPeringkat = ref<boolean>(false);

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getClassName = (kelasId: string) => {
    if (!kelasId) return "-";
    const match = dataKelas.value?.find((k: any) => k.idKelas === kelasId);
    return match ? match.namaKelas : kelasId;
  };

  const kategoriLabel = computed(() => {
    switch (kategoriPeringkat.value) {
      case "alpa":
        return "Paling Banyak Alpa";
      case "sakit":
        return "Paling Banyak Sakit";
      case "izin":
        return "Paling Banyak Izin";
      case "total":
      default:
        return "Paling Banyak Tidak Hadir (A+S+I)";
    }
  });

  const kategoriValueKey = computed(() => {
    switch (kategoriPeringkat.value) {
      case "alpa":
        return "total_alpa";
      case "sakit":
        return "total_sakit";
      case "izin":
        return "total_izin";
      case "total":
      default:
        return "total_tidak_hadir";
    }
  });

  // Filter & Urutkan untuk mendapatkan Peringkat 1 s.d 5
  const rankedList = computed(() => {
    let list = [...rawData.value];

    // Filter Kelas jika dipilih
    if (filterKelasId.value) {
      list = list.filter((item) => item.kelas_id === filterKelasId.value);
    }

    const key = kategoriValueKey.value as keyof PeringkatSiswaItem;

    // Filter hanya siswa yang memiliki nilai > 0 pada kategori yang dipilih
    list = list.filter((item) => Number(item[key] || 0) > 0);

    // Sort descending berdasarkan kategori yang dipilih
    list.sort((a, b) => {
      const valA = Number(a[key] || 0);
      const valB = Number(b[key] || 0);
      if (valB !== valA) return valB - valA;
      // Tie breaker 1: Total tidak hadir
      const totalA = Number(a.total_tidak_hadir || 0);
      const totalB = Number(b.total_tidak_hadir || 0);
      if (totalB !== totalA) return totalB - totalA;
      // Tie breaker 2: Nama
      return a.nama.localeCompare(b.nama);
    });

    // Ambil topLimit (misal top 5)
    return list.slice(0, topLimit.value).map((item, index) => ({
      ...item,
      rank: index + 1,
      namaKelas: getClassName(item.kelas_id),
      selectedKategoriVal: Number(item[key] || 0),
    }));
  });

  // Summary Metrics untuk Semua Siswa
  const topAlpaStudent = computed(() => {
    const sorted = [...rawData.value].filter(s => s.total_alpa > 0).sort((a, b) => b.total_alpa - a.total_alpa);
    return sorted[0] || null;
  });

  const topSakitStudent = computed(() => {
    const sorted = [...rawData.value].filter(s => s.total_sakit > 0).sort((a, b) => b.total_sakit - a.total_sakit);
    return sorted[0] || null;
  });

  const topIzinStudent = computed(() => {
    const sorted = [...rawData.value].filter(s => s.total_izin > 0).sort((a, b) => b.total_izin - a.total_izin);
    return sorted[0] || null;
  });

  // In-memory cache untuk data peringkat
  const peringkatCache = new Map<string, PeringkatSiswaItem[]>();

  const fetchPeringkatData = async (force: boolean = false) => {
    if (!peringkatTapel.value) return;

    const cacheKey = `${peringkatTapel.value}_${peringkatSemester.value}`;
    if (!force && peringkatCache.has(cacheKey)) {
      rawData.value = peringkatCache.get(cacheKey)!;
      return;
    }

    isLoadingPeringkat.value = true;
    try {
      const url = `/api/absensi/peringkat?tahun_pelajaran=${encodeURIComponent(peringkatTapel.value)}&semester=${encodeURIComponent(peringkatSemester.value)}`;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        rawData.value = data;
        peringkatCache.set(cacheKey, data);
      } else {
        rawData.value = [];
      }
    } catch (err) {
      console.error("Gagal memuat data peringkat absensi:", err);
      Notify.failure("Gagal mengambil data peringkat ketidakhadiran");
      rawData.value = [];
    } finally {
      isLoadingPeringkat.value = false;
    }
  };

  const exportPeringkatToExcel = () => {
    if (rankedList.value.length === 0) return;

    try {
      isExportingPeringkat.value = true;

      const excelRows = rankedList.value.map((row) => ({
        Peringkat: row.rank,
        "Nama Siswa": toTitleCase(row.nama),
        NISN: row.nisn || "-",
        Kelas: row.namaKelas,
        "Total Alpa (A)": row.total_alpa,
        "Total Sakit (S)": row.total_sakit,
        "Total Izin (I)": row.total_izin,
        "Total Tidak Hadir": row.total_tidak_hadir,
        "Total Hadir (H)": row.total_hadir,
        "Hari Efektif": row.total_hari_efektif,
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Peringkat_Ketidakhadiran_${kategoriPeringkat.value.toUpperCase()}_Top${topLimit.value}_${peringkatTapel.value.replace("/", "-")}_${peringkatSemester.value}_${dateStr}.xlsx`;

      exportStyledExcel({
        data: excelRows,
        sheetName: `Top ${topLimit.value} ${kategoriPeringkat.value.toUpperCase()}`,
        filename,
        cols: [
          { wch: 10 },
          { wch: 28 },
          { wch: 15 },
          { wch: 16 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 18 },
          { wch: 15 },
          { wch: 14 },
        ],
      });

      setTimeout(() => {
        Notify.success(`Data peringkat berhasil diekspor: ${filename}`);
      }, 100);
    } catch (err) {
      console.error("Gagal export peringkat excel:", err);
      Notify.failure("Gagal mengekspor data peringkat.");
    } finally {
      isExportingPeringkat.value = false;
    }
  };

  const isDownloadingScreenshot = ref<boolean>(false);

  const downloadScreenshotJpg = async (targetElementId: string = "print-template-peringkat") => {
    if (rankedList.value.length === 0) return;

    const targetEl = document.getElementById(targetElementId);
    if (!targetEl) {
      Notify.failure("Template area cetak tidak ditemukan.");
      return;
    }

    isDownloadingScreenshot.value = true;
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Peringkat_Ketidakhadiran_${kategoriPeringkat.value.toUpperCase()}_Top${topLimit.value}_${peringkatTapel.value.replace("/", "-")}_${peringkatSemester.value}_${dateStr}.jpg`;

    // Buat container sementara yang visible (agar browser me-render pixel) tapi tidak terlihat user
    const tempContainer = document.createElement("div");
    tempContainer.style.cssText = "position:fixed;left:0;top:0;z-index:-9999;opacity:1;width:800px;overflow:hidden;pointer-events:none;";
    const clonedEl = targetEl.cloneNode(true) as HTMLElement;
    clonedEl.style.cssText = "position:static;left:auto;top:auto;width:800px;background:#fff;padding:40px;";
    tempContainer.appendChild(clonedEl);
    document.body.appendChild(tempContainer);

    try {
      // 1. Kumpulkan styling untuk Cloudflare Browser Rendering (production)
      let styles = "";
      document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
        styles += node.outerHTML;
      });

      const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${styles}
  <style>
    body { background: #ffffff !important; margin: 0; padding: 16px; font-family: ui-sans-serif, system-ui, sans-serif; }
    #print-template-peringkat { width: 800px !important; margin: 0 auto !important; }
  </style>
</head>
<body class="bg-white text-black">
  <div style="width: 800px; margin: 0 auto;">
    ${targetEl.outerHTML}
  </div>
</body>
</html>`;

      const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

      // 2. Jika bukan di localhost (di server production), coba Cloudflare Browser Rendering API
      let successViaCf = false;
      if (!isLocalhost) {
        try {
          const response = await authenticatedFetch("/api/render/screenshot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              html: fullHtml,
              width: 850,
              quality: 92,
            }),
          });

          if (response.ok && response.headers.get("content-type")?.includes("image/jpeg")) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            Notify.success("Screenshot JPG berhasil didownload via Cloudflare Browser Rendering");
            successViaCf = true;
          }
        } catch {
          // Fallback ke client render jika service offline
        }
      }

      if (successViaCf) return;

      // 3. Client-side rendering menggunakan html-to-image pada clonedEl yang visible
      const { toJpeg } = await import("html-to-image");

      // Tunggu sebentar agar browser selesai melayout/paint clone
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toJpeg(clonedEl, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: "",
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Notify.success("Screenshot JPG berhasil didownload");
    } catch (err: any) {
      console.error("Gagal download screenshot:", err);
      Notify.failure("Gagal mengambil screenshot area print");
    } finally {
      // Hapus container sementara
      if (tempContainer.parentNode) {
        document.body.removeChild(tempContainer);
      }
      isDownloadingScreenshot.value = false;
    }
  };

  return {
    peringkatTapel,
    peringkatSemester,
    kategoriPeringkat,
    topLimit,
    filterKelasId,
    rawData,
    isLoadingPeringkat,
    isExportingPeringkat,
    isDownloadingScreenshot,
    kategoriLabel,
    kategoriValueKey,
    rankedList,
    topAlpaStudent,
    topSakitStudent,
    topIzinStudent,
    getClassName,
    toTitleCase,
    fetchPeringkatData,
    exportPeringkatToExcel,
    downloadScreenshotJpg,
  };
}
