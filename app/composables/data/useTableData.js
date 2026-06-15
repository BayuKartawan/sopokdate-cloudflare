import { ref, computed, onUnmounted } from "vue";
import { fetchFromApi, fetchFromSuratApi } from "~/utils/api";

// Memori cache sesi untuk melacak tabel yang sudah di-fetch dalam sesi SPA ini
const sessionFetched = new Set();

// Cache in-memory untuk menyimpan data tabel secara aman tanpa localStorage
const sessionCache = {};

// Melacak request fetch yang sedang berjalan untuk menghindari request ganda paralel
const activeFetches = {};

/**
 * Membersihkan cache sesi (dipanggil saat logout)
 */
export function clearSessionCache() {
  sessionFetched.clear();
  for (const key in sessionCache) {
    delete sessionCache[key];
  }
}

/**
 * Menormalkan data GTK dari berbagai kemungkinan nama kolom di Google Sheet.
 * Ini memastikan kode frontend tetap berjalan tanpa error meskipun kolom diubah.
 */
function normalizeGtkData(data) {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = {};

    const getField = (obj, targetName) => {
      const cleanedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanedKey === cleanedTarget) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.title = getField(item, "namalengkap");
    normalized.NIK = getField(item, "nik");
    normalized.NoKK = getField(item, "nokk");
    normalized.NUPTK = getField(item, "nuptk");
    normalized.PegID = getField(item, "pegid");
    normalized.NPK = getField(item, "npk");
    normalized.NRG = getField(item, "nrg");
    normalized.PendTerakhir = getField(item, "pendidikanterakhir");
    normalized.Jurusan = getField(item, "jurusan");
    normalized.JenisKelamin = getField(item, "jeniskelamin");
    normalized.TempatLahir = getField(item, "tempatlahir");
    normalized.TanggalLahir = getField(item, "tanggallahir");
    normalized.NomorHp = getField(item, "nohp");
    normalized.Email = getField(item, "email");
    normalized.Tugas = getField(item, "tugas");
    normalized.NoRek = getField(item, "norekening");
    normalized.StatusKepegawaian = getField(item, "statuskepegawaian");
    normalized.NIP = getField(item, "nip");
    normalized.MataPelajaran = getField(item, "matapelajaran");
    normalized.WaliKelas = getField(item, "walikelas");

    // Pertahankan properti lain yang tidak dinormalisasi
    for (const key of Object.keys(item)) {
      if (!(key in normalized)) {
        normalized[key] = item[key];
      }
    }

    return normalized;
  });
}

/**
 * Menormalkan data Siswa dari berbagai kemungkinan nama kolom di Google Sheet.
 * Ini memastikan kode frontend tetap berjalan tanpa error meskipun kolom diubah.
 */
function normalizeSiswaData(data) {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = {};

    const getField = (obj, targetName) => {
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
    normalized["nis lokal"] = getField(item, "nislokal");
    normalized.nik = getField(item, "nik");
    normalized["no kk"] = getField(item, "nokk");
    normalized["tempat lahir"] = getField(item, "tempatlahir");
    normalized["tanggal lahir"] = getField(item, "tanggallahir");

    // Map "Kelas" ke "tingkat - rombel" agar tidak merusak frontend lama
    const kelasVal = getField(item, "kelas");
    normalized["tingkat - rombel"] = kelasVal;
    normalized.kelas = kelasVal;

    normalized.umur = getField(item, "umur");
    normalized["jenis kelamin"] = getField(item, "jeniskelamin");
    normalized.alamat = getField(item, "alamat");
    normalized["no telepon"] = getField(item, "nohp");
    normalized["no kip"] = getField(item, "nokip");
    normalized["nama ayah kandung"] = getField(item, "namaayahkandung");
    normalized["nama ibu kandung"] = getField(item, "namaibukandung");
    normalized["nama wali"] = getField(item, "namawali");

    // Pertahankan properti lain
    for (const key of Object.keys(item)) {
      const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!(key in normalized) && cleanedKey !== "kelas" && cleanedKey !== "tingkatrombel") {
        normalized[key] = item[key];
      }
    }

    return normalized;
  });
}

/**
 * Menormalkan data Kelas dari Google Sheet.
 */
function normalizeKelasData(data) {
  if (!Array.isArray(data)) return data;
  return data.map((item) => {
    if (!item || typeof item !== "object") return item;

    const normalized = {};

    const getField = (obj, targetName) => {
      const cleanedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const key of Object.keys(obj)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanedKey === cleanedTarget) {
          return obj[key];
        }
      }
      return "";
    };

    normalized.idKelas = getField(item, "idkelas");
    normalized.namaKelas = getField(item, "namakelas");
    normalized.tingkat = getField(item, "tingkat");
    normalized.waliKelas = getField(item, "walikelas");

    // Pertahankan properti lain
    for (const key of Object.keys(item)) {
      if (!(key in normalized)) {
        normalized[key] = item[key];
      }
    }

    return normalized;
  });
}

export function useTableData() {
  const cardData = ref([]);
  const isLoading = ref(false);
  const lastUpdated = ref(null);

  // Melacak nama tabel yang sedang dimuat oleh instance ini
  let loadedTableName = null;

  // Menyimpan AbortController untuk membatalkan request jika berpindah halaman
  let currentController = null;

  // Sinkronisasi data secara reaktif antar komponen jika ada update global
  const handleGlobalUpdateEvent = (event) => {
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

  const formattedLastUpdated = computed(() => {
    return lastUpdated.value
      ? new Date(lastUpdated.value).toLocaleString()
      : null;
  });

  const loadData = async (tableName, force = false) => {
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
          if (tableName === "DataGtk") {
            processedData = normalizeGtkData(processedData);
          } else if (tableName === "DataSiswa") {
            processedData = normalizeSiswaData(processedData);
          } else if (tableName === "DataKelas") {
            processedData = normalizeKelasData(processedData);
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

    // Lakukan fetch data realtime dari Apps Script dengan membawa signal pembatalan
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
    } catch (err) {
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

  const saveData = (tableName, data) => {
    try {
      const timestamp = new Date().toISOString();
      let processedData = data;
      if (tableName === "DataGtk" && Array.isArray(data)) {
        processedData = normalizeGtkData(data);
      } else if (tableName === "DataSiswa" && Array.isArray(data)) {
        processedData = normalizeSiswaData(data);
      } else if (tableName === "DataKelas" && Array.isArray(data)) {
        processedData = normalizeKelasData(data);
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

  const clearData = (tableName) => {
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

  const refreshData = (tableName) => {
    loadData(tableName, true);
  };

  const hasData = computed(() => {
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
