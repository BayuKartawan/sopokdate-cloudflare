// handlers/literasi.ts
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";

// ---------------------------------------------------------------------------
// Helper: Perhitungan Target Level Otomatis (1 tingkat di atas)
// ---------------------------------------------------------------------------
export function getNextLiterasiLevel(
  level: string | null | undefined,
  subLevel: string | null | undefined,
): { targetLevel: string; targetSubLevel: string | null } {
  if (!level || level === "Intervensi Khusus") {
    const sub = subLevel || "Pemula";
    switch (sub) {
      case "Pemula":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Huruf" };
      case "Huruf":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Kata" };
      case "Kata":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Paragraf" };
      case "Paragraf":
        return { targetLevel: "Intervensi Khusus", targetSubLevel: "Cerita" };
      case "Cerita":
      default:
        return { targetLevel: "Dasar", targetSubLevel: null };
    }
  } else if (level === "Dasar") {
    return { targetLevel: "Cakap", targetSubLevel: null };
  } else if (level === "Cakap") {
    return { targetLevel: "Mahir", targetSubLevel: null };
  } else if (level === "Mahir") {
    return { targetLevel: "Mahir", targetSubLevel: null };
  }
  return { targetLevel: "Dasar", targetSubLevel: null };
}

// Helper to get user info from headers
interface RequestUser {
  role: string;
  gtkId: number | null;
  userName: string | null;
}

function getRequestUser(request: Request): RequestUser {
  const role = request.headers.get("X-User-Role") || "guru";
  const gtkIdHeader = request.headers.get("X-User-Gtk-Id");
  const gtkId = gtkIdHeader ? parseInt(gtkIdHeader, 10) : null;
  const userName = request.headers.get("X-User-Name");
  return { role, gtkId, userName };
}

