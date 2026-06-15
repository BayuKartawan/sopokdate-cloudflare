// ============================================================================
// SopokDate Cloudflare Worker — REST API with D1 Database
// Pengganti Google Apps Script (doGet/doPost)
// ============================================================================

// ---------------------------------------------------------------------------
// CORS Headers
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ---------------------------------------------------------------------------
// Mapping nama tabel frontend → nama tabel D1
// Frontend menggunakan nama sheet (PascalCase), D1 pakai snake_case
// ---------------------------------------------------------------------------
const TABLE_MAP = {
  DataGtk: "data_gtk",
  DataSiswa: "data_siswa",
  DataKelas: "data_kelas",
  Sertifikat: "sertifikat",
  DataMadrasah: "data_madrasah",
  AkunEmis: "akun_emis",
  AkunEmail: "akun_email",
  AkunSimpatika: "akun_simpatika",
  AkunEmisGTK: "akun_emis_gtk",
  AkunRdm: "akun_rdm",
  Operator: "operator",
  Berkas: "berkas",
  Aplikasi: "aplikasi",
};

// Mapping kolom D1 (snake_case) → kolom spreadsheet (original header names)
// Agar response JSON kompatibel dengan frontend normalizer yang sudah ada
const COLUMN_MAP = {
  data_gtk: {
    nama_lengkap: "Nama Lengkap",
    nik: "NIK",
    no_kk: "No KK",
    nuptk: "NUPTK",
    peg_id: "Peg ID",
    npk: "NPK",
    nrg: "NRG",
    pendidikan_terakhir: "Pendidikan Terakhir",
    jurusan: "Jurusan",
    jenis_kelamin: "Jenis Kelamin",
    tempat_lahir: "Tempat Lahir",
    tanggal_lahir: "Tanggal Lahir",
    no_hp: "No HP",
    email: "Email",
    tugas: "Tugas",
    no_rekening: "No Rekening",
    status_kepegawaian: "Status Kepegawaian",
    nip: "NIP",
    mata_pelajaran: "Mata Pelajaran",
    wali_kelas: "Wali Kelas",
  },
  data_siswa: {
    nama: "Nama",
    nisn: "NISN",
    nis_lokal: "NIS Lokal",
    nik: "NIK",
    no_kk: "No KK",
    tempat_lahir: "Tempat Lahir",
    tanggal_lahir: "Tanggal Lahir",
    kelas: "Kelas",
    umur: "Umur",
    jenis_kelamin: "Jenis Kelamin",
    alamat: "Alamat",
    no_hp: "No HP",
    no_kip: "No KIP",
    nama_ayah_kandung: "Nama Ayah Kandung",
    nama_ibu_kandung: "Nama Ibu Kandung",
    nama_wali: "Nama Wali",
  },
  data_kelas: {
    id_kelas: "ID Kelas",
    nama_kelas: "Nama Kelas",
    tingkat: "Tingkat",
    wali_kelas: "Wali Kelas",
  },
  sertifikat: {
    timestamp: "timestamp",
    nomor: "nomor",
    nama_lengkap: "nama_lengkap",
    nisn: "nisn",
    kelas: "kelas",
    juara: "juara",
    wali_kelas: "wali_kelas",
    date: "date",
    verifikasi: "verifikasi",
    semester: "semester",
    tahun_pelajaran: "tahun_pelajaran",
  },
  data_madrasah: {
    madrasah: "Madrasah",
    nsm: "Nsm",
    npsn: "Npsn",
    siap_id: "SiapID",
    nomor_akreditasi: "Nomor Akreditasi",
    akreditasi: "Akreditasi",
    no_hp_kamad: "NoHp Kamad",
  },
  akun_emis: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  akun_email: {
    nama: "nama",
    username: "username",
    password: "password",
  },
  akun_simpatika: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  akun_emis_gtk: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  akun_rdm: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  operator: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  berkas: {
    title: "title",
    link: "link",
  },
  aplikasi: {
    title: "title",
    link: "link",
  },
};

