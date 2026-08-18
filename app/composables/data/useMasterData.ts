import { useState } from "#imports";
import { fetchFromApi } from "~/utils/api";
import { normalizeKelasData, normalizeGtkData } from "~/composables/data/useTableData";

/**
 * Global State untuk Data Master yang sering di-fetch berulang kali di berbagai halaman.
 * Menggunakan useState Nuxt agar data hanya di-fetch 1 kali selama sesi SPA berjalan.
 */
export function useMasterData() {
  const dataMadrasah = useState<any[]>("master-data-madrasah", () => []);
  const pengaturanTapel = useState<any[]>("master-pengaturan-tapel", () => []);
  const kalenderPendidikan = useState<any[]>("master-kalender-pendidikan", () => []);
  const dataKelas = useState<any[]>("master-data-kelas", () => []);
  const dataGtk = useState<any[]>("master-data-gtk", () => []);

  const isMasterLoading = useState<boolean>("master-data-is-loading", () => false);
  const masterLoaded = useState<boolean>("master-data-loaded", () => false);

  /**
   * Memuat semua data master sekaligus (hanya dijalankan jika belum pernah dimuat).
   * @param force jika true, paksa refresh data dari server
   */
  const initMasterData = async (force: boolean = false): Promise<void> => {
    if ((masterLoaded.value || isMasterLoading.value) && !force) {
      return;
    }

    isMasterLoading.value = true;
    try {
      const [madrasahRes, tapelRes, kalenderRes, kelasRes, gtkRes] = await Promise.allSettled([
        fetchFromApi("data_madrasah", force),
        fetchFromApi("pengaturan_tapel", force),
        fetchFromApi("kalender_pendidikan", force),
        fetchFromApi("data_kelas", force),
        fetchFromApi("data_gtk", force, null, { fields: "light" }),
      ]);

      if (madrasahRes.status === "fulfilled" && madrasahRes.value) {
        dataMadrasah.value = Array.isArray(madrasahRes.value)
          ? madrasahRes.value
          : madrasahRes.value.data_madrasah || madrasahRes.value.data || [];
      }

      if (tapelRes.status === "fulfilled" && tapelRes.value) {
        pengaturanTapel.value = Array.isArray(tapelRes.value)
          ? tapelRes.value
          : tapelRes.value.pengaturan_tapel || tapelRes.value.data || [];
      }

      if (kalenderRes.status === "fulfilled" && kalenderRes.value) {
        kalenderPendidikan.value = Array.isArray(kalenderRes.value)
          ? kalenderRes.value
          : kalenderRes.value.kalender_pendidikan || kalenderRes.value.data || [];
      }

      if (kelasRes.status === "fulfilled" && kelasRes.value) {
        const raw = Array.isArray(kelasRes.value)
          ? kelasRes.value
          : kelasRes.value.data_kelas || kelasRes.value.data || [];
        dataKelas.value = normalizeKelasData(raw);
      }

      if (gtkRes.status === "fulfilled" && gtkRes.value) {
        const raw = Array.isArray(gtkRes.value)
          ? gtkRes.value
          : gtkRes.value.data_gtk || gtkRes.value.data || [];
        dataGtk.value = normalizeGtkData(raw);
      }

      masterLoaded.value = true;
    } catch (err) {
      console.error("Gagal memuat master data global:", err);
    } finally {
      isMasterLoading.value = false;
    }
  };

  /**
   * Refresh data master tertentu jika ada perubahan (CREATE/UPDATE/DELETE)
   */
  const refreshMasterTable = async (tableName: string): Promise<void> => {
    try {
      const res = await fetchFromApi(tableName, true);
      const dataArray = Array.isArray(res) ? res : res?.[tableName] || res?.data || [];

      if (tableName === "data_madrasah") dataMadrasah.value = dataArray;
      else if (tableName === "pengaturan_tapel") pengaturanTapel.value = dataArray;
      else if (tableName === "kalender_pendidikan") kalenderPendidikan.value = dataArray;
      else if (tableName === "data_kelas") dataKelas.value = dataArray;
      else if (tableName === "data_gtk") dataGtk.value = dataArray;
    } catch (err) {
      console.error(`Gagal refresh master table ${tableName}:`, err);
    }
  };

  return {
    dataMadrasah,
    pengaturanTapel,
    kalenderPendidikan,
    dataKelas,
    dataGtk,
    isMasterLoading,
    masterLoaded,
    initMasterData,
    refreshMasterTable,
  };
}
