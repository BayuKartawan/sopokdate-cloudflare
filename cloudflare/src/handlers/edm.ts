// handlers/edm.ts
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";

// ---------------------------------------------------------------------------
// Helper & Constants
// ---------------------------------------------------------------------------
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

export const EDM_BAGIAN_LIST = [
  { code: "A", name: "Bagian A: Aspek Budaya Kedisiplinan bagi Warga Madrasah", title: "Aspek Budaya Kedisiplinan bagi Warga Madrasah" },
  { code: "B", name: "Bagian B: Aspek Budaya Melakukan Pengembangan Diri bagi Guru dan Tenaga Kependidikan", title: "Aspek Budaya Melakukan Pengembangan Diri bagi Guru dan Tenaga Kependidikan" },
  { code: "C", name: "Bagian C: Aspek Budaya Guru Melakukan Penyiapan, Pelaksanaan dan Penilaian Atas Proses Pembelajaran", title: "Aspek Budaya Guru Melakukan Penyiapan, Pelaksanaan dan Penilaian Atas Proses Pembelajaran" },
  { code: "D", name: "Bagian D: Aspek Budaya Madrasah Menyediakan Sarana Belajar untuk Guru dan Siswa", title: "Aspek Budaya Madrasah Menyediakan Sarana Belajar untuk Guru dan Siswa" },
  { code: "E", name: "Bagian E: Aspek Budaya Madrasah Melakukan Pengelolaan Anggaran yang Transparan dan Berorientasi pada Peningkatan Mutu", title: "Aspek Budaya Madrasah Melakukan Pengelolaan Anggaran yang Transparan dan Berorientasi pada Peningkatan Mutu" },
];

const BAGIAN_NAMES = ["A", "B", "C", "D", "E"];

// ---------------------------------------------------------------------------
// GET /api/edm/tahun-anggaran
// ---------------------------------------------------------------------------
export async function handleGetEdmTahunAnggaran(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      "SELECT * FROM edm_tahun_anggaran ORDER BY tahun DESC",
    ).all();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/edm/tahun-anggaran — Buat / update tahun anggaran
