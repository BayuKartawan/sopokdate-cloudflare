import { ref, computed, onUnmounted } from "vue";
import { fetchFromApi, fetchFromSuratApi } from "~/utils/api";

// Memori cache sesi untuk melacak tabel yang sudah di-fetch dalam sesi SPA ini
const sessionFetched = new Set<string>();

interface CacheEntry {
  data: any;
  timestamp: string;
}

// Cache in-memory untuk menyimpan data tabel secara aman tanpa localStorage
const sessionCache: Record<string, CacheEntry> = {};

// Melacak request fetch yang sedang berjalan untuk menghindari request ganda paralel
const activeFetches: Record<string, Promise<any> | undefined> = {};

/**
 * Membersihkan cache sesi (dipanggil saat logout)
 */
export function clearSessionCache(): void {
  sessionFetched.clear();
  for (const key in sessionCache) {
    delete sessionCache[key];
  }
}

/**
 * Membersihkan cache sesi untuk tabel tertentu
 * @param {string} tableName
 */
export function clearTableSessionCache(tableName: string): void {
  if (tableName) {
    delete sessionCache[tableName];
    sessionFetched.delete(tableName);
  }
}

/**
 * Menormalkan data GTK dari berbagai kemungkinan nama kolom di database.
 * Ini memastikan kode frontend tetap berjalan tanpa error meskipun kolom diubah.
 */
function normalizeGtkData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };

    const getField = (obj: any, targetName: string): any => {
      const cleanedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanedKey === cleanedTarget) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.title =
      getField(item, "nama_lengkap") || getField(item, "namalengkap");
    normalized.NIK = getField(item, "nik");
    normalized.NoKK = getField(item, "no_kk") || getField(item, "nokk");
    normalized.NUPTK = getField(item, "nuptk");
    normalized.PegID = getField(item, "peg_id") || getField(item, "pegid");
    normalized.NPK = getField(item, "npk");
    normalized.NRG = getField(item, "nrg");
    normalized.PendTerakhir =
      getField(item, "pendidikan_terakhir") ||
      getField(item, "pendidikanterakhir");
    normalized.Jurusan = getField(item, "jurusan");
    normalized.JenisKelamin =
      getField(item, "jenis_kelamin") || getField(item, "jeniskelamin");
    normalized.TempatLahir =
      getField(item, "tempat_lahir") || getField(item, "tempatlahir");
    normalized.TanggalLahir =
      getField(item, "tanggal_lahir") || getField(item, "tanggallahir");
    normalized.NomorHp = getField(item, "no_hp") || getField(item, "nohp");
    normalized.Email = getField(item, "email");
    normalized.Tugas = getField(item, "tugas");
    normalized.NoRek =
      getField(item, "no_rekening") || getField(item, "norekening");
    normalized.StatusKepegawaian =
      getField(item, "status_kepegawaian") ||
      getField(item, "statuskepegawaian");
    normalized.NIP = getField(item, "nip");
    normalized.MataPelajaran =
      getField(item, "mata_pelajaran") || getField(item, "matapelajaran");
    normalized.WaliKelas =
      getField(item, "wali_kelas") || getField(item, "walikelas");

    return normalized;
  });
}

function normalizeSiswaData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };

    const getField = (obj: any, targetName: string): any => {
      const cleanedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanedKey === cleanedTarget) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.nama = getField(item, "nama");
    normalized.nisn = getField(item, "nisn");
    normalized["nis lokal"] =
      getField(item, "nis_lokal") || getField(item, "nislokal");
    normalized.nik = getField(item, "nik");
    normalized["no kk"] = getField(item, "no_kk") || getField(item, "nokk");
    normalized["tempat lahir"] =
      getField(item, "tempat_lahir") || getField(item, "tempatlahir");
    normalized["tanggal lahir"] =
      getField(item, "tanggal_lahir") || getField(item, "tanggallahir");

    const kelasVal = getField(item, "kelas");
    normalized["tingkat - rombel"] = kelasVal;
    normalized.kelas = kelasVal;

    normalized.umur = getField(item, "umur");
    normalized["jenis kelamin"] =
      getField(item, "jenis_kelamin") || getField(item, "jeniskelamin");
    normalized.alamat = getField(item, "alamat");
    normalized["no telepon"] =
      getField(item, "no_hp") || getField(item, "nohp");
    normalized["no kip"] = getField(item, "no_kip") || getField(item, "nokip");
    normalized["nama ayah kandung"] =
      getField(item, "nama_ayah_kandung") || getField(item, "namaayahkandung");
    normalized["nama ibu kandung"] =
      getField(item, "nama_ibu_kandung") || getField(item, "namaibukandung");
    normalized["nama wali"] =
      getField(item, "nama_wali") || getField(item, "namawali");

    return normalized;
  });
}

