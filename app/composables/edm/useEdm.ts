import { ref, computed } from "vue";
import { useNotiflix } from "~/composables/ui/useFeedback";

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

export interface EdmBagianMeta {
  code: string;
  name: string;
  title: string;
}

export const EDM_BAGIAN_LIST: EdmBagianMeta[] = [
  { code: "A", name: "Bagian A: Aspek Budaya Kedisiplinan bagi Warga Madrasah", title: "Aspek Budaya Kedisiplinan bagi Warga Madrasah" },
  { code: "B", name: "Bagian B: Aspek Budaya Melakukan Pengembangan Diri bagi Guru dan Tenaga Kependidikan", title: "Aspek Budaya Melakukan Pengembangan Diri bagi Guru dan Tenaga Kependidikan" },
  { code: "C", name: "Bagian C: Aspek Budaya Guru Melakukan Penyiapan, Pelaksanaan dan Penilaian Atas Proses Pembelajaran", title: "Aspek Budaya Guru Melakukan Penyiapan, Pelaksanaan dan Penilaian Atas Proses Pembelajaran" },
  { code: "D", name: "Bagian D: Aspek Budaya Madrasah Menyediakan Sarana Belajar untuk Guru dan Siswa", title: "Aspek Budaya Madrasah Menyediakan Sarana Belajar untuk Guru dan Siswa" },
  { code: "E", name: "Bagian E: Aspek Budaya Madrasah Melakukan Pengelolaan Anggaran yang Transparan dan Berorientasi pada Peningkatan Mutu", title: "Aspek Budaya Madrasah Melakukan Pengelolaan Anggaran yang Transparan dan Berorientasi pada Peningkatan Mutu" },
];

export interface IndikatorEdm {
  id?: number;
  tahun_anggaran_id: number;
  bagian_target: string; // 'A', 'B', 'C', 'D', 'E'
  kelompok_target?: string;
  nomor_urut: number;
  pertanyaan: string;
  bukti_yang_diminta: string;
  pilihan: string | Array<{ skor: number; label: string }>;
}

export interface JawabanEdm {
  id?: number;
  indikator_id: number;
  gtk_id?: number;
  bagian_id?: number;
  kelompok_id?: number;
  skor?: number | null;
  jawaban_text?: string;
  bukti_url?: string;
  bukti_filename?: string;
}

// ── Global Shared State (shared across all pages/components) ──
const _listTahun = ref<TahunAnggaran[]>([]);
const _selectedTahunId = ref<number | null>(null);
let _tahunFetched = false;

// Restore selectedTahunId from localStorage on init
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
    // If already fetched and data exists, skip re-fetch (unless list is empty)
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

        // Restore from localStorage or fallback to active/first
        if (selectedTahunId.value) {
          // Validate that stored ID still exists in the list
          const exists = data.find((t: TahunAnggaran) => t.id === selectedTahunId.value);
          if (!exists && data.length > 0) {
            const active = data.find((t: TahunAnggaran) => t.is_active === 1);
            selectedTahunId.value = active ? active.id : data[0].id;
          }
        } else if (data.length > 0) {
          const active = data.find((t: TahunAnggaran) => t.is_active === 1);
          selectedTahunId.value = active ? active.id : data[0].id;
        }

        // Persist to localStorage
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
   * Fetch Indikator EDM
   */
  const fetchIndikator = async (
    tahunId: number,
    bagianTarget?: string,
  ): Promise<IndikatorEdm[]> => {
    try {
      const token = getAuthToken();
      let url = `/api/edm/indikator?tahun_anggaran_id=${tahunId}`;
      if (bagianTarget) url += `&bagian_target=${bagianTarget}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const raw: IndikatorEdm[] = await res.json();
        return raw.map((item) => {
          let parsedPilihan = item.pilihan;
          if (typeof item.pilihan === "string" && item.pilihan.trim()) {
            try {
              parsedPilihan = JSON.parse(item.pilihan);
            } catch {
              parsedPilihan = [];
            }
          }
          return {
            ...item,
            bagian_target: item.bagian_target || item.kelompok_target || "A",
            pilihan: parsedPilihan
          };
        });
      }
      return [];
    } catch (err) {
      console.error("Gagal memuat indikator EDM:", err);
      return [];
    }
  };

  /**
   * Save (Single or Batch) Indikator
   */
  const saveIndikator = async (payload: any) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/edm/indikator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menyimpan indikator");
      Notify?.success?.(data.message || "Indikator berhasil disimpan");
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menyimpan indikator");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Update Single Indikator
   */
  const updateIndikator = async (id: number, payload: any) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/indikator?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal mengupdate indikator");
      Notify?.success?.("Indikator berhasil diperbarui");
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal mengupdate indikator");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Delete Single Indikator
   */
  const deleteIndikator = async (id: number) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/indikator?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menghapus");
      Notify?.success?.("Indikator berhasil dihapus");
      await fetchTahunAnggaran();
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menghapus indikator");
      return false;
    }
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
    gtk_id: number;
    jawaban: Array<{
      indikator_id: number;
      skor?: number | null;
      jawaban_text?: string;
      bukti_url?: string;
      bukti_filename?: string;
    }>;
  }) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const bodyPayload = {
        ...payload,
        bagian_id: payload.bagian_id || payload.kelompok_id,
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
   * Set selected tahun and persist to localStorage
   */
  const setSelectedTahunId = (id: number | null) => {
    selectedTahunId.value = id;
    if (id && typeof window !== "undefined") {
      localStorage.setItem("edm-selected-tahun-id", String(id));
    }
  };

  /**
   * Force re-fetch tahun (e.g. after adding new tahun)
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
    fetchIndikator,
    saveIndikator,
    updateIndikator,
    deleteIndikator,
    fetchJawaban,
    saveJawaban,
    fetchRekap,
  };
}
