import { ref, computed } from "vue";
import { useNotiflix } from "~/composables/ui/useFeedback";
import type {
  EdmInstrumen,
  EdmKategori,
} from "~/utils/edm-instrumen";
import {
  EDM_KATEGORI,
  EDM_BAGIAN_META,
  getAllInstrumen,
  getInstrumenByKategori,
  getInstrumenByKodeSoal,
  getKategoriByKode,
} from "~/utils/edm-instrumen";

export interface TahunAnggaran {
  id: number;
  tahun: number;
  is_active: number;
  juknis: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnggotaBagian {
  id: number;
  bagian_id: number;
  kelompok_id?: number;
  gtk_id: number;
  nama_lengkap: string;
  mata_pelajaran?: string;
  tugas?: string;
}
export type AnggotaKelompok = AnggotaBagian;

export interface BagianGuru {
  id: number;
  tahun_anggaran_id: number;
  nama_bagian: string; // 'A', 'B', 'C', 'D', 'E'
  nama_kelompok?: string;
  anggota: AnggotaBagian[];
}
export type KelompokGuru = BagianGuru;

export type { EdmInstrumen, EdmKategori, EdmPilihan } from "~/utils/edm-instrumen";

export const EDM_BAGIAN_LIST = EDM_BAGIAN_META;

export interface JawabanEdm {
  id?: number;
  kode_soal: string;
  gtk_id?: number;
  bagian_id?: number;
  kelompok_id?: number;
  skor?: number | null;
  upload_text?: string | null;
}

export interface BuktiFile {
  id: number;
  jawaban_id?: number;
  kode_soal: string;
  bagian_id: number;
  r2_key: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by?: number;
  uploader_nama?: string;
  created_at?: string;
}

// ── Global Shared State ──
const _listTahun = ref<TahunAnggaran[]>([]);
const _selectedTahunId = ref<number | null>(null);
let _tahunFetched = false;

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("edm-selected-tahun-id");
  if (stored) _selectedTahunId.value = parseInt(stored);
}