// ---------------------------------------------------------------------------
export async function handlePostEdmTahunAnggaran(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat mengelola tahun anggaran EDM", 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { id, tahun, is_active, juknis } = body as {
    id?: number;
    tahun?: number;
    is_active?: number;
    juknis?: string;
  };

  if (!tahun) {
    return errorResponse("Field 'tahun' wajib diisi");
  }

  try {
    const statements: D1PreparedStatement[] = [];

    // Jika is_active = 1, nonaktifkan semua yang lain
    if (is_active === 1) {
      statements.push(
        env.DB.prepare(
          "UPDATE edm_tahun_anggaran SET is_active = 0, updated_at = datetime('now')",
        ),
      );
    }

    if (id) {
      // Update existing
      statements.push(
        env.DB.prepare(
          `UPDATE edm_tahun_anggaran 
           SET tahun = ?1, is_active = ?2, juknis = ?3, updated_at = datetime('now')
           WHERE id = ?4`,
        ).bind(tahun, is_active ?? 0, juknis || "", id),
      );
    } else {
      // Insert new + auto-create 5 bagian
      statements.push(
        env.DB.prepare(
          `INSERT INTO edm_tahun_anggaran (tahun, is_active, juknis) VALUES (?1, ?2, ?3)`,
        ).bind(tahun, is_active ?? 0, juknis || ""),
      );
    }

    await env.DB.batch(statements);

    // Jika baru dibuat, buat 5 bagian otomatis
    if (!id) {
      const inserted = await env.DB.prepare(
        "SELECT id FROM edm_tahun_anggaran WHERE tahun = ?1",
      )
        .bind(tahun)
        .first<{ id: number }>();

      if (inserted) {
        const bagianStatements: D1PreparedStatement[] = [];
        for (const name of BAGIAN_NAMES) {
          bagianStatements.push(
            env.DB.prepare(
              `INSERT OR IGNORE INTO edm_bagian (tahun_anggaran_id, nama_bagian) VALUES (?1, ?2)`,
            ).bind(inserted.id, name),
          );
        }
        await env.DB.batch(bagianStatements);
      }
    }

    return jsonResponse({
      success: true,
      message: id
        ? "Tahun anggaran EDM berhasil diperbarui"
        : "Tahun anggaran EDM berhasil dibuat",
    });
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint")) {
      return errorResponse("Tahun anggaran sudah ada", 409);
    }
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/edm/tahun-anggaran/:id
// ---------------------------------------------------------------------------
export async function handleDeleteEdmTahunAnggaran(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat menghapus tahun anggaran EDM", 403);
  }

  try {
    await env.DB.prepare("DELETE FROM edm_tahun_anggaran WHERE id = ?1")
      .bind(parseInt(id))
      .run();
    return jsonResponse({ success: true, message: "Tahun anggaran EDM berhasil dihapus" });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/edm/bagian?tahun_anggaran_id=X
// ---------------------------------------------------------------------------
export async function handleGetEdmBagian(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    // Ambil bagian
    const bagianResult = await env.DB.prepare(
      `SELECT id, tahun_anggaran_id, nama_bagian, nama_bagian AS nama_kelompok, created_at FROM edm_bagian WHERE tahun_anggaran_id = ?1 ORDER BY nama_bagian ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

    // Ambil anggota setiap bagian
    const bagianIds = bagianResult.results.map((b: any) => b.id);

    if (bagianIds.length === 0) {
      return jsonResponse([]);
    }

    const placeholders = bagianIds.map(() => "?").join(",");
    const anggotaResult = await env.DB.prepare(
      `SELECT ab.*, ab.bagian_id AS kelompok_id, g.nama_lengkap, g.mata_pelajaran, g.tugas
       FROM edm_anggota_bagian ab
       INNER JOIN data_gtk g ON ab.gtk_id = g.id
       WHERE ab.bagian_id IN (${placeholders})
       ORDER BY g.nama_lengkap ASC`,
    )
      .bind(...bagianIds)
      .all();

    // Group anggota by bagian_id
    const anggotaMap: Record<number, any[]> = {};
    for (const a of anggotaResult.results as any[]) {
      if (!anggotaMap[a.bagian_id]) anggotaMap[a.bagian_id] = [];
      anggotaMap[a.bagian_id].push(a);
    }

    const result = bagianResult.results.map((b: any) => ({
      ...b,
      anggota: anggotaMap[b.id] || [],
    }));

    return jsonResponse(result);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

export const handleGetEdmKelompok = handleGetEdmBagian;

// ---------------------------------------------------------------------------
// POST /api/edm/bagian — Simpan pembagian bagian (batch)
// body: { tahun_anggaran_id, bagian: [ { nama_bagian: "A", gtk_ids: [1,2,3] }, ... ] }
// ---------------------------------------------------------------------------
export async function handlePostEdmBagian(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat membagi bagian EDM", 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { tahun_anggaran_id, bagian, kelompok } = body as {
    tahun_anggaran_id?: number;
    bagian?: Array<{ nama_bagian?: string; nama_kelompok?: string; gtk_ids: number[] }>;
    kelompok?: Array<{ nama_bagian?: string; nama_kelompok?: string; gtk_ids: number[] }>;
  };

  const listBagian = bagian || kelompok;

  if (!tahun_anggaran_id || !listBagian || !Array.isArray(listBagian)) {
    return errorResponse("Field 'tahun_anggaran_id' dan 'bagian' wajib diisi");
  }

  try {
    // Validasi: cek duplikat gtk_id antar bagian
    const allGtkIds = new Set<number>();
    for (const b of listBagian) {
      for (const gtkId of b.gtk_ids) {
        if (allGtkIds.has(gtkId)) {
          return errorResponse(
            `Guru dengan ID ${gtkId} sudah ada di bagian lain. Satu guru hanya boleh masuk satu bagian.`,
          );
        }
        allGtkIds.add(gtkId);
      }
    }

    // Ambil bagian_id berdasarkan tahun
    const bagianResult = await env.DB.prepare(
      `SELECT id, nama_bagian FROM edm_bagian WHERE tahun_anggaran_id = ?1`,
    )
      .bind(tahun_anggaran_id)
      .all();

    const bagianMap: Record<string, number> = {};
    for (const b of bagianResult.results as any[]) {
      bagianMap[b.nama_bagian] = b.id;
    }

    const statements: D1PreparedStatement[] = [];

    // Hapus semua anggota bagian existing untuk tahun ini
    for (const b of bagianResult.results as any[]) {
      statements.push(
        env.DB.prepare("DELETE FROM edm_anggota_bagian WHERE bagian_id = ?1").bind(
          b.id,
        ),
      );
    }

    // Insert anggota baru
    for (const b of listBagian) {
      const name = b.nama_bagian || b.nama_kelompok;
      if (!name) continue;
      const bagianId = bagianMap[name];
      if (!bagianId) continue;

      for (const gtkId of b.gtk_ids) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO edm_anggota_bagian (bagian_id, gtk_id) VALUES (?1, ?2)`,
          ).bind(bagianId, gtkId),
        );
      }
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({
      success: true,
      message: "Pembagian bagian EDM berhasil disimpan",
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

export const handlePostEdmKelompok = handlePostEdmBagian;

// ---------------------------------------------------------------------------
// GET /api/edm/indikator?tahun_anggaran_id=X&bagian_target=A
// ---------------------------------------------------------------------------
export async function handleGetEdmIndikator(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");
  const bagianTarget = url.searchParams.get("bagian_target") || url.searchParams.get("kelompok_target");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    let query: string;
    let stmt: D1PreparedStatement;

    if (bagianTarget) {
      query = `SELECT *, bagian_target AS kelompok_target FROM edm_indikator 
               WHERE tahun_anggaran_id = ?1 AND bagian_target = ?2
               ORDER BY nomor_urut ASC`;
      stmt = env.DB.prepare(query).bind(parseInt(tahunAnggaranId), bagianTarget);
    } else {
      query = `SELECT *, bagian_target AS kelompok_target FROM edm_indikator 
               WHERE tahun_anggaran_id = ?1
               ORDER BY bagian_target ASC, nomor_urut ASC`;
      stmt = env.DB.prepare(query).bind(parseInt(tahunAnggaranId));
    }

    const result = await stmt.all();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/edm/indikator — Tambah / batch import indikator
// ---------------------------------------------------------------------------
export async function handlePostEdmIndikator(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat mengelola indikator EDM", 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { tahun_anggaran_id, items } = body;

  if (!tahun_anggaran_id) {
    return errorResponse("Field 'tahun_anggaran_id' wajib diisi");
  }

  try {
    const statements: D1PreparedStatement[] = [];
    const insertQuery = `
      INSERT INTO edm_indikator 
        (tahun_anggaran_id, bagian_target, nomor_urut, pertanyaan, bukti_yang_diminta, pilihan)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `;

    if (items && Array.isArray(items)) {
      // Batch import
      for (const item of items) {
        statements.push(
          env.DB.prepare(insertQuery).bind(
            tahun_anggaran_id,
            item.bagian_target || item.kelompok_target || "A",
            item.nomor_urut || 0,
            item.pertanyaan || "",
            item.bukti_yang_diminta || "",
            typeof item.pilihan === "string"
              ? item.pilihan
              : JSON.stringify(item.pilihan || []),
          ),
        );
      }
    } else {
      // Single insert
      const {
        bagian_target,
        kelompok_target,
        nomor_urut,
        pertanyaan,
        bukti_yang_diminta,
        pilihan,
      } = body;

      if (!pertanyaan) {
        return errorResponse("Field 'pertanyaan' wajib diisi");
      }

      statements.push(
        env.DB.prepare(insertQuery).bind(
          tahun_anggaran_id,
          bagian_target || kelompok_target || "A",
          nomor_urut || 0,
          pertanyaan,
          bukti_yang_diminta || "",
          typeof pilihan === "string" ? pilihan : JSON.stringify(pilihan || []),
        ),
      );
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({
      success: true,
      message: `${statements.length} indikator EDM berhasil ditambahkan`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/edm/indikator/:id — Update indikator
// ---------------------------------------------------------------------------
export async function handlePutEdmIndikator(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat mengelola indikator EDM", 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const {
    bagian_target,
    kelompok_target,
    nomor_urut,
    pertanyaan,
    bukti_yang_diminta,
    pilihan,
  } = body;

  try {
    await env.DB.prepare(
      `UPDATE edm_indikator SET
         bagian_target = ?1, nomor_urut = ?2,
         pertanyaan = ?3, bukti_yang_diminta = ?4, pilihan = ?5,
         updated_at = datetime('now')
       WHERE id = ?6`,
    )
      .bind(
        bagian_target || kelompok_target || "A",
        nomor_urut || 0,
        pertanyaan || "",
        bukti_yang_diminta || "",
        typeof pilihan === "string" ? pilihan : JSON.stringify(pilihan || []),
        parseInt(id),
      )
      .run();

    return jsonResponse({ success: true, message: "Indikator EDM berhasil diperbarui" });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/edm/indikator/:id
// ---------------------------------------------------------------------------
export async function handleDeleteEdmIndikator(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat menghapus indikator EDM", 403);
  }

  try {
    await env.DB.prepare("DELETE FROM edm_indikator WHERE id = ?1")
      .bind(parseInt(id))
      .run();
    return jsonResponse({ success: true, message: "Indikator EDM berhasil dihapus" });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/edm/jawaban?tahun_anggaran_id=X&bagian_target=A&bagian_id=Y
// ---------------------------------------------------------------------------
export async function handleGetEdmJawaban(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");
  const bagianTarget = url.searchParams.get("bagian_target") || url.searchParams.get("kelompok_target");
  const bagianId = url.searchParams.get("bagian_id") || url.searchParams.get("kelompok_id");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    let query: string;
    let params: any[];

    if (bagianId) {
      query = `
        SELECT j.*, j.bagian_id AS kelompok_id, i.pertanyaan, i.bukti_yang_diminta,
               i.pilihan, i.nomor_urut, i.bagian_target, i.bagian_target AS kelompok_target,
               g.nama_lengkap AS updated_by_nama
        FROM edm_jawaban j
        INNER JOIN edm_indikator i ON j.indikator_id = i.id
        LEFT JOIN data_gtk g ON j.gtk_id = g.id
        WHERE i.tahun_anggaran_id = ?1 AND j.bagian_id = ?2
        ORDER BY i.nomor_urut ASC
      `;
      params = [parseInt(tahunAnggaranId), parseInt(bagianId)];
    } else if (bagianTarget) {
      query = `
        SELECT j.*, j.bagian_id AS kelompok_id, i.pertanyaan, i.bukti_yang_diminta,
               i.pilihan, i.nomor_urut, i.bagian_target, i.bagian_target AS kelompok_target,
               g.nama_lengkap AS updated_by_nama
        FROM edm_jawaban j
        INNER JOIN edm_indikator i ON j.indikator_id = i.id
        LEFT JOIN data_gtk g ON j.gtk_id = g.id
        WHERE i.tahun_anggaran_id = ?1 AND i.bagian_target = ?2
        ORDER BY i.nomor_urut ASC
      `;
      params = [parseInt(tahunAnggaranId), bagianTarget];
    } else {
      query = `
        SELECT j.*, j.bagian_id AS kelompok_id, i.pertanyaan, i.bukti_yang_diminta,
               i.pilihan, i.nomor_urut, i.bagian_target, i.bagian_target AS kelompok_target,
               g.nama_lengkap AS updated_by_nama
        FROM edm_jawaban j
        INNER JOIN edm_indikator i ON j.indikator_id = i.id
        LEFT JOIN data_gtk g ON j.gtk_id = g.id
        WHERE i.tahun_anggaran_id = ?1
        ORDER BY i.bagian_target ASC, i.nomor_urut ASC
      `;
      params = [parseInt(tahunAnggaranId)];
    }

    const result = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/edm/jawaban — Simpan batch jawaban per bagian (Synced)
// body: { bagian_id, gtk_id, jawaban: [ { indikator_id, skor, jawaban_text, bukti_url, bukti_filename }, ... ] }
// ---------------------------------------------------------------------------
export async function handlePostEdmJawaban(
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

  const { bagian_id, kelompok_id, gtk_id, jawaban } = body as {
    bagian_id?: number;
    kelompok_id?: number;
    gtk_id?: number;
    jawaban?: Array<{
      indikator_id: number;
      skor?: number;
      jawaban_text?: string;
      bukti_url?: string;
      bukti_filename?: string;
    }>;
  };

  const targetBagianId = bagian_id || kelompok_id;

  if (!targetBagianId || !jawaban || !Array.isArray(jawaban)) {
    return errorResponse(
      "Field 'bagian_id' dan 'jawaban' (array) wajib diisi",
    );
  }

  // Jika bukan admin, pastikan guru adalah anggota bagian ini
  if (user.role !== "admin" && gtk_id) {
    const membership = await env.DB.prepare(
      "SELECT id FROM edm_anggota_bagian WHERE bagian_id = ?1 AND gtk_id = ?2",
    )
      .bind(targetBagianId, gtk_id)
      .first();

    if (!membership) {
      return errorResponse(
        "Anda bukan anggota bagian ini. Hubungi admin untuk pembagian bagian.",
        403,
      );
    }
  }

  try {
    const statements: D1PreparedStatement[] = [];
    const upsertQuery = `
      INSERT INTO edm_jawaban (indikator_id, bagian_id, gtk_id, skor, jawaban_text, bukti_url, bukti_filename, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
      ON CONFLICT(indikator_id, bagian_id) DO UPDATE SET
        gtk_id = excluded.gtk_id,
        skor = excluded.skor,
        jawaban_text = excluded.jawaban_text,
        bukti_url = excluded.bukti_url,
        bukti_filename = excluded.bukti_filename,
        updated_at = datetime('now')
    `;

    for (const j of jawaban) {
      statements.push(
        env.DB.prepare(upsertQuery).bind(
          j.indikator_id,
          targetBagianId,
          gtk_id || null,
          j.skor ?? null,
          j.jawaban_text || "",
          j.bukti_url || "",
          j.bukti_filename || "",
        ),
      );
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({
      success: true,
      message: "Jawaban bagian EDM berhasil disimpan & tersinkronisasi",
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/edm/rekap?tahun_anggaran_id=X
// ---------------------------------------------------------------------------
export async function handleGetEdmRekap(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    // Per-bagian summary
    const bagianSummary = await env.DB.prepare(
      `SELECT 
         b.id AS bagian_id,
         b.id AS kelompok_id,
         b.nama_bagian,
         b.nama_bagian AS nama_kelompok,
         (SELECT COUNT(*) FROM edm_anggota_bagian ab WHERE ab.bagian_id = b.id) AS jumlah_anggota,
         (SELECT COUNT(DISTINCT i.id) FROM edm_indikator i 
          WHERE i.tahun_anggaran_id = b.tahun_anggaran_id AND i.bagian_target = b.nama_bagian
         ) AS jumlah_indikator,
         (SELECT COUNT(*) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE j.bagian_id = b.id AND i.tahun_anggaran_id = b.tahun_anggaran_id AND j.skor IS NOT NULL
         ) AS jumlah_jawaban,
         (SELECT ROUND(AVG(j.skor), 2) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE j.bagian_id = b.id AND i.tahun_anggaran_id = b.tahun_anggaran_id AND j.skor IS NOT NULL
         ) AS rata_rata_skor
       FROM edm_bagian b
       WHERE b.tahun_anggaran_id = ?1
       ORDER BY b.nama_bagian ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

    // Overall summary
    const overallSummary = await env.DB.prepare(
      `SELECT 
         (SELECT COUNT(*) FROM edm_indikator WHERE tahun_anggaran_id = ?1) AS total_indikator,
         (SELECT COUNT(DISTINCT j.bagian_id) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE i.tahun_anggaran_id = ?1 AND j.skor IS NOT NULL
         ) AS total_bagian_terisi,
         (SELECT COUNT(DISTINCT j.bagian_id) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE i.tahun_anggaran_id = ?1 AND j.skor IS NOT NULL
         ) AS total_kelompok_terisi,
         (SELECT ROUND(AVG(j.skor), 2) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE i.tahun_anggaran_id = ?1 AND j.skor IS NOT NULL
         ) AS rata_rata_skor_keseluruhan`,
    )
      .bind(parseInt(tahunAnggaranId))
      .first();

    // Detail per indikator
    const perIndikator = await env.DB.prepare(
      `SELECT 
         i.id, i.bagian_target, i.bagian_target AS kelompok_target, i.nomor_urut, i.pertanyaan,
         j.skor AS rata_rata_skor,
         j.jawaban_text, j.bukti_url,
         g.nama_lengkap AS updated_by_nama
       FROM edm_indikator i
       LEFT JOIN edm_jawaban j ON j.indikator_id = i.id
       LEFT JOIN data_gtk g ON j.gtk_id = g.id
       WHERE i.tahun_anggaran_id = ?1
       ORDER BY i.bagian_target ASC, i.nomor_urut ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

    return jsonResponse({
      bagian: bagianSummary.results,
      kelompok: bagianSummary.results,
      overall: overallSummary,
      per_indikator: perIndikator.results,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
