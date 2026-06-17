// ============================================================================
// SopokDate Cloudflare Worker — REST API with D1 Database
// Pengganti Google Apps Script (doGet/doPost)
// ============================================================================

// ---------------------------------------------------------------------------
// CORS Headers
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
// Random Password Generator
// ---------------------------------------------------------------------------
function generateRandomPassword(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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
  Pengumuman: "pengumuman",
  KalenderPendidikan: "kalender_pendidikan",
  PengaturanTapel: "pengaturan_tapel",
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
  pengumuman: {
    id: "id",
    title: "title",
    content: "content",
    date: "date",
    tag: "tag",
    tag_color: "tagColor",
  },
  kalender_pendidikan: {
    tanggal_mulai: "tanggal_mulai",
    tanggal_selesai: "tanggal_selesai",
    keterangan: "keterangan",
    tipe: "tipe",
    tahun_pelajaran: "tahun_pelajaran",
  },
  pengaturan_tapel: {
    tahun_pelajaran: "tahun_pelajaran",
    hari_libur_mingguan: "hari_libur_mingguan",
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
    
    // Pertahankan kolom id untuk kebutuhan update/delete di frontend
    if (row.id !== undefined && row.id !== null) {
      transformed.id = row.id;
    }
    if (row._id !== undefined && row._id !== null) {
      transformed._id = row._id;
    }

    for (const [d1Col, sheetCol] of Object.entries(colMap)) {
      transformed[sheetCol] = row[d1Col] !== null ? row[d1Col] : "";
    }
    return transformed;
  });
}