export function useEdm() {
  const { Notify } = useNotiflix();
  const isLoading = ref(false);
  const isSaving = ref(false);

  const listTahun = _listTahun;
  const selectedTahunId = _selectedTahunId;

  const activeTahun = computed(() => {
    return listTahun.value.find((t) => t.is_active === 1) || listTahun.value[0] || null;
  });

  const selectedTahunLabel = computed(() => {
    const t = listTahun.value.find((t) => t.id === selectedTahunId.value);
    return t ? `TA ${t.tahun}${t.is_active === 1 ? ' (Aktif)' : ''}` : '—';
  });

  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("user-token");
  };

  /**
   * Fetch daftar Tahun Anggaran
   */
  const fetchTahunAnggaran = async () => {
    if (_tahunFetched && listTahun.value.length > 0) {
      return;
    }
    isLoading.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/edm/tahun-anggaran", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        listTahun.value = data;
        _tahunFetched = true;

        if (selectedTahunId.value) {
          const exists = data.find((t: TahunAnggaran) => t.id === selectedTahunId.value);
          if (!exists && data.length > 0) {
            const active = data.find((t: TahunAnggaran) => t.is_active === 1);
            selectedTahunId.value = active ? active.id : data[0].id;
          }
        } else if (data.length > 0) {
          const active = data.find((t: TahunAnggaran) => t.is_active === 1);
          selectedTahunId.value = active ? active.id : data[0].id;
        }

        if (selectedTahunId.value && typeof window !== "undefined") {
          localStorage.setItem("edm-selected-tahun-id", String(selectedTahunId.value));
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat tahun anggaran EDM:", err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Save / Update Tahun Anggaran
   */
  const saveTahunAnggaran = async (payload: Partial<TahunAnggaran>) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/edm/tahun-anggaran", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menyimpan");
      Notify?.success?.(data.message || "Berhasil disimpan");
      await fetchTahunAnggaran();
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menyimpan tahun anggaran");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Delete Tahun Anggaran
   */
  const deleteTahunAnggaran = async (id: number) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/tahun-anggaran?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menghapus");
      Notify?.success?.("Tahun anggaran berhasil dihapus");
      await fetchTahunAnggaran();
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menghapus tahun anggaran");
      return false;
    }
  };

  /**
   * Fetch Bagian Guru per Tahun Anggaran
   */
  const fetchBagian = async (tahunId: number): Promise<BagianGuru[]> => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/bagian?tahun_anggaran_id=${tahunId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error("Gagal memuat bagian EDM:", err);
      return [];
    }
  };
  const fetchKelompok = fetchBagian;

  /**
   * Simpan Pembagian Bagian
   */
  const saveBagian = async (
    tahunId: number,
    bagianPayload: Array<{ nama_bagian?: string; nama_kelompok?: string; gtk_ids: number[] }>,
  ) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/edm/bagian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tahun_anggaran_id: tahunId,
          bagian: bagianPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menyimpan bagian");
      Notify?.success?.("Pembagian bagian berhasil disimpan");
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menyimpan bagian");
      return false;
    } finally {
      isSaving.value = false;
    }
  };
  const saveKelompok = saveBagian;

  /**
   * Get Instrumen (Hardcoded TS module - instant & 0 D1 reads)
   */
  const fetchInstrumen = (kategori?: string): EdmInstrumen[] => {
    if (kategori) {
      return getInstrumenByKategori(kategori);
    }
    return getAllInstrumen();
  };

  // Backward compatible wrapper
  const fetchIndikator = async (tahunId?: number, bagianTarget?: string): Promise<any[]> => {
    const list = fetchInstrumen(bagianTarget);
    return list.map((item) => ({
      id: item.kode_soal,
      kode_soal: item.kode_soal,
      bagian_target: item.kategori,
      kelompok_target: item.kategori,
      nomor_urut: item.kode ? parseInt(item.kode) : 0,
      urutan: item.urutan,
      pertanyaan: item.pertanyaan,
      bukti_yang_diminta: item.bukti,
      bobot: item.bobot,
      pilihan: item.pilihan,
    }));
  };

  /**
   * Fetch Jawaban EDM (Group Synced)
   */
  const fetchJawaban = async (
    tahunId: number,
    bagianTarget?: string,
    bagianId?: number,
  ): Promise<any[]> => {
    try {
      const token = getAuthToken();
      let url = `/api/edm/jawaban?tahun_anggaran_id=${tahunId}`;
      if (bagianTarget) url += `&bagian_target=${bagianTarget}`;
      if (bagianId) url += `&bagian_id=${bagianId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error("Gagal memuat jawaban EDM:", err);
      return [];
    }
  };

  /**
   * Save Batch Jawaban
   */
  const saveJawaban = async (payload: {
    bagian_id?: number;
    kelompok_id?: number;
    gtk_id?: number;
    jawaban: Array<{
      kode_soal?: string;
      indikator_id?: number | string;
      skor?: number | null;
      upload_text?: string | null;
    }>;
  }) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const bodyPayload = {
        ...payload,
        bagian_id: payload.bagian_id || payload.kelompok_id,
        jawaban: payload.jawaban.map((j) => ({
          kode_soal: j.kode_soal || String(j.indikator_id || ""),
          skor: j.skor,
          upload_text: j.upload_text,
        })),
      };
      const res = await fetch("/api/edm/jawaban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menyimpan jawaban");
      Notify?.success?.("Pengisian EDM berhasil disimpan");
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menyimpan jawaban EDM");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Fetch Rekap EDM
   */
  const fetchRekap = async (tahunId: number) => {
    isLoading.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/rekap?tahun_anggaran_id=${tahunId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error("Gagal memuat rekap EDM:", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Upload bukti files ke R2
   */
  const uploadBuktiFiles = async (
    files: File[],
    kodeSoal: string | number,
    bagianId: number,
    gtkId?: number,
  ): Promise<BuktiFile[]> => {
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("kode_soal", String(kodeSoal));
      formData.append("bagian_id", String(bagianId));
      if (gtkId) formData.append("gtk_id", String(gtkId));
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/edm/bukti/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal mengupload file");
      Notify?.success?.(data.message || "File berhasil diupload");
      return data.files || [];
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal mengupload file bukti");
      return [];
    }
  };

  /**
   * Fetch daftar bukti file per instrumen
   */
  const fetchBuktiFiles = async (
    kodeSoal: string | number,
    bagianId: number,
  ): Promise<BuktiFile[]> => {
    try {
      const token = getAuthToken();
      const res = await fetch(
        `/api/edm/bukti?kode_soal=${encodeURIComponent(String(kodeSoal))}&bagian_id=${bagianId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error("Gagal memuat bukti file:", err);
      return [];
    }
  };

  /**
   * Hapus bukti file
   */
  const deleteBuktiFile = async (fileId: number): Promise<boolean> => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/bukti/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menghapus file");
      Notify?.success?.(data.message || "File berhasil dihapus");
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menghapus file bukti");
      return false;
    }
  };

  /**
   * Get download/preview URL for bukti file
   */
  const getBuktiDownloadUrl = (r2Key: string): string => {
    return `/api/edm/bukti/download/${r2Key}`;
  };

  /**
   * Set selected tahun and persist to localStorage
   */
  const setSelectedTahunId = (id: number | null) => {
    selectedTahunId.value = id;
    if (id && typeof window !== "undefined") {
      localStorage.setItem("edm-selected-tahun-id", String(id));
    }
  };

  /**
   * Force re-fetch tahun
   */
  const refetchTahunAnggaran = async () => {
    _tahunFetched = false;
    await fetchTahunAnggaran();
  };

  return {
    isLoading,
    isSaving,
    listTahun,
    selectedTahunId,
    activeTahun,
    selectedTahunLabel,
    setSelectedTahunId,

    fetchTahunAnggaran,
    refetchTahunAnggaran,
    saveTahunAnggaran,
    deleteTahunAnggaran,
    fetchBagian,
    fetchKelompok,
    saveBagian,
    saveKelompok,
    fetchInstrumen,
    fetchIndikator,
    fetchJawaban,
    saveJawaban,
    fetchRekap,

    // Bukti File R2
    uploadBuktiFiles,
    fetchBuktiFiles,
    deleteBuktiFile,
    getBuktiDownloadUrl,
  };
}

