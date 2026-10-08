// handlers/data.ts
import { VALID_TABLES } from "../config";
import {
  jsonResponse,
  errorResponse,
  cleanName,
  toSnakeCase,
  getCurrentAcademicYear,
  getNextAcademicYear,
} from "../utils";
import type { Env } from "../types";

// Legacy table name to D1 snake_case table name mapping
const TABLE_MAPPING: Record<string, string> = {
  datagtk: "data_gtk",
  datasiswa: "data_siswa",
  datakelas: "data_kelas",
  sertifikat: "sertifikat",
  datamadrasah: "data_madrasah",
  akungtk: "akun_gtk",
  "akun-gtk": "akun_gtk",
  dataakungtk: "akun_gtk",
  operator: "operator",
  berkas: "berkas",
  aplikasi: "aplikasi",
  pengumuman: "pengumuman",
  kalenderpendidikan: "kalender_pendidikan",
  pengaturantapel: "pengaturan_tapel",
  kurikulum: "kurikulum",
  alokasijam: "alokasi_jam",
  jadwalpelajaran: "jadwal_pelajaran",
  alumni: "alumni",
  riwayatkelassiswa: "riwayat_kelas_siswa",
  mutasisiswa: "mutasi_siswa",
  emismapelgtk: "emis_mapel_gtk",
  absensisiswa: "absensi_siswa",
  literasisiswa: "literasi_siswa",
  targetliterasisiswa: "target_literasi_siswa",
  targetliterasi: "target_literasi_siswa",
};

// Helper to validate table name to prevent SQL injection on table identifiers
function getValidatedTable(table?: string | null): string | null {
  if (!table) return null;
  const cleanInput = table.trim().toLowerCase();

  // 1. Try explicit legacy lookup
  if (TABLE_MAPPING[cleanInput]) {
    return TABLE_MAPPING[cleanInput];
  }

  // 2. Try direct case-insensitive match in VALID_TABLES
  const directMatch = VALID_TABLES.find((t) => t.toLowerCase() === cleanInput);
  if (directMatch) return directMatch;

  // 3. Try converting PascalCase/camelCase to snake_case
  const converted = toSnakeCase(table);
  const convertedMatch = VALID_TABLES.find(
    (t) => t.toLowerCase() === converted,
  );
  return convertedMatch || null;
}

