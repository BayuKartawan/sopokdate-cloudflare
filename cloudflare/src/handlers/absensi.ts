// handlers/absensi.ts
import { jsonResponse, errorResponse, getCurrentAcademicYear } from "../utils";
import type { Env } from "../types";

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi — Ambil daftar siswa beserta absensi
// ---------------------------------------------------------------------------
export async function handleGetAbsensi(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tanggal = url.searchParams.get("tanggal");
  const kelasId = url.searchParams.get("kelas_id");

  if (!tanggal || !kelasId) {
    return errorResponse("Parameter 'tanggal' dan 'kelas_id' diperlukan");
  }

  try {
    const tapel = getCurrentAcademicYear(tanggal);
    const query = `
      SELECT 
        s.id as siswa_id, 
        s.nama, 
        s.nisn, 
        s.nis_lokal,
        a.status, 
        a.keterangan
      FROM riwayat_kelas_siswa r
      INNER JOIN data_siswa s ON r.siswa_id = s.id
      LEFT JOIN absensi_siswa a 
        ON s.id = a.siswa_id AND a.tanggal = ?1
      WHERE r.kelas_id = ?2 AND r.tahun_pelajaran = ?3
      ORDER BY s.nama ASC;
    `;
    const result = await env.DB.prepare(query)
      .bind(tanggal, kelasId, tapel)
      .all<{
        siswa_id: number;
        nama: string;
        nisn: string | null;
        nis_lokal: string | null;
        status: string | null;
        keterangan: string | null;
      }>();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/absensi — Simpan batch absensi siswa (Upsert)
// ---------------------------------------------------------------------------
export async function handlePostAbsensi(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { tanggal, kelas_id, tahun_pelajaran, semester, data, input_by } =
    body as {
      tanggal?: string;
      kelas_id?: string;
      tahun_pelajaran?: string;
      semester?: string;
      data?: Array<{
        siswa_id: string | number;
        status?: string;
        keterangan?: string;
      }>;
      input_by?: string | number;
    };

  if (!tanggal || !kelas_id || !tahun_pelajaran || !semester) {
    return errorResponse(
      "Parameter 'tanggal', 'kelas_id', 'tahun_pelajaran', dan 'semester' wajib diisi",
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return errorResponse("Parameter 'data' harus berupa array kehadiran siswa");
  }

  try {
    const statements: D1PreparedStatement[] = [];
    const upsertQuery = `
      INSERT INTO absensi_siswa (
        tanggal, siswa_id, kelas_id, status, keterangan, tahun_pelajaran, semester, input_by, updated_at
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
      ON CONFLICT(tanggal, siswa_id) DO UPDATE SET
        status = excluded.status,
        keterangan = excluded.keterangan,
        tahun_pelajaran = excluded.tahun_pelajaran,
        semester = excluded.semester,
        input_by = excluded.input_by,
        updated_at = datetime('now');
    `;

    const stmt = env.DB.prepare(upsertQuery);

    for (const row of data) {
      const { siswa_id, status, keterangan } = row;
      statements.push(
        stmt.bind(
          tanggal,
          typeof siswa_id === "string" ? parseInt(siswa_id) : siswa_id,
          kelas_id,
          status || "H",
          keterangan || "",
          tahun_pelajaran,
          semester,
          input_by
            ? typeof input_by === "string"
              ? parseInt(input_by)
              : input_by
            : null,
        ),
      );
    }

    await env.DB.batch(statements);

    return jsonResponse({
      success: true,
      message: "Absensi berhasil disimpan",
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi/rekap — Rekap statistik kehadiran per semester
// ---------------------------------------------------------------------------
export async function handleGetAbsensiRekap(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kelasId = url.searchParams.get("kelas_id");
  const tahunPelajaran = url.searchParams.get("tahun_pelajaran");
  const semester = url.searchParams.get("semester");
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  if (!kelasId || !tahunPelajaran) {
    return errorResponse(
      "Parameter 'kelas_id' dan 'tahun_pelajaran' diperlukan",
    );
  }

  if (!startDate && !endDate && !semester) {
    return errorResponse(
      "Parameter 'semester' atau 'start_date' & 'end_date' diperlukan",
    );
  }

  try {
    let query = "";
    let stmt;
    if (startDate && endDate) {
      query = `
        WITH agg_absensi AS (
          SELECT 
            siswa_id,
            SUM(CASE WHEN status = 'H' THEN 1 ELSE 0 END) as total_hadir,
            SUM(CASE WHEN status = 'S' THEN 1 ELSE 0 END) as total_sakit,
            SUM(CASE WHEN status = 'I' THEN 1 ELSE 0 END) as total_izin,
            SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END) as total_alpa,
            COUNT(id) as total_hari_efektif
          FROM absensi_siswa
          WHERE kelas_id = ?1 AND tahun_pelajaran = ?2 AND tanggal >= ?3 AND tanggal <= ?4
          GROUP BY siswa_id
        )
        SELECT 
          s.id as siswa_id,
          s.nama,
          s.nisn,
          s.nis_lokal,
          COALESCE(a.total_hadir, 0) as total_hadir,
          COALESCE(a.total_sakit, 0) as total_sakit,
          COALESCE(a.total_izin, 0) as total_izin,
          COALESCE(a.total_alpa, 0) as total_alpa,
          COALESCE(a.total_hari_efektif, 0) as total_hari_efektif
        FROM riwayat_kelas_siswa r
        INNER JOIN data_siswa s ON r.siswa_id = s.id
        LEFT JOIN agg_absensi a ON r.siswa_id = a.siswa_id
        WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
        ORDER BY s.nama ASC;
      `;
      stmt = env.DB.prepare(query).bind(kelasId, tahunPelajaran, startDate, endDate);
    } else {
      query = `
        WITH agg_absensi AS (
          SELECT 
            siswa_id,
            SUM(CASE WHEN status = 'H' THEN 1 ELSE 0 END) as total_hadir,
            SUM(CASE WHEN status = 'S' THEN 1 ELSE 0 END) as total_sakit,
            SUM(CASE WHEN status = 'I' THEN 1 ELSE 0 END) as total_izin,
            SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END) as total_alpa,
            COUNT(id) as total_hari_efektif
          FROM absensi_siswa
          WHERE kelas_id = ?1 AND tahun_pelajaran = ?2 AND semester = ?3
          GROUP BY siswa_id
        )
        SELECT 
          s.id as siswa_id,
          s.nama,
          s.nisn,
          s.nis_lokal,
          COALESCE(a.total_hadir, 0) as total_hadir,
          COALESCE(a.total_sakit, 0) as total_sakit,
          COALESCE(a.total_izin, 0) as total_izin,
          COALESCE(a.total_alpa, 0) as total_alpa,
          COALESCE(a.total_hari_efektif, 0) as total_hari_efektif
        FROM riwayat_kelas_siswa r
        INNER JOIN data_siswa s ON r.siswa_id = s.id
        LEFT JOIN agg_absensi a ON r.siswa_id = a.siswa_id
        WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
        ORDER BY s.nama ASC;
      `;
      stmt = env.DB.prepare(query).bind(kelasId, tahunPelajaran, semester);
    }

    const result = await stmt.all<{
      siswa_id: number;
      nama: string;
      nisn: string | null;
      nis_lokal: string | null;
      total_hadir: number;
      total_sakit: number;
      total_izin: number;
      total_alpa: number;
      total_hari_efektif: number;
    }>();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi/rekap-status — Rekap status pengiriman absensi per kelas
// Menghitung jumlah tanggal unik yang sudah diabsen per kelas dalam satu semester
// ---------------------------------------------------------------------------
export async function handleGetAbsensiRekapStatus(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunPelajaran = url.searchParams.get("tahun_pelajaran");
  const semester = url.searchParams.get("semester");

  if (!tahunPelajaran || !semester) {
    return errorResponse(
      "Parameter 'tahun_pelajaran' dan 'semester' diperlukan",
    );
  }

  try {
    const query = `
      WITH kelas_tanggal AS (
        SELECT DISTINCT
          kelas_id,
          tanggal
        FROM absensi_siswa
        WHERE tahun_pelajaran = ?1 AND semester = ?2
      )
      SELECT 
        kelas_id,
        COUNT(tanggal) as total_hari_diabsen,
        MIN(tanggal) as tanggal_pertama,
        MAX(tanggal) as tanggal_terakhir
      FROM kelas_tanggal
      GROUP BY kelas_id
      ORDER BY kelas_id ASC;
    `;

    const stmt = env.DB.prepare(query).bind(tahunPelajaran, semester);
    const result = await stmt.all<{
      kelas_id: string;
      total_hari_diabsen: number;
      tanggal_pertama: string | null;
      tanggal_terakhir: string | null;
    }>();

    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi/peringkat — Peringkat ketidakhadiran siswa (semua kelas)
// ---------------------------------------------------------------------------
export async function handleGetAbsensiPeringkat(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunPelajaran = url.searchParams.get("tahun_pelajaran");
  const semester = url.searchParams.get("semester");
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  if (!tahunPelajaran) {
    return errorResponse("Parameter 'tahun_pelajaran' diperlukan");
  }

  try {
    let query = "";
    let stmt;

    if (startDate && endDate) {
      query = `
        WITH agg_absensi AS (
          SELECT 
            siswa_id,
            SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END) as total_alpa,
            SUM(CASE WHEN status = 'S' THEN 1 ELSE 0 END) as total_sakit,
            SUM(CASE WHEN status = 'I' THEN 1 ELSE 0 END) as total_izin,
            SUM(CASE WHEN status = 'H' THEN 1 ELSE 0 END) as total_hadir,
            SUM(CASE WHEN status IN ('A', 'S', 'I') THEN 1 ELSE 0 END) as total_tidak_hadir,
            COUNT(id) as total_hari_efektif
          FROM absensi_siswa
          WHERE tahun_pelajaran = ?1 AND tanggal >= ?2 AND tanggal <= ?3
          GROUP BY siswa_id
        )
        SELECT 
          s.id as siswa_id,
          s.nama,
          s.nisn,
          s.nis_lokal,
          r.kelas_id,
          COALESCE(a.total_alpa, 0) as total_alpa,
          COALESCE(a.total_sakit, 0) as total_sakit,
          COALESCE(a.total_izin, 0) as total_izin,
          COALESCE(a.total_hadir, 0) as total_hadir,
          COALESCE(a.total_tidak_hadir, 0) as total_tidak_hadir,
          COALESCE(a.total_hari_efektif, 0) as total_hari_efektif
        FROM riwayat_kelas_siswa r
        INNER JOIN data_siswa s ON r.siswa_id = s.id
        LEFT JOIN agg_absensi a ON r.siswa_id = a.siswa_id
        WHERE r.tahun_pelajaran = ?1
        ORDER BY s.nama ASC;
      `;
      stmt = env.DB.prepare(query).bind(tahunPelajaran, startDate, endDate);
    } else {
      query = `
        WITH agg_absensi AS (
          SELECT 
            siswa_id,
            SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END) as total_alpa,
            SUM(CASE WHEN status = 'S' THEN 1 ELSE 0 END) as total_sakit,
            SUM(CASE WHEN status = 'I' THEN 1 ELSE 0 END) as total_izin,
            SUM(CASE WHEN status = 'H' THEN 1 ELSE 0 END) as total_hadir,
            SUM(CASE WHEN status IN ('A', 'S', 'I') THEN 1 ELSE 0 END) as total_tidak_hadir,
            COUNT(id) as total_hari_efektif
          FROM absensi_siswa
          WHERE tahun_pelajaran = ?1 AND semester = ?2
          GROUP BY siswa_id
        )
        SELECT 
          s.id as siswa_id,
          s.nama,
          s.nisn,
          s.nis_lokal,
          r.kelas_id,
          COALESCE(a.total_alpa, 0) as total_alpa,
          COALESCE(a.total_sakit, 0) as total_sakit,
          COALESCE(a.total_izin, 0) as total_izin,
          COALESCE(a.total_hadir, 0) as total_hadir,
          COALESCE(a.total_tidak_hadir, 0) as total_tidak_hadir,
          COALESCE(a.total_hari_efektif, 0) as total_hari_efektif
        FROM riwayat_kelas_siswa r
        INNER JOIN data_siswa s ON r.siswa_id = s.id
        LEFT JOIN agg_absensi a ON r.siswa_id = a.siswa_id
        WHERE r.tahun_pelajaran = ?1
        ORDER BY s.nama ASC;
      `;
      stmt = env.DB.prepare(query).bind(tahunPelajaran, semester || "Ganjil");
    }

    const result = await stmt.all<{
      siswa_id: number;
      nama: string;
      nisn: string | null;
      nis_lokal: string | null;
      kelas_id: string;
      total_alpa: number;
      total_sakit: number;
      total_izin: number;
      total_hadir: number;
      total_tidak_hadir: number;
      total_hari_efektif: number;
    }>();

    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi/submitted-dates — Daftar tanggal absensi yang sudah terkirim
// ---------------------------------------------------------------------------
export async function handleGetAbsensiSubmittedDates(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kelasId = url.searchParams.get("kelas_id");
  const tahunPelajaran = url.searchParams.get("tahun_pelajaran");

  if (!kelasId || !tahunPelajaran) {
    return errorResponse(
      "Parameter 'kelas_id' dan 'tahun_pelajaran' diperlukan",
    );
  }

  try {
    const query = `
      SELECT DISTINCT tanggal
      FROM absensi_siswa
      WHERE kelas_id = ?1 AND tahun_pelajaran = ?2
      ORDER BY tanggal ASC;
    `;

    const stmt = env.DB.prepare(query).bind(kelasId, tahunPelajaran);
    const result = await stmt.all<{ tanggal: string }>();

    const dates = (result.results || []).map((r) => r.tanggal);
    return jsonResponse(dates);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}


