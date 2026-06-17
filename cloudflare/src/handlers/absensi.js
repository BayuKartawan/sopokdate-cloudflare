// handlers/absensi.js
import { jsonResponse, errorResponse } from "../utils.js";

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi — Ambil daftar siswa beserta absensi
// ---------------------------------------------------------------------------
export async function handleGetAbsensi(request, env) {
  const url = new URL(request.url);
  const tanggal = url.searchParams.get("tanggal");
  const kelasId = url.searchParams.get("kelas_id");

  if (!tanggal || !kelasId) {
    return errorResponse("Parameter 'tanggal' dan 'kelas_id' diperlukan");
  }

  try {
    const query = `
      SELECT 
        s.id as siswa_id, 
        s.nama, 
        s.nisn, 
        s.nis_lokal,
        a.status, 
        a.keterangan
      FROM data_siswa s
      LEFT JOIN absensi_siswa a 
        ON s.id = a.siswa_id AND a.tanggal = ?1
      WHERE s.kelas = ?2
      ORDER BY s.nama ASC;
    `;
    const result = await env.DB.prepare(query).bind(tanggal, kelasId).all();
    return jsonResponse(result.results);
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/absensi — Simpan batch absensi siswa (Upsert)
// ---------------------------------------------------------------------------
export async function handlePostAbsensi(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { tanggal, kelas_id, tahun_pelajaran, semester, data, input_by } = body;

  if (!tanggal || !kelas_id || !tahun_pelajaran || !semester) {
    return errorResponse("Parameter 'tanggal', 'kelas_id', 'tahun_pelajaran', dan 'semester' wajib diisi");
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return errorResponse("Parameter 'data' harus berupa array kehadiran siswa");
  }

  try {
    const statements = [];
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
          parseInt(siswa_id),
          kelas_id,
          status || "H",
          keterangan || "",
          tahun_pelajaran,
          semester,
          input_by ? parseInt(input_by) : null
        )
      );
    }

    await env.DB.batch(statements);

    return jsonResponse({
      success: true,
      message: "Absensi berhasil disimpan",
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi/rekap — Rekap statistik kehadiran per semester
// ---------------------------------------------------------------------------
export async function handleGetAbsensiRekap(request, env) {
  const url = new URL(request.url);
  const kelasId = url.searchParams.get("kelas_id");
  const tahunPelajaran = url.searchParams.get("tahun_pelajaran");
  const semester = url.searchParams.get("semester");

  if (!kelasId || !tahunPelajaran || !semester) {
    return errorResponse("Parameter 'kelas_id', 'tahun_pelajaran', dan 'semester' diperlukan");
  }

  try {
    const query = `
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
      FROM data_siswa s
      LEFT JOIN absensi_siswa a ON s.id = a.siswa_id
        AND a.kelas_id = ?1 
        AND a.tahun_pelajaran = ?2 
        AND a.semester = ?3
      WHERE s.kelas = ?1
      GROUP BY s.id, s.nama, s.nisn, s.nis_lokal
      ORDER BY s.nama ASC;
    `;
    const result = await env.DB.prepare(query).bind(kelasId, tahunPelajaran, semester).all();
    return jsonResponse(result.results);
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