function normalizeKelasData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };

    const getField = (obj: any, targetName: string): any => {
      const cleanedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanedKey === cleanedTarget) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.idKelas =
      getField(item, "id_kelas") || getField(item, "idkelas");
    normalized.namaKelas =
      getField(item, "nama_kelas") || getField(item, "namakelas");
    normalized.tingkat = getField(item, "tingkat");
    normalized.waliKelas =
      getField(item, "wali_kelas") || getField(item, "walikelas");

    return normalized;
  });
}

function normalizePengumumanData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };

    const getField = (obj: any, targetName: string): any => {
      const cleanedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanedKey === cleanedTarget) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.tagColor =
      getField(item, "tag_color") || getField(item, "tagcolor") || "";

    return normalized;
  });
}

function normalizeAlumniData(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };

    const getField = (obj: any, targetNames: string[]): any => {
      const cleanTargets = targetNames.map((t) =>
        t.toLowerCase().replace(/[^a-z0-9]/g, ""),
      );
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanTargets.includes(cleanedKey)) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.id = item.id;
    normalized.nama = getField(item, ["nama", "nama_lengkap", "namalengkap"]);
    normalized.foto = getField(item, ["foto"]);
    normalized.nis_lokal = getField(item, [
      "nis_lokal",
      "nislokal",
      "nis_lokal",
    ]);
    normalized.nisn = getField(item, ["nisn"]);
    normalized.nik = getField(item, ["nik"]);
    normalized.no_kk = getField(item, ["no_kk", "nokk"]);
    normalized.tempat_lahir = getField(item, ["tempat_lahir", "tempatlahir"]);
    normalized.tanggal_lahir = getField(item, [
      "tanggal_lahir",
      "tanggallahir",
    ]);
    normalized.umur = getField(item, ["umur"]);
    normalized.jenis_kelamin = getField(item, [
      "jenis_kelamin",
      "jeniskelamin",
    ]);
    normalized.status = getField(item, ["status"]);
    normalized.thn_lulus = getField(item, [
      "thn_lulus",
      "tahunlulus",
      "tahun_lulus",
    ]);
    normalized.menjutkan_ke = getField(item, [
      "menjutkan_ke",
      "melanjutkanke",
      "melanjutkan_ke",
    ]);
    normalized.alamat = getField(item, ["alamat", "alamat"]);
    normalized.no_hp = getField(item, [
      "no_hp",
      "nohp",
      "no_telepon",
      "notelepon",
    ]);
    normalized.no_kip = getField(item, ["no_kip", "nokip", "nomorkippip"]);
    normalized.nama_ayah_kandung = getField(item, [
      "nama_ayah_kandung",
      "namaayahkandung",
    ]);
    normalized.nama_ibu_kandung = getField(item, [
      "nama_ibu_kandung",
      "namaibukandung",
    ]);
    normalized.nama_wali = getField(item, ["nama_wali", "namawali"]);

    return normalized;
  });
}