// ---------------------------------------------------------------------------
// Handler: GET /api/data — Ambil data dari tabel
// ---------------------------------------------------------------------------
export async function handleGetData(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const tableParam = url.searchParams.get("table");

  if (!tableParam) {
    return jsonResponse({
      error: "Parameter 'table' is required",
      availableTables: VALID_TABLES,
    });
  }

  const d1Table = getValidatedTable(tableParam);
  if (!d1Table) {
    return errorResponse(`Table not found: ${tableParam}`, 404);
  }

  const filterCol = url.searchParams.get("filter_col");
  const filterVal = url.searchParams.get("filter_val");
  const gtkId = url.searchParams.get("gtk_id");

  let query = "";
  const params: any[] = [];
  const conditions: string[] = [];
  let applyJsFilter = false;

  const fieldsParam = url.searchParams.get("fields");

  if (d1Table === "data_siswa") {
    let tapel = url.searchParams.get("tahun_pelajaran");
    if (!tapel) {
      tapel = getCurrentAcademicYear();
    }
    query = `
      SELECT s.*, s.kelas AS kelas_db, COALESCE(r.kelas_id, s.kelas, '') AS kelas 
      FROM data_siswa s
      LEFT JOIN riwayat_kelas_siswa r ON s.id = r.siswa_id AND r.tahun_pelajaran = ?
      LEFT JOIN data_kelas k ON (
        LOWER(s.kelas) = LOWER(k.id_kelas) OR 
        LOWER(s.kelas) = LOWER(k.nama_kelas) OR 
        LOWER(r.kelas_id) = LOWER(k.id_kelas) OR 
        LOWER(r.kelas_id) = LOWER(k.nama_kelas)
      )
    `;
    params.push(tapel);
  } else if (d1Table === "data_gtk" && fieldsParam === "light") {
    query = `SELECT id, nama_lengkap, peg_id, nuptk, nip, wali_kelas, tugas FROM data_gtk`;
  } else if (d1Table === "akun_gtk") {
    query = `
      SELECT 
        ag.id,
        ag.gtk_id,
        COALESCE(g.nama_lengkap, '') AS nama,
        ag.aplikasi_id,
        COALESCE(a.title, '') AS nama_aplikasi,
        COALESCE(a.link, '') AS link_aplikasi,
        ag.username,
        ag.password,
        ag.created_at,
        ag.updated_at
      FROM akun_gtk ag 
      LEFT JOIN aplikasi a ON (ag.aplikasi_id = a.id OR ag.aplikasi_id = a.title) 
      LEFT JOIN data_gtk g ON ag.gtk_id = g.id
    `;
  } else {
    query = `SELECT * FROM ${d1Table}`;
  }

  // Filter by gtk_id (untuk guru melihat data sendiri)
  if (gtkId) {
    if (d1Table === "data_gtk") {
      conditions.push("id = ?");
      params.push(parseInt(gtkId));
    } else if (d1Table === "akun_gtk") {
      conditions.push("ag.gtk_id = ?");
      params.push(parseInt(gtkId));
    }
  }

  if (filterCol && filterVal) {
    // Dengan skema terpadu D1, filterCol langsung dicocokkan sebagai kolom database asli (dikonversi ke snake_case demi backward compatibility)
    const snakeFilterCol = toSnakeCase(filterCol);
    if (d1Table === "data_siswa" && snakeFilterCol === "kelas") {
      const cleanVal = filterVal.trim().toLowerCase();

      conditions.push(
        "(LOWER(COALESCE(r.kelas_id, '')) = ? OR LOWER(COALESCE(s.kelas, '')) = ? OR LOWER(COALESCE(k.nama_kelas, '')) = ? OR LOWER(COALESCE(k.id_kelas, '')) = ? OR LOWER(COALESCE(k.tingkat, '')) = ?)"
      );

      params.push(cleanVal, cleanVal, cleanVal, cleanVal, cleanVal);
    } else {
      conditions.push(`LOWER(${snakeFilterCol}) LIKE ?`);
      params.push(`%${filterVal.toLowerCase()}%`);
    }
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  try {
    const result = await env.DB.prepare(query)
      .bind(...params)
      .all<any>();
    let rows = result.results;

    if (applyJsFilter && gtkId) {
      const gtkRecord = await env.DB.prepare(
        "SELECT nama_lengkap FROM data_gtk WHERE id = ?",
      )
        .bind(parseInt(gtkId))
        .first<{ nama_lengkap: string }>();
      if (gtkRecord && gtkRecord.nama_lengkap) {
        const targetCleaned = cleanName(gtkRecord.nama_lengkap);
        rows = rows.filter((row: any) => cleanName(row.nama) === targetCleaned);
      } else {
        rows = [];
      }
    }

    // Mengembalikan data hasil query secara langsung
    return jsonResponse(rows);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

async function checkDuplicateNisLokal(
  env: Env,
  nisLokal: string,
  excludeTable?: string,
  excludeId?: string | number,
): Promise<{ isDuplicate: boolean; message?: string }> {
  const cleanNis = String(nisLokal || "").trim();
  if (!cleanNis) return { isDuplicate: false };

  // 1. Cek di data_siswa
  let querySiswa = "SELECT id, nama FROM data_siswa WHERE TRIM(nis_lokal) = ?";
  const paramsSiswa: any[] = [cleanNis];
  if (excludeTable === "data_siswa" && excludeId) {
    querySiswa += " AND id != ?";
    paramsSiswa.push(typeof excludeId === "string" ? parseInt(excludeId) : excludeId);
  }
  const existingSiswa = await env.DB.prepare(querySiswa)
    .bind(...paramsSiswa)
    .first<{ id: number; nama: string }>();

  if (existingSiswa) {
    return {
      isDuplicate: true,
      message: `NIS Lokal '${cleanNis}' sudah terdaftar pada siswa aktif: ${existingSiswa.nama}`,
    };
  }

  // 2. Cek di alumni
  let queryAlumni = "SELECT id, nama FROM alumni WHERE TRIM(nis_lokal) = ?";
  const paramsAlumni: any[] = [cleanNis];
  if (excludeTable === "alumni" && excludeId) {
    queryAlumni += " AND id != ?";
    paramsAlumni.push(typeof excludeId === "string" ? parseInt(excludeId) : excludeId);
  }
  const existingAlumni = await env.DB.prepare(queryAlumni)
    .bind(...paramsAlumni)
    .first<{ id: number; nama: string }>();

  if (existingAlumni) {
    return {
      isDuplicate: true,
      message: `NIS Lokal '${cleanNis}' sudah terdaftar pada alumni: ${existingAlumni.nama}`,
    };
  }

  // 3. Cek di mutasi_siswa
  let queryMutasi = "SELECT id, nama FROM mutasi_siswa WHERE TRIM(nis_lokal) = ?";
  const paramsMutasi: any[] = [cleanNis];
  if (excludeTable === "mutasi_siswa" && excludeId) {
    queryMutasi += " AND id != ?";
    paramsMutasi.push(typeof excludeId === "string" ? parseInt(excludeId) : excludeId);
  }
  const existingMutasi = await env.DB.prepare(queryMutasi)
    .bind(...paramsMutasi)
    .first<{ id: number; nama: string }>();

  if (existingMutasi) {
    return {
      isDuplicate: true,
      message: `NIS Lokal '${cleanNis}' sudah terdaftar pada data mutasi: ${existingMutasi.nama}`,
    };
  }

  return { isDuplicate: false };
}

// ---------------------------------------------------------------------------
// Handler: POST /api/data — Insert data baru
// ---------------------------------------------------------------------------
export async function handlePostData(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { table, data } = body as {
    table?: string;
    data?: Record<string, any>;
  };

  if (!table) {
    return errorResponse("Parameter 'table' is required");
  }

  if (!data || typeof data !== "object") {
    return errorResponse("Parameter 'data' is required and must be an object");
  }

  const d1Table = getValidatedTable(table);
  if (!d1Table) {
    return errorResponse(`Table not found: ${table}`, 404);
  }

  try {
    const cleanedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      cleanedData[toSnakeCase(key)] = value;
    }

    if (d1Table === "akun_gtk" && cleanedData["gtk_id"] && !cleanedData["nama"]) {
      const gtkRow = await env.DB.prepare("SELECT nama_lengkap FROM data_gtk WHERE id = ?")
        .bind(parseInt(cleanedData["gtk_id"]))
        .first<{ nama_lengkap: string }>();
      if (gtkRow?.nama_lengkap) {
        cleanedData["nama"] = gtkRow.nama_lengkap;
      }
    }

    if (d1Table === "akun_gtk") {
      delete cleanedData["nama"];
    }

    if (["data_siswa", "alumni", "mutasi_siswa"].includes(d1Table)) {
      const nisLokal = cleanedData["nis_lokal"] || cleanedData["nis lokal"] || cleanedData["nis"];
      if (nisLokal) {
        const dupCheck = await checkDuplicateNisLokal(env, String(nisLokal));
        if (dupCheck.isDuplicate) {
          return errorResponse(dupCheck.message || "NIS Lokal sudah terdaftar", 400);
        }
      }
    }

    const insertCols = Object.keys(cleanedData);
    const insertVals = Object.values(cleanedData).map((value) =>
      value !== undefined && value !== null ? String(value) : "",
    );
    const placeholders = Object.keys(cleanedData).map(() => "?");

    if (insertCols.length === 0) {
      return errorResponse("No columns found in data");
    }

    const query = `INSERT INTO ${d1Table} (${insertCols.join(", ")}) VALUES (${placeholders.join(", ")})`;
    await env.DB.prepare(query)
      .bind(...insertVals)
      .run();

    if (d1Table === "data_siswa" && cleanedData["kelas"]) {
      const lastRow = await env.DB.prepare(
        "SELECT id FROM data_siswa ORDER BY id DESC LIMIT 1",
      ).first<{ id: number }>();
      if (lastRow) {
        const tapel = getCurrentAcademicYear();
        await env.DB.prepare(
          `INSERT OR REPLACE INTO riwayat_kelas_siswa (siswa_id, kelas_id, tahun_pelajaran, updated_at) 
           VALUES (?, ?, ?, datetime('now'))`,
        )
          .bind(lastRow.id, cleanedData["kelas"], tapel)
          .run();
      }
    }

    return jsonResponse({
      success: true,
      message: `Data successfully added to ${d1Table}`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: PUT /api/data — Update data berdasarkan ID
// ---------------------------------------------------------------------------
export async function handlePutData(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { table, id, data } = body as {
    table?: string;
    id?: string | number;
    data?: Record<string, any>;
  };

  if (!table) {
    return errorResponse("Parameter 'table' is required");
  }
  if (!id) {
    return errorResponse("Parameter 'id' is required");
  }
  if (!data || typeof data !== "object") {
    return errorResponse("Parameter 'data' is required and must be an object");
  }

  const d1Table = getValidatedTable(table);
  if (!d1Table) {
    return errorResponse(`Table not found: ${table}`, 404);
  }

  // Special handle for resetting promotion status for all students
  if (d1Table === "data_siswa" && id === "reset_promosi") {
    try {
      await env.DB.prepare(
        "UPDATE data_siswa SET status_promosi = 'Belum'",
      ).run();
      return jsonResponse({
        success: true,
        message: "Status promosi seluruh siswa berhasil direset",
      });
    } catch (err: any) {
      return errorResponse(`Database error: ${err.message}`, 500);
    }
  }

  try {
    const setClauses: string[] = [];
    const params: any[] = [];
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const snakeKey = toSnakeCase(key);
      if (d1Table === "akun_gtk" && snakeKey === "nama") {
        continue;
      }
      setClauses.push(`${snakeKey} = ?`);
      params.push(value !== undefined && value !== null ? String(value) : "");
      updates[snakeKey] = value;
    }

    if (["data_siswa", "alumni", "mutasi_siswa"].includes(d1Table)) {
      const nisLokal = updates["nis_lokal"] || updates["nis lokal"] || updates["nis"];
      if (nisLokal) {
        const dupCheck = await checkDuplicateNisLokal(env, String(nisLokal), d1Table, id);
        if (dupCheck.isDuplicate) {
          return errorResponse(dupCheck.message || "NIS Lokal sudah terdaftar", 400);
        }
      }
    }

    if (setClauses.length === 0) {
      return errorResponse("No columns to update found in data");
    }

    setClauses.push("updated_at = datetime('now')");
    params.push(typeof id === "string" ? parseInt(id) : id);

    const query = `UPDATE ${d1Table} SET ${setClauses.join(", ")} WHERE id = ?`;
    await env.DB.prepare(query)
      .bind(...params)
      .run();

    // Mirror to riwayat_kelas_siswa
    if (d1Table === "data_siswa") {
      const updates: Record<string, any> = {};
      for (const [key, val] of Object.entries(data)) {
        updates[toSnakeCase(key)] = val;
      }

      const studentId = typeof id === "string" ? parseInt(id) : id;
      const statusPromosi = updates["status_promosi"];

      // Jika membatalkan promosi / kenaikan kelas
      if (statusPromosi === "Belum") {
        const nextTapel = getNextAcademicYear(getCurrentAcademicYear());
        await env.DB.prepare(
          "DELETE FROM riwayat_kelas_siswa WHERE siswa_id = ? AND tahun_pelajaran = ?",
        )
          .bind(studentId, nextTapel)
          .run();
      }

      if (updates["kelas"] !== undefined) {
        const newClass = updates["kelas"];

        let tapel = getCurrentAcademicYear();
        if (statusPromosi === "Sudah") {
          tapel = getNextAcademicYear(tapel);
        }

        if (newClass === "" || newClass === "-") {
          await env.DB.prepare(
            "DELETE FROM riwayat_kelas_siswa WHERE siswa_id = ? AND tahun_pelajaran = ?",
          )
            .bind(studentId, tapel)
            .run();
        } else {
          await env.DB.prepare(
            `INSERT OR REPLACE INTO riwayat_kelas_siswa (siswa_id, kelas_id, tahun_pelajaran, updated_at) 
             VALUES (?, ?, ?, datetime('now'))`,
          )
            .bind(studentId, newClass, tapel)
            .run();
        }
      }
    }

    // Sync kurikulum alokasi_jam to alokasi_jam table
    if (d1Table === "kurikulum") {
      const updates: Record<string, any> = {};
      for (const [key, val] of Object.entries(data)) {
        updates[toSnakeCase(key)] = val;
      }
      if (updates["alokasi_jam"] !== undefined) {
        const mapelId = typeof id === "string" ? parseInt(id) : id;
        await env.DB.prepare(
          "UPDATE alokasi_jam SET jam_mengajar = ? WHERE mapel_id = ?"
        )
          .bind(Number(updates["alokasi_jam"]), mapelId)
          .run();
      }
    }

    return jsonResponse({
      success: true,
      message: `Data successfully updated in ${d1Table}`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: DELETE /api/data — Hapus data berdasarkan ID
// ---------------------------------------------------------------------------
export async function handleDeleteData(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { table, id } = body as { table?: string; id?: string | number };

  if (!table) {
    return errorResponse("Parameter 'table' is required");
  }
  if (!id) {
    return errorResponse("Parameter 'id' is required");
  }

  const d1Table = getValidatedTable(table);
  if (!d1Table) {
    return errorResponse(`Table not found: ${table}`, 404);
  }

  try {
    // Cascading delete / clean-up logic if deleting a class (rombel)
    if (d1Table === "data_kelas") {
      const classRecord = await env.DB.prepare(
        "SELECT id_kelas FROM data_kelas WHERE id = ?"
      )
        .bind(typeof id === "string" ? parseInt(id) : id)
        .first<{ id_kelas: string }>();
      
      if (classRecord && classRecord.id_kelas) {
        const id_kelas = classRecord.id_kelas;
        
        // 1. Clear 'kelas' in data_siswa
        await env.DB.prepare(
          "UPDATE data_siswa SET kelas = '', updated_at = datetime('now') WHERE kelas = ?"
        )
          .bind(id_kelas)
          .run();

        // 2. Delete history records in riwayat_kelas_siswa
        await env.DB.prepare(
          "DELETE FROM riwayat_kelas_siswa WHERE kelas_id = ?"
        )
          .bind(id_kelas)
          .run();
      }
    }

    await env.DB.prepare(`DELETE FROM ${d1Table} WHERE id = ?`)
      .bind(typeof id === "string" ? parseInt(id) : id)
      .run();

    return jsonResponse({
      success: true,
      message: `Data successfully deleted from ${d1Table}`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
