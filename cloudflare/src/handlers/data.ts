// handlers/data.ts
import { VALID_TABLES } from "../config";
import { jsonResponse, errorResponse, cleanName, toSnakeCase } from "../utils";
import type { Env } from "../types";

// Legacy table name to D1 snake_case table name mapping
const TABLE_MAPPING: Record<string, string> = {
  datagtk: "data_gtk",
  datasiswa: "data_siswa",
  datakelas: "data_kelas",
  sertifikat: "sertifikat",
  datamadrasah: "data_madrasah",
  akunemis: "akun_emis",
  akunemail: "akun_email",
  akunsimpatika: "akun_simpatika",
  akunemisgtk: "akun_emis_gtk",
  akunrdm: "akun_rdm",
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
// Handler: GET /api/data — Ambil data dari tabel (pengganti doGet AppScript)
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

  let query = `SELECT * FROM ${d1Table}`;
  const params: any[] = [];
  const conditions: string[] = [];
  let applyJsFilter = false;

  // Filter by gtk_id (untuk guru melihat data sendiri)
  if (gtkId) {
    if (d1Table === "data_gtk") {
      conditions.push("id = ?");
      params.push(parseInt(gtkId));
    } else if (
      [
        "akun_emis",
        "akun_email",
        "akun_simpatika",
        "akun_emis_gtk",
        "akun_rdm",
      ].includes(d1Table)
    ) {
      applyJsFilter = true;
    }
  }

  if (filterCol && filterVal) {
    // Dengan skema terpadu D1, filterCol langsung dicocokkan sebagai kolom database asli (dikonversi ke snake_case demi backward compatibility)
    const snakeFilterCol = toSnakeCase(filterCol);
    conditions.push(`LOWER(${snakeFilterCol}) LIKE ?`);
    params.push(`%${filterVal.toLowerCase()}%`);
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

    // Mengembalikan data hasil query secara langsung tanpa pemetaan kolom spreadsheet
    return jsonResponse(rows);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/data — Insert data baru (pengganti doPost AppScript)
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
      await env.DB.prepare("UPDATE data_siswa SET status_promosi = 'Belum'").run();
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

    for (const [key, value] of Object.entries(data)) {
      const snakeKey = toSnakeCase(key);
      setClauses.push(`${snakeKey} = ?`);
      params.push(value !== undefined && value !== null ? String(value) : "");
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
