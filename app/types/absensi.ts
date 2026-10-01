export interface RekapSiswa {
  siswa_id: string | number;
  nama: string;
  nisn?: string | null;
  total_hadir: number;
  total_sakit: number;
  total_izin: number;
  total_alpa: number;
  total_hari_efektif: number;
  [key: string]: any;
}

export interface StatusRow {
  kelas_id: string;
  namaKelas: string;
  waliKelas: string;
  hariEfektif: number;
  sudahDiabsen: number;
  belumDiabsen: number;
  persentase: number;
}

export interface PeringkatSiswaItem {
  siswa_id: number | string;
  nama: string;
  nisn?: string | null;
  nis_lokal?: string | null;
  kelas_id: string;
  total_alpa: number;
  total_sakit: number;
  total_izin: number;
  total_hadir: number;
  total_tidak_hadir: number;
  total_hari_efektif: number;
  [key: string]: any;
}

export type KategoriPeringkat = "alpa" | "sakit" | "izin" | "total";

export interface MissingDateItem {
  dateStr: string;
  formattedDate: string;
  dayNum: string;
  namaHari: string;
  isJadwalMapel: boolean;
  isWali: boolean;
}

export interface AccessibleClass {
  [key: string]: unknown;
  id_kelas: string;
  nama_kelas: string;
}

export type RekapType = "semester" | "bulanan" | "mingguan";