// ---------------------------------------------------------------------------
// 1. GET /api/literasi/kelas-guru — Daftar kelas yang diampu guru / semua kelas
// ---------------------------------------------------------------------------
export async function handleGetLiterasiKelasGuru(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const guruIdParam = url.searchParams.get("guru_id");
  const user = getRequestUser(request);

  const effectiveGuruId = guruIdParam
    ? parseInt(guruIdParam, 10)
    : user.role === "guru"
      ? user.gtkId
      : null;

  try {
    let result;
    if (effectiveGuruId && user.role !== "admin" && user.role !== "kepala_madrasah") {
      const query = `
        SELECT DISTINCT 
          dk.id_kelas, 
          dk.nama_kelas, 
          dk.tingkat
        FROM alokasi_jam aj
        INNER JOIN data_kelas dk ON aj.kelas_id = dk.id_kelas
        WHERE aj.guru_id = ?1
        ORDER BY dk.tingkat ASC, dk.nama_kelas ASC;
      `;
      result = await env.DB.prepare(query).bind(effectiveGuruId).all();
    } else {
      const query = `
        SELECT 
          id_kelas, 
          nama_kelas, 
          tingkat
        FROM data_kelas
        ORDER BY tingkat ASC, nama_kelas ASC;
      `;
      result = await env.DB.prepare(query).all();
    }

    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// 2. GET /api/literasi/data — Ambil data literasi siswa per kelas
// ---------------------------------------------------------------------------
export async function handleGetDataLiterasi(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kelasId = url.searchParams.get("kelas_id");
  const tapel = url.searchParams.get("tapel");
  const semester = url.searchParams.get("semester");

  if (!kelasId || !tapel || !semester) {
    return errorResponse("Parameter 'kelas_id', 'tapel', dan 'semester' diperlukan");
  }

  try {
    const query = `
      SELECT 
        s.id as siswa_id,
        s.nama,
        s.nisn,
        s.nis_lokal,
        s.jenis_kelamin,
        l.id as literasi_id,
        l.level,
        l.sub_level,
        l.updated_at,
        l.input_by,
        COALESCE(l.updater_name, g.nama_lengkap, 'Administrator') as updater_name
      FROM riwayat_kelas_siswa r
      INNER JOIN data_siswa s ON r.siswa_id = s.id
      LEFT JOIN literasi_siswa l 
        ON s.id = l.siswa_id AND l.tahun_pelajaran = ?2 AND l.semester = ?3
      LEFT JOIN data_gtk g ON l.input_by = g.id
      WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
      ORDER BY s.nama ASC;
    `;

    const result = await env.DB.prepare(query)
      .bind(kelasId, tapel, semester)
      .all();

    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// 3. POST /api/literasi/data — Simpan / update batch data literasi siswa
// ---------------------------------------------------------------------------
export async function handlePostDataLiterasi(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = getRequestUser(request);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { kelas_id, tahun_pelajaran, semester, data } = body;

  if (!kelas_id || !tahun_pelajaran || !semester || !Array.isArray(data)) {
    return errorResponse(
      "Parameter 'kelas_id', 'tahun_pelajaran', 'semester', dan 'data' (array) diperlukan",
    );
  }

  try {
    const statements: D1PreparedStatement[] = [];
    const updaterName = user.userName || (user.role === "admin" ? "Administrator" : null);

    for (const item of data) {
      if (!item.siswa_id || !item.level) continue;

      const subLevel = item.level === "Intervensi Khusus" ? (item.sub_level || "Pemula") : null;
      const inputBy = user.gtkId;

      // 1. Upsert ke literasi_siswa
      const upsertLiterasiSql = `
        INSERT INTO literasi_siswa (siswa_id, kelas_id, tahun_pelajaran, semester, level, sub_level, input_by, updater_name, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
        ON CONFLICT(siswa_id, tahun_pelajaran, semester) DO UPDATE SET
          kelas_id = excluded.kelas_id,
          level = excluded.level,
          sub_level = excluded.sub_level,
          input_by = excluded.input_by,
          updater_name = excluded.updater_name,
          updated_at = datetime('now');
      `;
      statements.push(
        env.DB.prepare(upsertLiterasiSql).bind(
          item.siswa_id,
          kelas_id,
          tahun_pelajaran,
          semester,
          item.level,
          subLevel,
          inputBy,
          updaterName,
        ),
      );

      // 2. Hitung target otomatis 1 tingkat di atas
      const autoTarget = getNextLiterasiLevel(item.level, subLevel);

      // 3. Upsert ke target_literasi_siswa HANYA jika target belum di-set custom (is_custom = 0 atau belum ada record)
      const upsertTargetSql = `
        INSERT INTO target_literasi_siswa (siswa_id, kelas_id, tahun_pelajaran, semester, target_level, target_sub_level, is_custom, input_by, updater_name, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8, datetime('now'))
        ON CONFLICT(siswa_id, tahun_pelajaran, semester) DO UPDATE SET
          kelas_id = excluded.kelas_id,
          target_level = CASE WHEN target_literasi_siswa.is_custom = 1 THEN target_literasi_siswa.target_level ELSE excluded.target_level END,
          target_sub_level = CASE WHEN target_literasi_siswa.is_custom = 1 THEN target_literasi_siswa.target_sub_level ELSE excluded.target_sub_level END,
          input_by = CASE WHEN target_literasi_siswa.is_custom = 1 THEN target_literasi_siswa.input_by ELSE excluded.input_by END,
          updater_name = CASE WHEN target_literasi_siswa.is_custom = 1 THEN target_literasi_siswa.updater_name ELSE excluded.updater_name END,
          updated_at = CASE WHEN target_literasi_siswa.is_custom = 1 THEN target_literasi_siswa.updated_at ELSE datetime('now') END;
      `;
      statements.push(
        env.DB.prepare(upsertTargetSql).bind(
          item.siswa_id,
          kelas_id,
          tahun_pelajaran,
          semester,
          autoTarget.targetLevel,
          autoTarget.targetSubLevel,
          inputBy,
          updaterName,
        ),
      );
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({
      success: true,
      message: `Berhasil menyimpan data literasi untuk ${data.length} siswa`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// 4. GET /api/literasi/target — Ambil data target literasi siswa per kelas
// ---------------------------------------------------------------------------
export async function handleGetTargetLiterasi(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kelasId = url.searchParams.get("kelas_id");
  const tapel = url.searchParams.get("tapel");
  const semester = url.searchParams.get("semester");

  if (!kelasId || !tapel || !semester) {
    return errorResponse("Parameter 'kelas_id', 'tapel', dan 'semester' diperlukan");
  }

  try {
    const query = `
      SELECT 
        s.id as siswa_id,
        s.nama,
        s.nisn,
        s.nis_lokal,
        s.jenis_kelamin,
        l.level as current_level,
        l.sub_level as current_sub_level,
        t.id as target_id,
        t.target_level,
        t.target_sub_level,
        COALESCE(t.is_custom, 0) as is_custom,
        t.updated_at,
        t.input_by,
        COALESCE(t.updater_name, g.nama_lengkap, 'Administrator') as updater_name
      FROM riwayat_kelas_siswa r
      INNER JOIN data_siswa s ON r.siswa_id = s.id
      LEFT JOIN literasi_siswa l 
        ON s.id = l.siswa_id AND l.tahun_pelajaran = ?2 AND l.semester = ?3
      LEFT JOIN target_literasi_siswa t 
        ON s.id = t.siswa_id AND t.tahun_pelajaran = ?2 AND t.semester = ?3
      LEFT JOIN data_gtk g ON t.input_by = g.id
      WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
      ORDER BY s.nama ASC;
    `;

    const result = await env.DB.prepare(query)
      .bind(kelasId, tapel, semester)
      .all();

    // Pastikan jika target_level masih kosong tapi ada current_level, di-compute default target otomatisnya
    const mapped = (result.results || []).map((row: any) => {
      if (!row.target_level) {
        const auto = getNextLiterasiLevel(row.current_level, row.current_sub_level);
        return {
          ...row,
          target_level: auto.targetLevel,
          target_sub_level: auto.targetSubLevel,
          is_custom: 0,
        };
      }
      return row;
    });

    return jsonResponse(mapped);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// 5. POST /api/literasi/target — Simpan / update batch target literasi
// ---------------------------------------------------------------------------
export async function handlePostTargetLiterasi(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = getRequestUser(request);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { kelas_id, tahun_pelajaran, semester, data } = body;

  if (!kelas_id || !tahun_pelajaran || !semester || !Array.isArray(data)) {
    return errorResponse(
      "Parameter 'kelas_id', 'tahun_pelajaran', 'semester', dan 'data' (array) diperlukan",
    );
  }

  try {
    const statements: D1PreparedStatement[] = [];
    const updaterName = user.userName || (user.role === "admin" ? "Administrator" : null);

    for (const item of data) {
      if (!item.siswa_id || !item.target_level) continue;

      const subLevel =
        item.target_level === "Intervensi Khusus"
          ? item.target_sub_level || "Pemula"
          : null;
      const isCustom = item.is_custom ? 1 : 0;
      const inputBy = user.gtkId;

      const upsertTargetSql = `
        INSERT INTO target_literasi_siswa (siswa_id, kelas_id, tahun_pelajaran, semester, target_level, target_sub_level, is_custom, input_by, updater_name, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))
        ON CONFLICT(siswa_id, tahun_pelajaran, semester) DO UPDATE SET
          kelas_id = excluded.kelas_id,
          target_level = excluded.target_level,
          target_sub_level = excluded.target_sub_level,
          is_custom = excluded.is_custom,
          input_by = excluded.input_by,
          updater_name = excluded.updater_name,
          updated_at = datetime('now');
      `;

      statements.push(
        env.DB.prepare(upsertTargetSql).bind(
          item.siswa_id,
          kelas_id,
          tahun_pelajaran,
          semester,
          item.target_level,
          subLevel,
          isCustom,
          inputBy,
          updaterName,
        ),
      );
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({
      success: true,
      message: `Berhasil menyimpan target literasi untuk ${data.length} siswa`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// 6. GET /api/literasi/rekap — Rekap data literasi & target literasi
// ---------------------------------------------------------------------------
export async function handleGetRekapLiterasi(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kelasId = url.searchParams.get("kelas_id");
  const tapel = url.searchParams.get("tapel");
  const semester = url.searchParams.get("semester");

  if (!kelasId || !tapel || !semester) {
    return errorResponse("Parameter 'kelas_id', 'tapel', dan 'semester' diperlukan");
  }

  try {
    // Ambil daftar detail per siswa
    const detailQuery = `
      SELECT 
        s.id as siswa_id,
        s.nama,
        s.nisn,
        s.nis_lokal,
        s.jenis_kelamin,
        l.level as current_level,
        l.sub_level as current_sub_level,
        l.updated_at as data_updated_at,
        COALESCE(l.updater_name, g1.nama_lengkap, 'Administrator') as data_updater,
        t.target_level,
        t.target_sub_level,
        COALESCE(t.is_custom, 0) as is_custom,
        t.updated_at as target_updated_at,
        COALESCE(t.updater_name, g2.nama_lengkap, 'Administrator') as target_updater
      FROM riwayat_kelas_siswa r
      INNER JOIN data_siswa s ON r.siswa_id = s.id
      LEFT JOIN literasi_siswa l 
        ON s.id = l.siswa_id AND l.tahun_pelajaran = ?2 AND l.semester = ?3
      LEFT JOIN data_gtk g1 ON l.input_by = g1.id
      LEFT JOIN target_literasi_siswa t 
        ON s.id = t.siswa_id AND t.tahun_pelajaran = ?2 AND t.semester = ?3
      LEFT JOIN data_gtk g2 ON t.input_by = g2.id
      WHERE r.kelas_id = ?1 AND r.tahun_pelajaran = ?2
      ORDER BY s.nama ASC;
    `;

    const detailResult = await env.DB.prepare(detailQuery)
      .bind(kelasId, tapel, semester)
      .all();

    const students = detailResult.results || [];

    // Agregasi statistik Data Literasi Saat Ini
    const dataStats = {
      intervensi_khusus: 0,
      intervensi_khusus_pemula: 0,
      intervensi_khusus_huruf: 0,
      intervensi_khusus_kata: 0,
      intervensi_khusus_paragraf: 0,
      intervensi_khusus_cerita: 0,
      dasar: 0,
      cakap: 0,
      mahir: 0,
      belum_dinilai: 0,
      total: students.length,
    };

    // Agregasi statistik Target Literasi
    const targetStats = {
      intervensi_khusus: 0,
      intervensi_khusus_pemula: 0,
      intervensi_khusus_huruf: 0,
      intervensi_khusus_kata: 0,
      intervensi_khusus_paragraf: 0,
      intervensi_khusus_cerita: 0,
      dasar: 0,
      cakap: 0,
      mahir: 0,
      belum_ditarget: 0,
      total: students.length,
    };

    for (const item of students as any[]) {
      // Hitung current
      if (!item.current_level) {
        dataStats.belum_dinilai++;
      } else if (item.current_level === "Intervensi Khusus") {
        dataStats.intervensi_khusus++;
        const sub = item.current_sub_level || "Pemula";
        if (sub === "Pemula") dataStats.intervensi_khusus_pemula++;
        else if (sub === "Huruf") dataStats.intervensi_khusus_huruf++;
        else if (sub === "Kata") dataStats.intervensi_khusus_kata++;
        else if (sub === "Paragraf") dataStats.intervensi_khusus_paragraf++;
        else if (sub === "Cerita") dataStats.intervensi_khusus_cerita++;
      } else if (item.current_level === "Dasar") {
        dataStats.dasar++;
      } else if (item.current_level === "Cakap") {
        dataStats.cakap++;
      } else if (item.current_level === "Mahir") {
        dataStats.mahir++;
      }

      // Hitung target (jika target_level kosong, fallback ke target otomatis dari current)
      let effectiveTargetLevel = item.target_level;
      let effectiveTargetSubLevel = item.target_sub_level;
      if (!effectiveTargetLevel && item.current_level) {
        const auto = getNextLiterasiLevel(item.current_level, item.current_sub_level);
        effectiveTargetLevel = auto.targetLevel;
        effectiveTargetSubLevel = auto.targetSubLevel;
      }

      if (!effectiveTargetLevel) {
        targetStats.belum_ditarget++;
      } else if (effectiveTargetLevel === "Intervensi Khusus") {
        targetStats.intervensi_khusus++;
        const sub = effectiveTargetSubLevel || "Pemula";
        if (sub === "Pemula") targetStats.intervensi_khusus_pemula++;
        else if (sub === "Huruf") targetStats.intervensi_khusus_huruf++;
        else if (sub === "Kata") targetStats.intervensi_khusus_kata++;
        else if (sub === "Paragraf") targetStats.intervensi_khusus_paragraf++;
        else if (sub === "Cerita") targetStats.intervensi_khusus_cerita++;
      } else if (effectiveTargetLevel === "Dasar") {
        targetStats.dasar++;
      } else if (effectiveTargetLevel === "Cakap") {
        targetStats.cakap++;
      } else if (effectiveTargetLevel === "Mahir") {
        targetStats.mahir++;
      }
    }

    return jsonResponse({
      students,
      stats: {
        data: dataStats,
        target: targetStats,
      },
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
