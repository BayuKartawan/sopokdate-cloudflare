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

export interface AnggotaKelompok {
  id: number;
  kelompok_id: number;
  gtk_id: number;
  nama_lengkap: string;
  mata_pelajaran?: string;
  tugas?: string;
}

export interface KelompokGuru {
  id: number;
  tahun_anggaran_id: number;
  nama_kelompok: string; // 'A', 'B', 'C', 'D', 'E'
  anggota: AnggotaKelompok[];
}

export interface IndikatorEdm {
  id?: number;
  tahun_anggaran_id: number;
  kelompok_target: string; // 'A', 'B', 'C', 'D', 'E'
  nomor_urut: number;
  komponen: string;
  sub_komponen: string;
  pertanyaan: string;
  bukti_yang_diminta: string;
  pilihan: string | Array<{ skor: number; label: string }>;
  keterangan: string;
}

export interface JawabanEdm {
  id?: number;
  indikator_id: number;
  gtk_id?: number;
  kelompok_id?: number;
  skor?: number | null;
  jawaban_text?: string;
  bukti_url?: string;
  bukti_filename?: string;
}

export function useEdm() {
  const { Notify } = useNotiflix();
  const isLoading = ref(false);
  const isSaving = ref(false);

  const listTahun = ref<TahunAnggaran[]>([]);
  const selectedTahunId = ref<number | null>(null);

  const activeTahun = computed(() => {
    return listTahun.value.find((t) => t.is_active === 1) || listTahun.value[0] || null;
  });

  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("user-token");
  };

  /**
   * Fetch daftar Tahun Anggaran
   */
  const fetchTahunAnggaran = async () => {
    isLoading.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/edm/tahun-anggaran", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        listTahun.value = data;
        if (!selectedTahunId.value && data.length > 0) {
          const active = data.find((t: TahunAnggaran) => t.is_active === 1);
          selectedTahunId.value = active ? active.id : data[0].id;
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
   * Fetch Kelompok Guru per Tahun Anggaran
   */
  const fetchKelompok = async (tahunId: number): Promise<KelompokGuru[]> => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/edm/kelompok?tahun_anggaran_id=${tahunId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return [];
    } catch (err) {
      console.error("Gagal memuat kelompok EDM:", err);
      return [];
    }
  };

  /**
   * Simpan Pembagian Kelompok
   */
  const saveKelompok = async (
    tahunId: number,
    kelompokPayload: Array<{ nama_kelompok: string; gtk_ids: number[] }>,
  ) => {
    isSaving.value = true;
    try {
      const token = getAuthToken();
      const res = await fetch("/api/edm/kelompok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tahun_anggaran_id: tahunId,
          kelompok: kelompokPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || data.error || "Gagal menyimpan kelompok");
      Notify?.success?.("Pembagian kelompok berhasil disimpan");
      return true;
    } catch (err: any) {
      Notify?.failure?.(err.message || "Gagal menyimpan kelompok");
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  /**
   * Fetch Indikator EDM
   */
  const fetchIndikator = async (
    tahunId: number,
    kelompokTarget?: string,
  ): Promise<IndikatorEdm[]> => {
    try {
      const token = getAuthToken();
      let url = `/api/edm/indikator?tahun_anggaran_id=${tahunId}`;
      if (kelompokTarget) url += `&kelompok_target=${kelompokTarget}`;
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
          return { ...item, pilihan: parsedPilihan };
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
    kelompokTarget?: string,
    kelompokId?: number,
  ): Promise<any[]> => {
    try {
      const token = getAuthToken();
      let url = `/api/edm/jawaban?tahun_anggaran_id=${tahunId}`;
      if (kelompokTarget) url += `&kelompok_target=${kelompokTarget}`;
      if (kelompokId) url += `&kelompok_id=${kelompokId}`;
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
    kelompok_id: number;
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
      const res = await fetch("/api/edm/jawaban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  return {
    isLoading,
    isSaving,
    listTahun,
    selectedTahunId,
    activeTahun,

    fetchTahunAnggaran,
    saveTahunAnggaran,
    deleteTahunAnggaran,
    fetchKelompok,
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
