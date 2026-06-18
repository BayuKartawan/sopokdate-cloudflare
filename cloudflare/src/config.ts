// config.ts
// ---------------------------------------------------------------------------
// CORS Headers
// ---------------------------------------------------------------------------
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ---------------------------------------------------------------------------
// Daftar nama tabel D1 yang valid (untuk validasi request di backend)
// ---------------------------------------------------------------------------
export const VALID_TABLES: string[] = [
  "data_gtk",
  "data_siswa",
  "data_kelas",
  "sertifikat",
  "data_madrasah",
  "akun_emis",
  "akun_email",
  "akun_simpatika",
  "akun_emis_gtk",
  "akun_rdm",
  "operator",
  "berkas",
  "aplikasi",
  "pengumuman",
  "kalender_pendidikan",
  "pengaturan_tapel",
];
