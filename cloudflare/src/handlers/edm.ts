// handlers/edm.ts
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";
import {
  EDM_KATEGORI,
  EDM_BAGIAN_META,
  getAllInstrumen,
  getInstrumenByKategori,
  getInstrumenByKodeSoal,
  getKategoriByKode,
} from "../edm-instrumen";

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

export const EDM_BAGIAN_LIST = EDM_BAGIAN_META;

const BAGIAN_NAMES = ["A", "B", "C", "D", "E"];

// ---------------------------------------------------------------------------
// GET /api/edm/instrumen — Return instrumen dari memory (hardcode)
// ---------------------------------------------------------------------------
export async function handleGetEdmInstrumen(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kategori = url.searchParams.get("kategori") || url.searchParams.get("bagian_target");
  if (kategori) {
    return jsonResponse(getInstrumenByKategori(kategori));
  }
  return jsonResponse(getAllInstrumen());
}

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

    if (is_active === 1) {
      statements.push(
        env.DB.prepare(
          "UPDATE edm_tahun_anggaran SET is_active = 0, updated_at = datetime('now')",
        ),
      );
    }

    if (id) {
      statements.push(
        env.DB.prepare(
          `UPDATE edm_tahun_anggaran 
           SET tahun = ?1, is_active = ?2, juknis = ?3, updated_at = datetime('now')
           WHERE id = ?4`,
        ).bind(tahun, is_active ?? 0, juknis || "", id),
      );
    } else {
      statements.push(
        env.DB.prepare(
          `INSERT INTO edm_tahun_anggaran (tahun, is_active, juknis) VALUES (?1, ?2, ?3)`,
        ).bind(tahun, is_active ?? 0, juknis || ""),
      );
    }

    await env.DB.batch(statements);

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
    const bagianResult = await env.DB.prepare(
      `SELECT id, tahun_anggaran_id, nama_bagian, nama_bagian AS nama_kelompok, created_at FROM edm_bagian WHERE tahun_anggaran_id = ?1 ORDER BY nama_bagian ASC`,
    )
      .bind(parseInt(tahunAnggaranId))
      .all();

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

    for (const b of bagianResult.results as any[]) {
      statements.push(
        env.DB.prepare("DELETE FROM edm_anggota_bagian WHERE bagian_id = ?1").bind(
          b.id,
        ),
      );
    }

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
    let query = `
      SELECT j.*, j.bagian_id AS kelompok_id, g.nama_lengkap AS updated_by_nama
      FROM edm_jawaban j
      INNER JOIN edm_bagian b ON j.bagian_id = b.id
      LEFT JOIN data_gtk g ON j.gtk_id = g.id
      WHERE b.tahun_anggaran_id = ?1
    `;
    const params: any[] = [parseInt(tahunAnggaranId)];

    if (bagianId) {
      query += ` AND j.bagian_id = ?2`;
      params.push(parseInt(bagianId));
    }

    const result = await env.DB.prepare(query).bind(...params).all();
    const rows = result.results as any[];

    // Enrich rows with instrumen details from hardcode module
    const enriched = rows.map((r) => {
      const inst = getInstrumenByKodeSoal(r.kode_soal);
      return {
        ...r,
        pertanyaan: inst?.pertanyaan || "",
        bukti_yang_diminta: inst?.bukti || "",
        pilihan: inst?.pilihan || [],
        nomor_urut: inst?.urutan ? parseInt(inst.urutan) : 0,
        bagian_target: inst?.kategori || "A",
        kelompok_target: inst?.kategori || "A",
        bobot: inst?.bobot || 3,
      };
    });

    if (bagianTarget) {
      return jsonResponse(enriched.filter((item) => item.bagian_target === bagianTarget));
    }

    return jsonResponse(enriched);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/edm/jawaban — Simpan batch jawaban per bagian (Synced)
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
      kode_soal?: string;
      indikator_id?: number | string;
      skor?: number;
      upload_text?: string;
    }>;
  };

  const targetBagianId = bagian_id || kelompok_id;

  if (!targetBagianId || !jawaban || !Array.isArray(jawaban)) {
    return errorResponse(
      "Field 'bagian_id' dan 'jawaban' (array) wajib diisi",
    );
  }

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
      INSERT INTO edm_jawaban (kode_soal, bagian_id, gtk_id, skor, upload_text, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
      ON CONFLICT(kode_soal, bagian_id) DO UPDATE SET
        gtk_id = excluded.gtk_id,
        skor = excluded.skor,
        upload_text = excluded.upload_text,
        updated_at = datetime('now')
    `;

    for (const j of jawaban) {
      const kodeSoal = j.kode_soal || String(j.indikator_id || "");
      if (!kodeSoal) continue;

      statements.push(
        env.DB.prepare(upsertQuery).bind(
          kodeSoal,
          targetBagianId,
          gtk_id || null,
          j.skor ?? null,
          j.upload_text ?? null,
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
    const bagianList = await env.DB.prepare(
      `SELECT b.id AS bagian_id, b.id AS kelompok_id, b.nama_bagian, b.nama_bagian AS nama_kelompok,
              (SELECT COUNT(*) FROM edm_anggota_bagian ab WHERE ab.bagian_id = b.id) AS jumlah_anggota
       FROM edm_bagian b
       WHERE b.tahun_anggaran_id = ?1
       ORDER BY b.nama_bagian ASC`,
    ).bind(parseInt(tahunAnggaranId)).all();

    const jawabanList = await env.DB.prepare(
      `SELECT j.*, g.nama_lengkap AS updated_by_nama
       FROM edm_jawaban j
       INNER JOIN edm_bagian b ON j.bagian_id = b.id
       LEFT JOIN data_gtk g ON j.gtk_id = g.id
       WHERE b.tahun_anggaran_id = ?1`,
    ).bind(parseInt(tahunAnggaranId)).all();

    const buktiList = await env.DB.prepare(
      `SELECT bf.*
       FROM edm_bukti_file bf
       INNER JOIN edm_bagian b ON bf.bagian_id = b.id
       WHERE b.tahun_anggaran_id = ?1`,
    ).bind(parseInt(tahunAnggaranId)).all();

    const jawabanMap = new Map<string, any>();
    for (const j of jawabanList.results as any[]) {
      jawabanMap.set(`${j.bagian_id}_${j.kode_soal}`, j);
      jawabanMap.set(j.kode_soal, j);
    }

    const buktiMap = new Map<string, number>();
    for (const bf of buktiList.results as any[]) {
      const key1 = `${bf.bagian_id}_${bf.kode_soal}`;
      const key2 = bf.kode_soal;
      buktiMap.set(key1, (buktiMap.get(key1) || 0) + 1);
      buktiMap.set(key2, (buktiMap.get(key2) || 0) + 1);
    }

    const bagianSummary = bagianList.results.map((b: any) => {
      const kat = getKategoriByKode(b.nama_bagian);
      const instrumenKat = kat ? kat.instrumen : [];
      let jumlahJawaban = 0;
      let earnedWeighted = 0;
      let totalBobot = kat ? kat.totalBobot : 0;

      for (const inst of instrumenKat) {
        const j = jawabanMap.get(`${b.bagian_id}_${inst.kode_soal}`) || jawabanMap.get(inst.kode_soal);
        if (j && j.skor !== null && j.skor !== undefined) {
          jumlahJawaban++;
          earnedWeighted += j.skor * inst.bobot;
        }
      }

      const rataRataSkor = totalBobot > 0 && jumlahJawaban > 0
        ? Math.round((earnedWeighted / totalBobot) * 100) / 100
        : null;

      const persentaseSkor = totalBobot > 0
        ? Math.round((earnedWeighted / (totalBobot * 4)) * 10000) / 100
        : 0;

      return {
        ...b,
        jumlah_indikator: instrumenKat.length,
        jumlah_jawaban: jumlahJawaban,
        total_bobot: totalBobot,
        earned_weighted: earnedWeighted,
        rata_rata_skor: rataRataSkor,
        persentase_skor: persentaseSkor,
      };
    });

    let totalEarnedWeighted = 0;
    let totalMaxWeighted = 0;
    let totalBagianTerisi = 0;

    for (const bs of bagianSummary) {
      if (bs.jumlah_jawaban > 0) totalBagianTerisi++;
      totalEarnedWeighted += bs.earned_weighted;
      totalMaxWeighted += bs.total_bobot * 4;
    }

    const totalBobotKeseluruhan = EDM_KATEGORI.reduce((acc, k) => acc + k.totalBobot, 0);
    const rataRataSkorKeseluruhan = totalBobotKeseluruhan > 0 && totalEarnedWeighted > 0
      ? Math.round((totalEarnedWeighted / totalBobotKeseluruhan) * 100) / 100
      : null;

    const overallSummary = {
      total_indikator: getAllInstrumen().length,
      total_bagian_terisi: totalBagianTerisi,
      total_kelompok_terisi: totalBagianTerisi,
      rata_rata_skor_keseluruhan: rataRataSkorKeseluruhan,
      persentase_skor_keseluruhan: totalMaxWeighted > 0
        ? Math.round((totalEarnedWeighted / totalMaxWeighted) * 10000) / 100
        : 0,
    };

    const allInst = getAllInstrumen();
    const bagianMapById = new Map<string, number>();
    for (const b of bagianList.results as any[]) {
      bagianMapById.set(b.nama_bagian, b.id);
    }

    const perIndikator = allInst.map((inst) => {
      const bId = bagianMapById.get(inst.kategori);
      const j = (bId ? jawabanMap.get(`${bId}_${inst.kode_soal}`) : null) || jawabanMap.get(inst.kode_soal);
      const proofCount = (bId ? buktiMap.get(`${bId}_${inst.kode_soal}`) : null) || buktiMap.get(inst.kode_soal) || 0;

      return {
        id: inst.kode_soal,
        kode_soal: inst.kode_soal,
        bagian_target: inst.kategori,
        kelompok_target: inst.kategori,
        nomor_urut: inst.kode,
        urutan: inst.urutan,
        pertanyaan: inst.pertanyaan,
        bobot: inst.bobot,
        bukti_yang_diminta: inst.bukti,
        rata_rata_skor: j ? j.skor : null,
        jumlah_bukti_file: proofCount,
        updated_by_nama: j ? j.updated_by_nama || "" : "",
      };
    });

    return jsonResponse({
      bagian: bagianSummary,
      kelompok: bagianSummary,
      overall: overallSummary,
      per_indikator: perIndikator,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Bukti File EDM — R2 Upload/List/Delete/Download
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_FILES_PER_INDIKATOR = 10;

function generateR2Key(bagianId: number, kodeSoal: string, filename: string): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeKode = kodeSoal.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `edm/${bagianId}/${safeKode}/${timestamp}-${rand}-${safeName}`;
}

// ---------------------------------------------------------------------------
// POST /api/edm/bukti/upload — Upload files ke R2
// ---------------------------------------------------------------------------
export async function handleUploadEdmBukti(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return errorResponse("Content-Type harus multipart/form-data", 400);
    }

    const formData = await request.formData();
    const kodeSoal = (formData.get("kode_soal") as string) || (formData.get("indikator_id") as string);
    const bagianId = parseInt(formData.get("bagian_id") as string);
    const gtkId = formData.get("gtk_id") ? parseInt(formData.get("gtk_id") as string) : null;

    if (!kodeSoal || !bagianId) {
      return errorResponse("Field 'kode_soal' dan 'bagian_id' wajib diisi", 400);
    }

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && typeof value !== "string") {
        files.push(value as File);
      }
    }

    if (files.length === 0) {
      return errorResponse("Tidak ada file yang diupload", 400);
    }

    const existingCount = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM edm_bukti_file WHERE kode_soal = ?1 AND bagian_id = ?2"
    ).bind(kodeSoal, bagianId).first<{ cnt: number }>();

    const currentCount = existingCount?.cnt || 0;
    if (currentCount + files.length > MAX_FILES_PER_INDIKATOR) {
      return errorResponse(
        `Melebihi batas file. Saat ini ${currentCount} file, maks ${MAX_FILES_PER_INDIKATOR} file per soal.`,
        400
      );
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return errorResponse(
          `Tipe file "${file.name}" tidak diizinkan (${file.type}). Hanya JPG, PNG, WEBP, dan PDF.`,
          400
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return errorResponse(
          `File "${file.name}" terlalu besar (${sizeMB} MB). Maksimal 2 MB per file.`,
          400
        );
      }
    }

    const dbStatements: D1PreparedStatement[] = [];

    for (const file of files) {
      const r2Key = generateR2Key(bagianId, kodeSoal, file.name);
      const arrayBuffer = await file.arrayBuffer();

      await env.R2.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
        customMetadata: {
          originalName: file.name,
          kodeSoal: kodeSoal,
          bagianId: String(bagianId),
        },
      });

      dbStatements.push(
        env.DB.prepare(
          `INSERT INTO edm_bukti_file (kode_soal, bagian_id, r2_key, original_name, mime_type, file_size, uploaded_by)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        ).bind(kodeSoal, bagianId, r2Key, file.name, file.type, file.size, gtkId)
      );
    }

    if (dbStatements.length > 0) {
      await env.DB.batch(dbStatements);
    }

    const insertedFiles = await env.DB.prepare(
      `SELECT id, r2_key, original_name, mime_type, file_size, uploaded_by, created_at
       FROM edm_bukti_file
       WHERE kode_soal = ?1 AND bagian_id = ?2
       ORDER BY created_at DESC
       LIMIT ?3`
    ).bind(kodeSoal, bagianId, files.length).all();

    return jsonResponse({
      success: true,
      message: `${files.length} file berhasil diupload`,
      files: insertedFiles.results,
    });
  } catch (err: any) {
    return errorResponse(`Upload error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/edm/bukti?kode_soal=X&bagian_id=Y — List file bukti
// ---------------------------------------------------------------------------
export async function handleGetEdmBukti(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const kodeSoal = url.searchParams.get("kode_soal") || url.searchParams.get("indikator_id");
  const bagianId = url.searchParams.get("bagian_id");

  if (!kodeSoal || !bagianId) {
    return errorResponse("Parameter 'kode_soal' dan 'bagian_id' diperlukan", 400);
  }

  try {
    const result = await env.DB.prepare(
      `SELECT bf.*, g.nama_lengkap AS uploader_nama
       FROM edm_bukti_file bf
       LEFT JOIN data_gtk g ON bf.uploaded_by = g.id
       WHERE bf.kode_soal = ?1 AND bf.bagian_id = ?2
       ORDER BY bf.created_at ASC`
    ).bind(kodeSoal, parseInt(bagianId)).all();

    return jsonResponse(result.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/edm/bukti/:id — Hapus file dari R2 + DB
// ---------------------------------------------------------------------------
export async function handleDeleteEdmBukti(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  try {
    const file = await env.DB.prepare(
      "SELECT * FROM edm_bukti_file WHERE id = ?1"
    ).bind(parseInt(id)).first<{ id: number; r2_key: string; original_name: string }>();

    if (!file) {
      return errorResponse("File tidak ditemukan", 404);
    }

    await env.R2.delete(file.r2_key);

    await env.DB.prepare("DELETE FROM edm_bukti_file WHERE id = ?1")
      .bind(parseInt(id))
      .run();

    return jsonResponse({
      success: true,
      message: `File "${file.original_name}" berhasil dihapus`,
    });
  } catch (err: any) {
    return errorResponse(`Delete error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/edm/bukti/download/:key+ — Download/preview file dari R2
// ---------------------------------------------------------------------------
export async function handleDownloadEdmBukti(
  request: Request,
  env: Env,
  r2Key: string,
): Promise<Response> {
  try {
    let cleanKey = r2Key || "";
    if (cleanKey.includes("%")) {
      try {
        cleanKey = decodeURIComponent(cleanKey);
      } catch {}
    }
    cleanKey = cleanKey.replace(/%2F/gi, "/").replace(/,/g, "/");

    let object = await env.R2.get(cleanKey);

    if (!object && cleanKey !== r2Key) {
      object = await env.R2.get(r2Key);
    }

    if (!object) {
      return errorResponse("File tidak ditemukan di storage", 404);
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    const contentType = object.httpMetadata?.contentType || "";
    if (contentType.startsWith("image/") || contentType === "application/pdf") {
      headers.set("Content-Disposition", "inline");
    } else {
      const originalName = object.customMetadata?.originalName || "file";
      headers.set("Content-Disposition", `attachment; filename="${originalName}"`);
    }

    return new Response(object.body, { headers });
  } catch (err: any) {
    return errorResponse(`Download error: ${err.message}`, 500);
  }
}

