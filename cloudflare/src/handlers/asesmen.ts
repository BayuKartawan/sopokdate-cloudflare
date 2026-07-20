// handlers/asesmen.ts
import { jsonResponse, errorResponse, getCurrentAcademicYear } from "../utils";
import type { Env } from "../types";

// Helper to check if a semester/tapel is active (current)
function isCurrentSemester(tapel: string, semester: string): boolean {
  const now = new Date();
  const witaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // WITA (UTC+8)
  const year = witaTime.getUTCFullYear();
  const month = witaTime.getUTCMonth() + 1;

  let currentTapel = "";
  if (month >= 7 && month <= 12) {
    currentTapel = `${year}/${year + 1}`;
  } else {
    currentTapel = `${year - 1}/${year}`;
  }

  const currentSemester = (month >= 7 && month <= 12) ? "Ganjil" : "Genap";

  return tapel === currentTapel && semester === currentSemester;
}

// Helper to get user info from headers
interface RequestUser {
  role: string;
  gtkId: number | null;
}

function getRequestUser(request: Request): RequestUser {
  const role = request.headers.get("X-User-Role") || "guru";
  const gtkIdHeader = request.headers.get("X-User-Gtk-Id");
  const gtkId = gtkIdHeader ? parseInt(gtkIdHeader) : null;
  return { role, gtkId };
}