export function useTableData() {
  const cardData = ref<any[]>([]);
  const isLoading = ref(false);
  const lastUpdated = ref<string | null>(null);

  // Melacak nama tabel yang sedang dimuat oleh instance ini
  let loadedTableName: string | null = null;

  // Menyimpan AbortController untuk membatalkan request jika berpindah halaman
  let currentController: AbortController | null = null;

  // Sinkronisasi data secara reaktif antar komponen jika ada update global
  const handleGlobalUpdateEvent = (event: any) => {
    if (
      event.detail &&
      event.detail.tableName === loadedTableName &&
      event.detail.data
    ) {
      cardData.value = event.detail.data;
      lastUpdated.value = new Date().toISOString();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("globalDataUpdated", handleGlobalUpdateEvent);
  }

  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("globalDataUpdated", handleGlobalUpdateEvent);
    }
    if (currentController) {
      currentController.abort();
    }
  });

  const formattedLastUpdated = computed((): string | null => {
    return lastUpdated.value
      ? new Date(lastUpdated.value).toLocaleString()
      : null;
  });

  const loadData = async (
    tableName: string,
    force: boolean = false,
  ): Promise<void> => {
    loadedTableName = tableName;
    isLoading.value = true;
    try {
      // Dapatkan data dari session cache
      if (sessionCache[tableName]) {
        const cache = sessionCache[tableName];
        lastUpdated.value = cache.timestamp || null;
        cardData.value = cache.data || [];
      } else {
        cardData.value = [];
        lastUpdated.value = null;
      }
    } catch {
      cardData.value = [];
      lastUpdated.value = null;
    }

    // Jika ada request fetch yang sedang berjalan untuk tabel ini, tunggu promise tersebut
    if (activeFetches[tableName]) {
      try {
        const data = await activeFetches[tableName];
        if (data) {
          let tableData = data;
          if (
            data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            data[tableName]
          ) {
            tableData = data[tableName];
          }
          const extracted = tableData.data || tableData;
          let processedData = Array.isArray(extracted) ? extracted : [];
          if (tableName === "data_gtk" || tableName === "DataGtk") {
            processedData = normalizeGtkData(processedData);
          } else if (tableName === "data_siswa" || tableName === "DataSiswa") {
            processedData = normalizeSiswaData(processedData);
          } else if (tableName === "data_kelas" || tableName === "DataKelas") {
            processedData = normalizeKelasData(processedData);
          } else if (tableName === "pengumuman" || tableName === "Pengumuman") {
            processedData = normalizePengumumanData(processedData);
          } else if (tableName === "alumni" || tableName === "Alumni") {
            processedData = normalizeAlumniData(processedData);
          }
          cardData.value = processedData;
        }
      } catch (err) {
        console.error(
          `Gagal menunggu active fetch untuk tabel ${tableName}:`,
          err,
        );
      } finally {
        isLoading.value = false;
      }
      return;
    }

    // Batalkan request sebelumnya di instance ini jika ada yang masih pending
    if (currentController) {
      currentController.abort();
    }
    currentController = new AbortController();
    const signal = currentController.signal;

    // Lakukan fetch data realtime dengan membawa signal pembatalan
    const fetchPromise = (async () => {
      if (tableName === "surat") {
        return await fetchFromSuratApi(force, signal);
      } else {
        return await fetchFromApi(tableName, force, signal);
      }
    })();

    activeFetches[tableName] = fetchPromise;

    try {
      const data = await fetchPromise;
      if (data) {
        let tableData = data;
        if (
          data &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          data[tableName]
        ) {
          tableData = data[tableName];
        }
        saveData(tableName, tableData);
        sessionFetched.add(tableName);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log(
          `Fetch data untuk tabel ${tableName} dibatalkan karena perpindahan halaman.`,
        );
      } else {
        console.error(
          `Gagal memuat data realtime untuk tabel ${tableName}:`,
          err,
        );
      }
    } finally {
      if (currentController?.signal === signal) {
        currentController = null;
      }
      delete activeFetches[tableName];
      isLoading.value = false;
    }
  };

  const saveData = (tableName: string, data: any): boolean => {
    try {
      const timestamp = new Date().toISOString();
      let processedData = data;
      if (
        (tableName === "data_gtk" || tableName === "DataGtk") &&
        Array.isArray(data)
      ) {
        processedData = normalizeGtkData(data);
      } else if (
        (tableName === "data_siswa" || tableName === "DataSiswa") &&
        Array.isArray(data)
      ) {
        processedData = normalizeSiswaData(data);
      } else if (
        (tableName === "data_kelas" || tableName === "DataKelas") &&
        Array.isArray(data)
      ) {
        processedData = normalizeKelasData(data);
      } else if (
        (tableName === "pengumuman" || tableName === "Pengumuman") &&
        Array.isArray(data)
      ) {
        processedData = normalizePengumumanData(data);
      } else if (
        (tableName === "alumni" || tableName === "Alumni") &&
        Array.isArray(data)
      ) {
        processedData = normalizeAlumniData(data);
      }
      sessionCache[tableName] = {
        data: processedData,
        timestamp: timestamp,
      };

      cardData.value = processedData;
      lastUpdated.value = timestamp;

      window.dispatchEvent(
        new CustomEvent("globalDataUpdated", {
          detail: { tableName, data: processedData },
        }),
      );

      return true;
    } catch {
      return false;
    }
  };

  const clearData = (tableName: string): boolean => {
    try {
      delete sessionCache[tableName];
      sessionFetched.delete(tableName);

      cardData.value = [];
      lastUpdated.value = null;

      return true;
    } catch {
      return false;
    }
  };

  const refreshData = (tableName: string): void => {
    loadData(tableName, true);
  };

  const hasData = computed((): boolean => {
    if (Array.isArray(cardData.value)) {
      return cardData.value.length > 0;
    }
    if (typeof cardData.value === "object" && cardData.value !== null) {
      return Object.keys(cardData.value).length > 0;
    }
    return false;
  });

  return {
    cardData,
    isLoading,
    lastUpdated,
    formattedLastUpdated,
    hasData,

    loadData,
    saveData,
    clearData,
    refreshData,
  };
}