// Helper untuk normalisasi nama (menghilangkan gelar akademis dan prefiks H./Hj. agar pencocokan nama akurat)
function cleanName(name) {
  if (!name) return "";
  let cleaned = name.split(",")[0];
  cleaned = cleaned.replace(/^(h\.|hj\.|dra\.|drs\.|prof\.|dr\.)\s+/gi, "");
  return cleaned.replace(/\./g, "").replace(/\s+/g, " ").trim().toLowerCase();
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

  // Support gtk_id filter untuk role guru (hanya data miliknya)
  const gtkId = url.searchParams.get("gtk_id");

  let query = `SELECT * FROM ${d1Table}`;
  const params = [];
  const conditions = [];
  let applyJsFilter = false;

  // Filter by gtk_id (untuk guru melihat data sendiri)
  if (gtkId) {
    if (d1Table === "data_gtk") {
      conditions.push("id = ?");
      params.push(parseInt(gtkId));
    } else if (["akun_emis", "akun_email", "akun_simpatika", "akun_emis_gtk", "akun_rdm"].includes(d1Table)) {
      applyJsFilter = true;
    }
  }

  if (filterCol && filterVal) {
    // Fuzzy match kolom: clean filterCol dan cari di column map
    const cleanedFilter = filterCol.toLowerCase().replace(/[^a-z0-9]/g, "");
    const reverseMap = getReversColumnMap(d1Table);
    const d1ColName = reverseMap[cleanedFilter] || filterCol;

    // Cek apakah kolom valid
    const colMap = COLUMN_MAP[d1Table];
    const validColumns = colMap ? Object.keys(colMap) : [];

    if (validColumns.includes(d1ColName)) {
      conditions.push(`LOWER(${d1ColName}) LIKE ?`);
      params.push(`%${filterVal.toLowerCase()}%`);
    }
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  try {
    const result = await env.DB.prepare(query).bind(...params).all();
    let rows = result.results;

    if (applyJsFilter) {
      const gtkRecord = await env.DB.prepare("SELECT nama_lengkap FROM data_gtk WHERE id = ?").bind(parseInt(gtkId)).first();
      if (gtkRecord && gtkRecord.nama_lengkap) {
        const targetCleaned = cleanName(gtkRecord.nama_lengkap);
        rows = rows.filter(row => cleanName(row.nama) === targetCleaned);
      } else {
        rows = [];
      }
    }

    const transformed = transformRows(rows, d1Table);
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
// Handler: PUT /api/data — Update data berdasarkan ID
// ---------------------------------------------------------------------------
async function handlePutData(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { table, id, data } = body;

  if (!table) {
    return errorResponse("Parameter 'table' is required");
  }
  if (!id) {
    return errorResponse("Parameter 'id' is required");
  }
  if (!data || typeof data !== "object") {
    return errorResponse("Parameter 'data' is required and must be an object");
  }

  const d1Table = TABLE_MAP[table];
  if (!d1Table) {
    return errorResponse(`Table not found: ${table}`, 404);
  }

  try {
    const reverseMap = getReversColumnMap(d1Table);
    const colMap = COLUMN_MAP[d1Table];
    const validD1Columns = colMap ? Object.keys(colMap) : [];

    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      const d1Col = reverseMap[cleanedKey] || key;

      if (validD1Columns.includes(d1Col)) {
        setClauses.push(`${d1Col} = ?`);
        params.push(value !== undefined ? String(value) : "");
      }
    }

    if (setClauses.length === 0) {
      return errorResponse("No valid columns found in data");
    }

    setClauses.push("updated_at = datetime('now')");
    params.push(parseInt(id));

    const query = `UPDATE ${d1Table} SET ${setClauses.join(", ")} WHERE id = ?`;
    await env.DB.prepare(query).bind(...params).run();

    return jsonResponse({
      success: true,
      message: `Data successfully updated in ${table}`,
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: DELETE /api/data — Hapus data berdasarkan ID
// ---------------------------------------------------------------------------
async function handleDeleteData(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { table, id } = body;

  if (!table) {
    return errorResponse("Parameter 'table' is required");
  }
  if (!id) {
    return errorResponse("Parameter 'id' is required");
  }

  const d1Table = TABLE_MAP[table];
  if (!d1Table) {
    return errorResponse(`Table not found: ${table}`, 404);
  }

  try {
    await env.DB.prepare(`DELETE FROM ${d1Table} WHERE id = ?`)
      .bind(parseInt(id))
      .run();

    return jsonResponse({
      success: true,
      message: `Data successfully deleted from ${table}`,
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ===========================================================================
// AUTH ENDPOINTS
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /api/auth/login — Login dengan username & password dari tabel users
// ---------------------------------------------------------------------------
async function handleAuthLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { username, password } = body;

  if (!username || !password) {
    return errorResponse("Username dan password diperlukan");
  }

  try {
    const user = await env.DB.prepare(
      "SELECT id, username, password, role, display_name, gtk_id, is_active FROM users WHERE username = ?"
    )
      .bind(username)
      .first();

    if (!user) {
      return errorResponse("Username atau password salah", 401);
    }

    if (!user.is_active) {
      return errorResponse("Akun tidak aktif. Hubungi admin.", 403);
    }

    if (user.password !== password) {
      return errorResponse("Username atau password salah", 401);
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        gtk_id: user.gtk_id,
      },
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/seed-guru — Buat akun guru otomatis dari data_gtk
// Membuat akun untuk semua GTK yang punya peg_id dan belum punya akun
// ---------------------------------------------------------------------------
async function handleSeedGuru(env) {
  try {
    // Ambil semua GTK yang punya peg_id
    const gtkRows = await env.DB.prepare(
      "SELECT id, nama_lengkap, peg_id FROM data_gtk WHERE peg_id IS NOT NULL AND peg_id != ''"
    ).all();

    if (!gtkRows.results || gtkRows.results.length === 0) {
      return jsonResponse({
        success: true,
        message: "Tidak ada data GTK dengan Peg ID",
        created: 0,
      });
    }

    let created = 0;
    let skipped = 0;
    const createdAccounts = [];

    for (const gtk of gtkRows.results) {
      // Cek apakah sudah ada akun untuk gtk ini
      const existing = await env.DB.prepare(
        "SELECT id FROM users WHERE gtk_id = ?"
      )
        .bind(gtk.id)
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Cek apakah username (peg_id) sudah dipakai
      const usernameExists = await env.DB.prepare(
        "SELECT id FROM users WHERE username = ?"
      )
        .bind(gtk.peg_id)
        .first();

      if (usernameExists) {
        skipped++;
        continue;
      }

      const password = generateRandomPassword(8);

      await env.DB.prepare(
        "INSERT INTO users (username, password, role, display_name, gtk_id) VALUES (?, ?, 'guru', ?, ?)"
      )
        .bind(gtk.peg_id, password, gtk.nama_lengkap || gtk.peg_id, gtk.id)
        .run();

      createdAccounts.push({
        username: gtk.peg_id,
        password: password,
        display_name: gtk.nama_lengkap,
        gtk_id: gtk.id,
      });
      created++;
    }

    return jsonResponse({
      success: true,
      message: `Berhasil membuat ${created} akun guru, ${skipped} dilewati (sudah ada)`,
      created,
      skipped,
      accounts: createdAccounts,
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/users — Daftar semua akun (admin only)
// ---------------------------------------------------------------------------
async function handleGetUsers(env) {
  try {
    const users = await env.DB.prepare(
      `SELECT u.id, u.username, u.password, u.role, u.display_name, u.gtk_id, u.is_active, u.created_at,
              g.nama_lengkap as gtk_nama, g.peg_id as gtk_peg_id, g.nuptk as gtk_nuptk
       FROM users u
       LEFT JOIN data_gtk g ON u.gtk_id = g.id
       ORDER BY u.role ASC, u.display_name ASC`
    ).all();

    return jsonResponse(users.results);
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/auth/users/:id — Update akun user (admin: reset password, toggle active)
// ---------------------------------------------------------------------------
async function handleUpdateUser(request, env, userId) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const updates = [];
  const params = [];

  if (body.password !== undefined) {
    updates.push("password = ?");
    params.push(body.password);
  }

  if (body.is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(body.is_active ? 1 : 0);
  }

  if (body.display_name !== undefined) {
    updates.push("display_name = ?");
    params.push(body.display_name);
  }

  if (updates.length === 0) {
    return errorResponse("Tidak ada field yang diupdate");
  }

  updates.push("updated_at = datetime('now')");

  try {
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    params.push(parseInt(userId));

    await env.DB.prepare(query).bind(...params).run();

    return jsonResponse({
      success: true,
      message: "Akun berhasil diupdate",
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/auth/users/:id — Hapus akun user (admin only)
// ---------------------------------------------------------------------------
async function handleDeleteUser(env, userId) {
  try {
    await env.DB.prepare("DELETE FROM users WHERE id = ?")
      .bind(parseInt(userId))
      .run();

    return jsonResponse({
      success: true,
      message: "Akun berhasil dihapus",
    });
  } catch (err) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: GET /api/absensi — Ambil daftar siswa beserta absensi
// ---------------------------------------------------------------------------
async function handleGetAbsensi(request, env) {
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
async function handlePostAbsensi(request, env) {
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
async function handleGetAbsensiRekap(request, env) {
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

// ---------------------------------------------------------------------------
// Router Utama
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // -----------------------------------------------------------------------
    // Auth endpoints (login tidak memerlukan API Key)
    // -----------------------------------------------------------------------
    if (path === "/api/auth/login" && request.method === "POST") {
      return await handleAuthLogin(request, env);
    }

    // -----------------------------------------------------------------------
    // Semua endpoint lain memerlukan API Key
    // -----------------------------------------------------------------------
    const authHeader = request.headers.get("Authorization");
    const expectedToken = env.API_KEY;

    if (!expectedToken) {
      return errorResponse("Server configuration error: API_KEY is missing", 500);
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return errorResponse("Unauthorized: Invalid or missing API Key", 401);
    }

    // Routing
    try {
      // GET endpoints
      if (request.method === "GET") {
        if (path === "/api/data") {
          return await handleGetData(request, env);
        }
        if (path === "/api/absensi") {
          return await handleGetAbsensi(request, env);
        }
        if (path === "/api/absensi/rekap") {
          return await handleGetAbsensiRekap(request, env);
        }
        if (path === "/api/surat") {
          return await handleGetSurat(env);
        }
        if (path === "/api/auth/users") {
          return await handleGetUsers(env);
        }
        if (path === "/") {
          return jsonResponse({
            name: "SopokDate API",
            version: "2.0.0",
            endpoints: [
              "GET  /api/data?table=DataGtk",
              "GET  /api/data?table=DataSiswa",
              "GET  /api/data?table=DataKelas",
              "GET  /api/data?table=DataGtk&gtk_id=5",
              "GET  /api/absensi?tanggal=2026-06-17&kelas_id=VII-A",
              "GET  /api/absensi/rekap?kelas_id=VII-A&tahun_pelajaran=2025/2026&semester=Genap",
              "GET  /api/surat",
              "POST /api/data",
              "POST /api/absensi",
              "POST /api/auth/login",
              "POST /api/auth/seed-guru",
              "GET  /api/auth/users",
              "PUT  /api/auth/users/:id",
              "DELETE /api/auth/users/:id",
            ],
          });
        }
      }

      // POST endpoints
      if (request.method === "POST") {
        if (path === "/api/data") {
          return await handlePostData(request, env);
        }
        if (path === "/api/absensi") {
          return await handlePostAbsensi(request, env);
        }
        if (path === "/api/auth/seed-guru") {
          return await handleSeedGuru(env);
        }
      }

      // PUT endpoints for data
      if (request.method === "PUT") {
        if (path === "/api/data") {
          return await handlePutData(request, env);
        }
        const userUpdateMatch = path.match(/^\/api\/auth\/users\/(\d+)$/);
        if (userUpdateMatch) {
          return await handleUpdateUser(request, env, userUpdateMatch[1]);
        }
      }

      // DELETE endpoints for data
      if (request.method === "DELETE") {
        if (path === "/api/data") {
          return await handleDeleteData(request, env);
        }
        const userDeleteMatch = path.match(/^\/api\/auth\/users\/(\d+)$/);
        if (userDeleteMatch) {
          return await handleDeleteUser(env, userDeleteMatch[1]);
        }
      }



      return errorResponse("Not found", 404);
    } catch (err) {
      return errorResponse(`Internal server error: ${err.message}`, 500);
    }
  },
};