// Mapping balik: nama kolom spreadsheet → nama kolom D1
function getReversColumnMap(tableName) {
  const map = COLUMN_MAP[tableName];
  if (!map) return {};
  const reverse = {};
  for (const [d1Col, sheetCol] of Object.entries(map)) {
    reverse[sheetCol.toLowerCase().replace(/[^a-z0-9]/g, "")] = d1Col;
  }
  return reverse;
}

// ---------------------------------------------------------------------------
// Transformasi hasil query D1 → format JSON spreadsheet (untuk kompatibilitas)
// ---------------------------------------------------------------------------
function transformRows(rows, tableName) {
  const colMap = COLUMN_MAP[tableName];
  if (!colMap) return rows;

  return rows.map((row) => {
    const transformed = {};
    for (const [d1Col, sheetCol] of Object.entries(colMap)) {
      transformed[sheetCol] = row[d1Col] !== null ? row[d1Col] : "";
    }
    return transformed;
  });
}

// ---------------------------------------------------------------------------
// Handler: GET /api/data — Ambil data dari tabel (pengganti doGet AppScript)
// ---------------------------------------------------------------------------
async function handleGetData(request, env) {
  const url = new URL(request.url);
  const table = url.searchParams.get("table");

  if (!table) {
    // Return daftar tabel yang tersedia (sama seperti AppScript tanpa parameter)
    return jsonResponse({
      error: "Parameter 'table' is required",
      availableTables: Object.keys(TABLE_MAP),
    });
  }

  const d1Table = TABLE_MAP[table];
  if (!d1Table) {
    return errorResponse(`Table not found: ${table}`, 404);
  }

  // Filter support (sama seperti AppScript filter_col & filter_val)
  const filterCol = url.searchParams.get("filter_col");
  const filterVal = url.searchParams.get("filter_val");

  let query = `SELECT * FROM ${d1Table}`;
  const params = [];

  if (filterCol && filterVal) {
    // Fuzzy match kolom: clean filterCol dan cari di column map
    const cleanedFilter = filterCol.toLowerCase().replace(/[^a-z0-9]/g, "");
    const reverseMap = getReversColumnMap(d1Table);
    const d1ColName = reverseMap[cleanedFilter] || filterCol;

    // Cek apakah kolom valid
    const colMap = COLUMN_MAP[d1Table];
    const validColumns = colMap ? Object.keys(colMap) : [];

    if (validColumns.includes(d1ColName)) {
      query += ` WHERE LOWER(${d1ColName}) LIKE ?`;
      params.push(`%${filterVal.toLowerCase()}%`);
    }
  }

  try {
    const result = await env.DB.prepare(query).bind(...params).all();
    const transformed = transformRows(result.results, d1Table);
    return jsonResponse(transformed);
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/surat — Ambil data template surat
// (pengganti doGet AppScript DB Surat)
// ---------------------------------------------------------------------------
async function handleGetSurat(env) {
  try {
    // Ambil semua template path
    const templates = await env.DB.prepare(
      "SELECT surat_type, template_path, template_type FROM template_path"
    ).all();

    // Ambil semua placeholders
    const allPlaceholders = await env.DB.prepare(
      "SELECT surat_type, key, label, type, options, default_value FROM placeholders ORDER BY sort_order ASC"
    ).all();

    // Bangun templateMap (format sama dengan output AppScript)
    const templateMap = {};

    for (const tpl of templates.results) {
      templateMap[tpl.surat_type] = {
        templatePath: tpl.template_path,
        templateType: tpl.template_type,
        placeholder: [],
      };
    }

    for (const ph of allPlaceholders.results) {
      if (templateMap[ph.surat_type]) {
        const placeholder = {
          key: ph.key,
          label: ph.label,
          type: ph.type || "text",
        };

        // Parse options JSON jika ada
        if (ph.type === "select" && ph.options) {
          try {
            placeholder.options = JSON.parse(ph.options);
          } catch {
            // Jika bukan JSON, coba parse sebagai comma-separated
            placeholder.options = ph.options
              .split(",")
              .map((opt) => opt.trim())
              .filter((opt) => opt.length > 0);
          }
        }

        // Tambahkan default value jika ada
        if (ph.default_value) {
          placeholder.default = ph.default_value;
        }

        templateMap[ph.surat_type].placeholder.push(placeholder);
      }
    }

    return jsonResponse(templateMap);
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/data — Insert data baru (pengganti doPost AppScript)
// ---------------------------------------------------------------------------
async function handlePostData(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { table, data } = body;

  if (!table) {
    return errorResponse("Parameter 'table' is required");
  }

  if (!data || typeof data !== "object") {
    return errorResponse("Parameter 'data' is required and must be an object");
  }

  const d1Table = TABLE_MAP[table];

  if (d1Table) {
    // Insert ke tabel yang dikenal (DataGtk, DataSiswa, DataKelas)
    try {
      const reverseMap = getReversColumnMap(d1Table);
      const colMap = COLUMN_MAP[d1Table];
      const validD1Columns = colMap ? Object.keys(colMap) : [];

      const insertCols = [];
      const insertVals = [];
      const placeholders = [];

      for (const [key, value] of Object.entries(data)) {
        const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        const d1Col = reverseMap[cleanedKey] || key;

        if (validD1Columns.includes(d1Col)) {
          insertCols.push(d1Col);
          insertVals.push(value !== undefined ? String(value) : "");
          placeholders.push("?");
        }
      }

      if (insertCols.length === 0) {
        return errorResponse("No valid columns found in data");
      }

      const query = `INSERT INTO ${d1Table} (${insertCols.join(", ")}) VALUES (${placeholders.join(", ")})`;
      await env.DB.prepare(query).bind(...insertVals).run();

      return jsonResponse({
        success: true,
        message: `Data successfully added to ${table}`,
      });
    } catch (err) {
      return errorResponse(`Database error: ${err.message}`, 500);
    }
  } else {
    // Tabel tidak dikenal → simpan ke tabel rekap (fleksibel)
    try {
      await env.DB.prepare(
        "INSERT INTO rekap (table_name, data) VALUES (?, ?)"
      )
        .bind(table, JSON.stringify(data))
        .run();

      return jsonResponse({
        success: true,
        message: `Data successfully added to ${table}`,
      });
    } catch (err) {
      return errorResponse(`Database error: ${err.message}`, 500);
    }
  }
}



// ---------------------------------------------------------------------------
// Router Utama
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Validasi API Key / Token
    const authHeader = request.headers.get("Authorization");
    const expectedToken = env.API_KEY;

    if (!expectedToken) {
      return errorResponse("Server configuration error: API_KEY is missing", 500);
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return errorResponse("Unauthorized: Invalid or missing API Key", 401);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Routing
    try {
      // GET endpoints
      if (request.method === "GET") {
        if (path === "/api/data") {
          return await handleGetData(request, env);
        }
        if (path === "/api/surat") {
          return await handleGetSurat(env);
        }
        if (path === "/") {
          return jsonResponse({
            name: "SopokDate API",
            version: "1.0.0",
            endpoints: [
              "GET  /api/data?table=DataGtk",
              "GET  /api/data?table=DataSiswa",
              "GET  /api/data?table=DataKelas",
              "GET  /api/data?table=DataGtk&filter_col=tugas&filter_val=guru",
              "GET  /api/surat",
              "POST /api/data",
            ],
          });
        }
      }

      // POST endpoints
      if (request.method === "POST") {
        if (path === "/api/data") {
          return await handlePostData(request, env);
        }
      }

      return errorResponse("Not found", 404);
    } catch (err) {
      return errorResponse(`Internal server error: ${err.message}`, 500);
    }
  },
};