// ---------------------------------------------------------------------------
// Handler: GET /api/asesmen/mapel-guru — Ambil daftar mapel+kelas yang diampu guru
// ---------------------------------------------------------------------------
export async function handleGetMapelGuru(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const guruId = url.searchParams.get("guru_id");

  try {
    let query: string;
    let stmt: D1PreparedStatement;

    if (guruId) {
      // Guru: hanya mapel yang diampu
      query = `
        SELECT 
          aj.id as alokasi_id,
          aj.kelas_id,
          aj.mapel_id,
          aj.guru_id,
          aj.jam_mengajar,
          k.nama_mapel,
          k.kode_mapel,
          dk.nama_kelas,
          g.nama_lengkap as nama_guru
        FROM alokasi_jam aj
        INNER JOIN kurikulum k ON aj.mapel_id = k.id
        INNER JOIN data_kelas dk ON aj.kelas_id = dk.id_kelas
        INNER JOIN data_gtk g ON aj.guru_id = g.id
        WHERE aj.guru_id = ?1
        ORDER BY k.nama_mapel ASC, dk.nama_kelas ASC;
      `;
      stmt = env.DB.prepare(query).bind(parseInt(guruId));
    } else {
      // Admin: semua alokasi
      query = `
        SELECT 
          aj.id as alokasi_id,
          aj.kelas_id,
          aj.mapel_id,
          aj.guru_id,
          aj.jam_mengajar,
          k.nama_mapel,
          k.kode_mapel,
          dk.nama_kelas,
          g.nama_lengkap as nama_guru
        FROM alokasi_jam aj
        INNER JOIN kurikulum k ON aj.mapel_id = k.id
        INNER JOIN data_kelas dk ON aj.kelas_id = dk.id_kelas
        INNER JOIN data_gtk g ON aj.guru_id = g.id
        ORDER BY g.nama_lengkap ASC, k.nama_mapel ASC, dk.nama_kelas ASC;
      `;
      stmt = env.DB.prepare(query);
    }

    const result = await stmt.all();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/asesmen/jenis — Ambil daftar jenis asesmen
// ---------------------------------------------------------------------------
export async function handleGetJenisAsesmen(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const guruId = url.searchParams.get("guru_id");
  const mapelId = url.searchParams.get("mapel_id");
  const kelasId = url.searchParams.get("kelas_id");
  const tapel = url.searchParams.get("tapel");
  const semester = url.searchParams.get("semester");

  if (!mapelId || !kelasId || !tapel || !semester) {
    return errorResponse(
      "Parameter 'mapel_id', 'kelas_id', 'tapel', dan 'semester' diperlukan",
    );
  }

  try {
    let query: string;
    let stmt: D1PreparedStatement;

    if (guruId) {
      query = `
        SELECT 
          ja.*,
          (SELECT COUNT(*) FROM nilai_asesmen na WHERE na.jenis_asesmen_id = ja.id) as jumlah_nilai
        FROM jenis_asesmen ja
        WHERE ja.guru_id = ?1 AND ja.mapel_id = ?2 AND ja.kelas_id = ?3
          AND ja.tahun_pelajaran = ?4 AND ja.semester = ?5
        ORDER BY ja.created_at ASC;
      `;
      stmt = env.DB.prepare(query).bind(
        parseInt(guruId),
        parseInt(mapelId),
        kelasId,
        tapel,
        semester,
      );
    } else {
      query = `
        SELECT 
          ja.*,
          g.nama_lengkap as nama_guru,
          (SELECT COUNT(*) FROM nilai_asesmen na WHERE na.jenis_asesmen_id = ja.id) as jumlah_nilai
        FROM jenis_asesmen ja
        INNER JOIN data_gtk g ON ja.guru_id = g.id
        WHERE ja.mapel_id = ?1 AND ja.kelas_id = ?2
          AND ja.tahun_pelajaran = ?3 AND ja.semester = ?4
        ORDER BY ja.created_at ASC;
      `;
      stmt = env.DB.prepare(query).bind(
        parseInt(mapelId),
        kelasId,
        tapel,
        semester,
      );
    }

    const result = await stmt.all();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/asesmen/jenis — Tambah jenis asesmen baru
// ---------------------------------------------------------------------------
export async function handlePostJenisAsesmen(
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

  const { guru_id, mapel_id, kelas_id, nama_asesmen, materi, tahun_pelajaran, semester } =
    body as {
      guru_id?: number;
      mapel_id?: number;
      kelas_id?: string;
      nama_asesmen?: string;
      materi?: string;
      tahun_pelajaran?: string;
      semester?: string;
    };

  if (!guru_id || !mapel_id || !kelas_id || !nama_asesmen || !tahun_pelajaran || !semester) {
    return errorResponse(
      "Field guru_id, mapel_id, kelas_id, nama_asesmen, tahun_pelajaran, dan semester wajib diisi",
    );
  }

  // VALIDASI EDIT LOCK UNTUK GURU
  if (user.role !== "admin" && !isCurrentSemester(tahun_pelajaran, semester)) {
    return errorResponse("Hak edit dikunci: Hanya dapat menambah asesmen pada semester aktif saat ini.", 403);
  }

  // materi is optional during category creation, default to empty string
  const finalMateri = materi ? materi.trim() : "";

  try {
    const query = `
      INSERT INTO jenis_asesmen (guru_id, mapel_id, kelas_id, nama_asesmen, materi, tahun_pelajaran, semester)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7);
    `;

    await env.DB.prepare(query).bind(
      guru_id,
      mapel_id,
      kelas_id,
      nama_asesmen.trim(),
      finalMateri,
      tahun_pelajaran,
      semester,
    ).run();

    return jsonResponse({ success: true, message: "Jenis asesmen berhasil ditambahkan" });
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint")) {
      return errorResponse("Asesmen dengan nama ini sudah ada di kelas dan semester tersebut", 409);
    }
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: DELETE /api/asesmen/jenis/:id — Hapus jenis asesmen
// ---------------------------------------------------------------------------
export async function handleDeleteJenisAsesmen(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  if (!id) {
    return errorResponse("Parameter 'id' diperlukan");
  }

  const user = getRequestUser(request);

  try {
    // Cari data asesmen untuk validasi edit lock
    const target = await env.DB.prepare("SELECT * FROM jenis_asesmen WHERE id = ?1")
      .bind(parseInt(id))
      .first<{ tahun_pelajaran: string; semester: string }>();

    if (!target) {
      return errorResponse("Jenis asesmen tidak ditemukan", 404);
    }

    // VALIDASI EDIT LOCK UNTUK GURU
    if (user.role !== "admin" && !isCurrentSemester(target.tahun_pelajaran, target.semester)) {
      return errorResponse("Hak edit dikunci: Hanya dapat menghapus asesmen pada semester aktif saat ini.", 403);
    }

    await env.DB.prepare("DELETE FROM jenis_asesmen WHERE id = ?1")
      .bind(parseInt(id))
      .run();

    return jsonResponse({ success: true, message: "Jenis asesmen berhasil dihapus" });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/asesmen/nilai — Ambil nilai siswa per jenis asesmen
// ---------------------------------------------------------------------------
export async function handleGetNilai(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const jenisAsesmenId = url.searchParams.get("jenis_asesmen_id");

  if (!jenisAsesmenId) {
    return errorResponse("Parameter 'jenis_asesmen_id' diperlukan");
  }

  try {
    const jaResult = await env.DB.prepare(
      "SELECT * FROM jenis_asesmen WHERE id = ?1",
    )
      .bind(parseInt(jenisAsesmenId))
      .first();

    if (!jaResult) {
      return errorResponse("Jenis asesmen tidak ditemukan", 404);
    }

    const kelasId = (jaResult as any).kelas_id;
    const tapel = (jaResult as any).tahun_pelajaran;

    const query = `
      SELECT 
        s.id as siswa_id,
        s.nama,
        s.nisn,
        s.nis_lokal,
        na.nilai,
        na.catatan
      FROM riwayat_kelas_siswa r
      INNER JOIN data_siswa s ON r.siswa_id = s.id
      LEFT JOIN nilai_asesmen na ON s.id = na.siswa_id AND na.jenis_asesmen_id = ?1
      WHERE r.kelas_id = ?2 AND r.tahun_pelajaran = ?3
      ORDER BY s.nama ASC;
    `;

    const result = await env.DB.prepare(query)
      .bind(parseInt(jenisAsesmenId), kelasId, tapel)
      .all();

    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/asesmen/nilai — Simpan batch nilai siswa (upsert)
// ---------------------------------------------------------------------------
export async function handlePostNilai(
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

  const { jenis_asesmen_id, materi, data } = body as {
    jenis_asesmen_id?: number;
    materi?: string;
    data?: Array<{
      siswa_id: number;
      nilai?: number | null;
      catatan?: string;
    }>;
  };

  if (!jenis_asesmen_id) {
    return errorResponse("Parameter 'jenis_asesmen_id' wajib diisi");
  }

  if (materi === undefined || materi === null || !materi.trim()) {
    return errorResponse("Cakupan materi wajib diisi");
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return errorResponse("Parameter 'data' harus berupa array nilai siswa");
  }

  try {
    // Cari data asesmen untuk validasi edit lock
    const target = await env.DB.prepare("SELECT * FROM jenis_asesmen WHERE id = ?1")
      .bind(jenis_asesmen_id)
      .first<{ tahun_pelajaran: string; semester: string }>();

    if (!target) {
      return errorResponse("Jenis asesmen tidak ditemukan", 404);
    }

    // VALIDASI EDIT LOCK UNTUK GURU
    if (user.role !== "admin" && !isCurrentSemester(target.tahun_pelajaran, target.semester)) {
      return errorResponse("Hak edit dikunci: Hanya dapat mengubah nilai pada semester aktif saat ini.", 403);
    }

    const statements: D1PreparedStatement[] = [];

    // Tambahkan statement untuk update cakupan materi asesmen
    statements.push(
      env.DB.prepare("UPDATE jenis_asesmen SET materi = ?2, updated_at = datetime('now') WHERE id = ?1")
        .bind(jenis_asesmen_id, materi.trim())
    );

    const upsertQuery = `
      INSERT INTO nilai_asesmen (jenis_asesmen_id, siswa_id, nilai, catatan, updated_at)
      VALUES (?1, ?2, ?3, ?4, datetime('now'))
      ON CONFLICT(jenis_asesmen_id, siswa_id) DO UPDATE SET
        nilai = excluded.nilai,
        catatan = excluded.catatan,
        updated_at = datetime('now');
    `;

    const stmt = env.DB.prepare(upsertQuery);

    for (const row of data) {
      statements.push(
        stmt.bind(
          jenis_asesmen_id,
          row.siswa_id,
          row.nilai !== undefined && row.nilai !== null ? row.nilai : null,
          row.catatan || "",
        ),
      );
    }

    await env.DB.batch(statements);

    return jsonResponse({
      success: true,
      message: "Nilai asesmen berhasil disimpan",
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
