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
        SELECT 
          s.id as siswa_id,
          s.nama,
          s.nisn,
          s.nis_lokal,
          SUM(CASE WHEN a.status = 'H' THEN 1 ELSE 0 END) as total_hadir,
          SUM(CASE WHEN a.status = 'S' THEN 1 ELSE 0 END) as total_sakit,
          SUM(CASE WHEN a.status = 'I' THEN 1 ELSE 0 END) as total_izin,
          SUM(CASE WHEN a.status = 'A' THEN 1 ELSE 0 END) as total_alpa,
          COUNT(a.id) as total_hari_efektif
        FROM riwayat_kelas_siswa r
        INNER JOIN data_siswa s ON r.siswa_id = s.id
        LEFT JOIN absensi_siswa a ON s.id = a.siswa_id
          AND a.kelas_id = r.kelas_id
          AND a.tanggal >= ?3
          AND a.tanggal <= ?4
        WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
        GROUP BY s.id, s.nama, s.nisn, s.nis_lokal
        ORDER BY s.nama ASC;
      `;
      stmt = env.DB.prepare(query).bind(kelasId, tahunPelajaran, startDate, endDate);
    } else {
      query = `
        SELECT 
          s.id as siswa_id,
          s.nama,
          s.nisn,
          s.nis_lokal,
          SUM(CASE WHEN a.status = 'H' THEN 1 ELSE 0 END) as total_hadir,
          SUM(CASE WHEN a.status = 'S' THEN 1 ELSE 0 END) as total_sakit,
          SUM(CASE WHEN a.status = 'I' THEN 1 ELSE 0 END) as total_izin,
          SUM(CASE WHEN a.status = 'A' THEN 1 ELSE 0 END) as total_alpa,
          COUNT(a.id) as total_hari_efektif
        FROM riwayat_kelas_siswa r
        INNER JOIN data_siswa s ON r.siswa_id = s.id
        LEFT JOIN absensi_siswa a ON s.id = a.siswa_id
          AND a.kelas_id = r.kelas_id
          AND a.tahun_pelajaran = r.tahun_pelajaran 
          AND a.semester = ?3
        WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
        GROUP BY s.id, s.nama, s.nisn, s.nis_lokal
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
      SELECT 
        a.kelas_id,
        COUNT(DISTINCT a.tanggal) as total_hari_diabsen,
        MIN(a.tanggal) as tanggal_pertama,
        MAX(a.tanggal) as tanggal_terakhir
      FROM absensi_siswa a
      WHERE a.tahun_pelajaran = ?1 AND a.semester = ?2
      GROUP BY a.kelas_id
      ORDER BY a.kelas_id ASC;
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
