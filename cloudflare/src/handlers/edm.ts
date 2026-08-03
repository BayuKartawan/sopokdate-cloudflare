// handlers/edm.ts
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";

// ---------------------------------------------------------------------------
// Helper
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

const KELOMPOK_NAMES = ["A", "B", "C", "D", "E"];

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
      // Insert new + auto-create 5 kelompok
      statements.push(
        env.DB.prepare(
          `INSERT INTO edm_tahun_anggaran (tahun, is_active, juknis) VALUES (?1, ?2, ?3)`,
        ).bind(tahun, is_active ?? 0, juknis || ""),
      );
    }

    await env.DB.batch(statements);

    // Jika baru dibuat, buat 5 kelompok otomatis
    if (!id) {
      const inserted = await env.DB.prepare(
        "SELECT id FROM edm_tahun_anggaran WHERE tahun = ?1",
      )
        .bind(tahun)
        .first<{ id: number }>();

      if (inserted) {
        const kelompokStatements: D1PreparedStatement[] = [];
        for (const name of KELOMPOK_NAMES) {
          kelompokStatements.push(
            env.DB.prepare(
              `INSERT OR IGNORE INTO edm_kelompok (tahun_anggaran_id, nama_kelompok) VALUES (?1, ?2)`,
            ).bind(inserted.id, name),
          );
        }
        await env.DB.batch(kelompokStatements);
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
// GET /api/edm/kelompok?tahun_anggaran_id=X
// ---------------------------------------------------------------------------
export async function handleGetEdmKelompok(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    // Ambil kelompok
    const kelompokResult = await env.DB.prepare(
      `SELECT * FROM edm_kelompok WHERE tahun_anggaran_id = ?1 ORDER BY nama_kelompok ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

    // Ambil anggota setiap kelompok
    const kelompokIds = kelompokResult.results.map((k: any) => k.id);

    if (kelompokIds.length === 0) {
      return jsonResponse([]);
    }

    const placeholders = kelompokIds.map(() => "?").join(",");
    const anggotaResult = await env.DB.prepare(
      `SELECT ak.*, g.nama_lengkap, g.mata_pelajaran, g.tugas
       FROM edm_anggota_kelompok ak
       INNER JOIN data_gtk g ON ak.gtk_id = g.id
       WHERE ak.kelompok_id IN (${placeholders})
       ORDER BY g.nama_lengkap ASC`,
    )
      .bind(...kelompokIds)
      .all();

    // Group anggota by kelompok_id
    const anggotaMap: Record<number, any[]> = {};
    for (const a of anggotaResult.results as any[]) {
      if (!anggotaMap[a.kelompok_id]) anggotaMap[a.kelompok_id] = [];
      anggotaMap[a.kelompok_id].push(a);
    }

    const result = kelompokResult.results.map((k: any) => ({
      ...k,
      anggota: anggotaMap[k.id] || [],
    }));

    return jsonResponse(result);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/edm/kelompok — Simpan pembagian kelompok (batch)
// body: { tahun_anggaran_id, kelompok: [ { nama_kelompok: "A", gtk_ids: [1,2,3] }, ... ] }
// ---------------------------------------------------------------------------
export async function handlePostEdmKelompok(
  request: Request,
  env: Env,
): Promise<Response> {
  const user = getRequestUser(request);
  if (user.role !== "admin") {
    return errorResponse("Hanya admin yang dapat membagi kelompok EDM", 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { tahun_anggaran_id, kelompok } = body as {
    tahun_anggaran_id?: number;
    kelompok?: Array<{ nama_kelompok: string; gtk_ids: number[] }>;
  };

  if (!tahun_anggaran_id || !kelompok || !Array.isArray(kelompok)) {
    return errorResponse("Field 'tahun_anggaran_id' dan 'kelompok' wajib diisi");
  }

  try {
    // Validasi: cek duplikat gtk_id antar kelompok
    const allGtkIds = new Set<number>();
    for (const k of kelompok) {
      for (const gtkId of k.gtk_ids) {
        if (allGtkIds.has(gtkId)) {
          return errorResponse(
            `Guru dengan ID ${gtkId} sudah ada di kelompok lain. Satu guru hanya boleh masuk satu kelompok.`,
          );
        }
        allGtkIds.add(gtkId);
      }
    }

    // Ambil kelompok_id berdasarkan tahun
    const kelompokResult = await env.DB.prepare(
      `SELECT id, nama_kelompok FROM edm_kelompok WHERE tahun_anggaran_id = ?1`,
    )
      .bind(tahun_anggaran_id)
      .all();

    const kelompokMap: Record<string, number> = {};
    for (const k of kelompokResult.results as any[]) {
      kelompokMap[k.nama_kelompok] = k.id;
    }

    const statements: D1PreparedStatement[] = [];

    // Hapus semua anggota kelompok existing untuk tahun ini
    for (const k of kelompokResult.results as any[]) {
      statements.push(
        env.DB.prepare("DELETE FROM edm_anggota_kelompok WHERE kelompok_id = ?1").bind(
          k.id,
        ),
      );
    }

    // Insert anggota baru
    for (const k of kelompok) {
      const kelompokId = kelompokMap[k.nama_kelompok];
      if (!kelompokId) continue;

      for (const gtkId of k.gtk_ids) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO edm_anggota_kelompok (kelompok_id, gtk_id) VALUES (?1, ?2)`,
          ).bind(kelompokId, gtkId),
        );
      }
    }

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return jsonResponse({
      success: true,
      message: "Pembagian kelompok EDM berhasil disimpan",
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/edm/indikator?tahun_anggaran_id=X&kelompok_target=A
// ---------------------------------------------------------------------------
export async function handleGetEdmIndikator(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");
  const kelompokTarget = url.searchParams.get("kelompok_target");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    let query: string;
    let stmt: D1PreparedStatement;

    if (kelompokTarget) {
      query = `SELECT * FROM edm_indikator 
               WHERE tahun_anggaran_id = ?1 AND kelompok_target = ?2
               ORDER BY nomor_urut ASC`;
      stmt = env.DB.prepare(query).bind(parseInt(tahunAnggaranId), kelompokTarget);
    } else {
      query = `SELECT * FROM edm_indikator 
               WHERE tahun_anggaran_id = ?1
               ORDER BY kelompok_target ASC, nomor_urut ASC`;
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
// body bisa single: { tahun_anggaran_id, ... }
// atau batch: { tahun_anggaran_id, items: [...] }
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
        (tahun_anggaran_id, kelompok_target, nomor_urut, komponen, sub_komponen, pertanyaan, bukti_yang_diminta, pilihan, keterangan)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `;

    if (items && Array.isArray(items)) {
      // Batch import
      for (const item of items) {
        statements.push(
          env.DB.prepare(insertQuery).bind(
            tahun_anggaran_id,
            item.kelompok_target || "A",
            item.nomor_urut || 0,
            item.komponen || "",
            item.sub_komponen || "",
            item.pertanyaan || "",
            item.bukti_yang_diminta || "",
            typeof item.pilihan === "string"
              ? item.pilihan
              : JSON.stringify(item.pilihan || []),
            item.keterangan || "",
          ),
        );
      }
    } else {
      // Single insert
      const {
        kelompok_target,
        nomor_urut,
        komponen,
        sub_komponen,
        pertanyaan,
        bukti_yang_diminta,
        pilihan,
        keterangan,
      } = body;

      if (!pertanyaan) {
        return errorResponse("Field 'pertanyaan' wajib diisi");
      }

      statements.push(
        env.DB.prepare(insertQuery).bind(
          tahun_anggaran_id,
          kelompok_target || "A",
          nomor_urut || 0,
          komponen || "",
          sub_komponen || "",
          pertanyaan,
          bukti_yang_diminta || "",
          typeof pilihan === "string" ? pilihan : JSON.stringify(pilihan || []),
          keterangan || "",
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
    kelompok_target,
    nomor_urut,
    komponen,
    sub_komponen,
    pertanyaan,
    bukti_yang_diminta,
    pilihan,
    keterangan,
  } = body;

  try {
    await env.DB.prepare(
      `UPDATE edm_indikator SET
         kelompok_target = ?1, nomor_urut = ?2, komponen = ?3, sub_komponen = ?4,
         pertanyaan = ?5, bukti_yang_diminta = ?6, pilihan = ?7, keterangan = ?8,
         updated_at = datetime('now')
       WHERE id = ?9`,
    )
      .bind(
        kelompok_target || "A",
        nomor_urut || 0,
        komponen || "",
        sub_komponen || "",
        pertanyaan || "",
        bukti_yang_diminta || "",
        typeof pilihan === "string" ? pilihan : JSON.stringify(pilihan || []),
        keterangan || "",
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
// GET /api/edm/jawaban?tahun_anggaran_id=X&kelompok_target=A&kelompok_id=Y
// ---------------------------------------------------------------------------
export async function handleGetEdmJawaban(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tahunAnggaranId = url.searchParams.get("tahun_anggaran_id");
  const kelompokTarget = url.searchParams.get("kelompok_target");
  const kelompokId = url.searchParams.get("kelompok_id");

  if (!tahunAnggaranId) {
    return errorResponse("Parameter 'tahun_anggaran_id' diperlukan");
  }

  try {
    let query: string;
    let params: any[];

    if (kelompokId) {
      query = `
        SELECT j.*, i.pertanyaan, i.komponen, i.sub_komponen, i.bukti_yang_diminta,
               i.pilihan, i.keterangan AS keterangan_indikator, i.nomor_urut, i.kelompok_target,
               g.nama_lengkap AS updated_by_nama
        FROM edm_jawaban j
        INNER JOIN edm_indikator i ON j.indikator_id = i.id
        LEFT JOIN data_gtk g ON j.gtk_id = g.id
        WHERE i.tahun_anggaran_id = ?1 AND j.kelompok_id = ?2
        ORDER BY i.nomor_urut ASC
      `;
      params = [parseInt(tahunAnggaranId), parseInt(kelompokId)];
    } else if (kelompokTarget) {
      query = `
        SELECT j.*, i.pertanyaan, i.komponen, i.sub_komponen, i.bukti_yang_diminta,
               i.pilihan, i.keterangan AS keterangan_indikator, i.nomor_urut, i.kelompok_target,
               g.nama_lengkap AS updated_by_nama
        FROM edm_jawaban j
        INNER JOIN edm_indikator i ON j.indikator_id = i.id
        LEFT JOIN data_gtk g ON j.gtk_id = g.id
        WHERE i.tahun_anggaran_id = ?1 AND i.kelompok_target = ?2
        ORDER BY i.nomor_urut ASC
      `;
      params = [parseInt(tahunAnggaranId), kelompokTarget];
    } else {
      query = `
        SELECT j.*, i.pertanyaan, i.komponen, i.sub_komponen, i.bukti_yang_diminta,
               i.pilihan, i.keterangan AS keterangan_indikator, i.nomor_urut, i.kelompok_target,
               g.nama_lengkap AS updated_by_nama
        FROM edm_jawaban j
        INNER JOIN edm_indikator i ON j.indikator_id = i.id
        LEFT JOIN data_gtk g ON j.gtk_id = g.id
        WHERE i.tahun_anggaran_id = ?1
        ORDER BY i.kelompok_target ASC, i.nomor_urut ASC
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
// POST /api/edm/jawaban — Simpan batch jawaban per kelompok (Synced)
// body: { kelompok_id, gtk_id, jawaban: [ { indikator_id, skor, jawaban_text, bukti_url, bukti_filename }, ... ] }
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

  const { kelompok_id, gtk_id, jawaban } = body as {
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

  if (!kelompok_id || !jawaban || !Array.isArray(jawaban)) {
    return errorResponse(
      "Field 'kelompok_id' dan 'jawaban' (array) wajib diisi",
    );
  }

  // Jika bukan admin, pastikan guru adalah anggota kelompok ini
  if (user.role !== "admin" && gtk_id) {
    const membership = await env.DB.prepare(
      "SELECT id FROM edm_anggota_kelompok WHERE kelompok_id = ?1 AND gtk_id = ?2",
    )
      .bind(kelompok_id, gtk_id)
      .first();

    if (!membership) {
      return errorResponse(
        "Anda bukan anggota kelompok ini. Hubungi admin untuk pembagian kelompok.",
        403,
      );
    }
  }

  try {
    const statements: D1PreparedStatement[] = [];
    const upsertQuery = `
      INSERT INTO edm_jawaban (indikator_id, kelompok_id, gtk_id, skor, jawaban_text, bukti_url, bukti_filename, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
      ON CONFLICT(indikator_id, kelompok_id) DO UPDATE SET
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
          kelompok_id,
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
      message: "Jawaban kelompok EDM berhasil disimpan & tersinkronisasi",
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
    // Per-kelompok summary
    const kelompokSummary = await env.DB.prepare(
      `SELECT 
         k.id AS kelompok_id,
         k.nama_kelompok,
         (SELECT COUNT(*) FROM edm_anggota_kelompok ak WHERE ak.kelompok_id = k.id) AS jumlah_anggota,
         (SELECT COUNT(DISTINCT i.id) FROM edm_indikator i 
          WHERE i.tahun_anggaran_id = k.tahun_anggaran_id AND i.kelompok_target = k.nama_kelompok
         ) AS jumlah_indikator,
         (SELECT COUNT(*) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE j.kelompok_id = k.id AND i.tahun_anggaran_id = k.tahun_anggaran_id AND j.skor IS NOT NULL
         ) AS jumlah_jawaban,
         (SELECT ROUND(AVG(j.skor), 2) FROM edm_jawaban j
          INNER JOIN edm_indikator i ON j.indikator_id = i.id
          WHERE j.kelompok_id = k.id AND i.tahun_anggaran_id = k.tahun_anggaran_id AND j.skor IS NOT NULL
         ) AS rata_rata_skor
       FROM edm_kelompok k
       WHERE k.tahun_anggaran_id = ?1
       ORDER BY k.nama_kelompok ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

    // Overall summary
    const overallSummary = await env.DB.prepare(
      `SELECT 
         (SELECT COUNT(*) FROM edm_indikator WHERE tahun_anggaran_id = ?1) AS total_indikator,
         (SELECT COUNT(DISTINCT j.kelompok_id) FROM edm_jawaban j
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

    // Detail per indikator (skor per kelompok)
    const perIndikator = await env.DB.prepare(
      `SELECT 
         i.id, i.kelompok_target, i.nomor_urut, i.komponen, i.sub_komponen, i.pertanyaan,
         j.skor AS rata_rata_skor,
         j.jawaban_text, j.bukti_url,
         g.nama_lengkap AS updated_by_nama
       FROM edm_indikator i
       LEFT JOIN edm_jawaban j ON j.indikator_id = i.id
       LEFT JOIN data_gtk g ON j.gtk_id = g.id
       WHERE i.tahun_anggaran_id = ?1
       ORDER BY i.kelompok_target ASC, i.nomor_urut ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

    return jsonResponse({
      kelompok: kelompokSummary.results,
      overall: overallSummary,
      per_indikator: perIndikator.results,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
