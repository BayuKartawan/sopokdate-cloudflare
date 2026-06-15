// ============================================================================
// Script Migrasi Data: JSON Lokal / Google Sheets → Cloudflare D1
//
// CARA PAKAI:
// 1. Secara default, script akan membaca file JSON lokal di:
//    - app-script/SopokDateDB-Main.json
//    - app-script/SopokDateDB-Surat.json
// 2. Jalankan: node migrate.js
// 3. File seed.sql akan di-generate otomatis
// 4. Eksekusi SQL ke D1:
//    - Lokal: npm run db:seed:local
//    - Remote: npm run db:seed
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL AppScript jika ingin fallback ke fetch remote
const APPSCRIPT_URL_UTAMA = "https://script.google.com/macros/s/AKfycbz_fYnqNmlbxCJqAKUtf0MmSO7nTYQK75u39AKziFSYgqEqQw5A7vIQz4IE-pKsh3vd/exec";
const APPSCRIPT_URL_SURAT = "https://script.google.com/macros/s/AKfycbwzcEmzA5zLTfjbWrAvVTSwigvFK9T91nYPWxYs6E-YOD62Z2pSIaCD-g3VpUiy7AdgyA/exec";

// Daftar seluruh tabel dari DB Utama
const TABLES_TO_MIGRATE = [
  "DataGtk",
  "DataSiswa",
  "DataKelas",
  "Sertifikat",
  "DataMadrasah",
  "AkunEmis",
  "AkunEmail",
  "AkunSimpatika",
  "AkunEmisGTK",
  "AkunRdm",
  "Operator",
  "Berkas",
  "Aplikasi"
];

// Mapping kolom spreadsheet → kolom D1
const COLUMN_MAP = {
  DataGtk: {
    namalengkap: "nama_lengkap",
    nik: "nik",
    nokk: "no_kk",
    nuptk: "nuptk",
    pegid: "peg_id",
    npk: "npk",
    nrg: "nrg",
    pendidikanterakhir: "pendidikan_terakhir",
    jurusan: "jurusan",
    jeniskelamin: "jenis_kelamin",
    tempatlahir: "tempat_lahir",
    tanggallahir: "tanggal_lahir",
    nohp: "no_hp",
    email: "email",
    tugas: "tugas",
    norekening: "no_rekening",
    statuskepegawaian: "status_kepegawaian",
    nip: "nip",
    matapelajaran: "mata_pelajaran",
    walikelas: "wali_kelas",
  },
  DataSiswa: {
    nama: "nama",
    nisn: "nisn",
    nislokal: "nis_lokal",
    nik: "nik",
    nokk: "no_kk",
    tempatlahir: "tempat_lahir",
    tanggallahir: "tanggal_lahir",
    kelas: "kelas",
    umur: "umur",
    jeniskelamin: "jenis_kelamin",
    alamat: "alamat",
    nohp: "no_hp",
    nokip: "no_kip",
    namaayahkandung: "nama_ayah_kandung",
    namaibukandung: "nama_ibu_kandung",
    namawali: "nama_wali",
  },
  DataKelas: {
    idkelas: "id_kelas",
    namakelas: "nama_kelas",
    tingkat: "tingkat",
    walikelas: "wali_kelas",
  },
  Sertifikat: {
    timestamp: "timestamp",
    nomor: "nomor",
    namalengkap: "nama_lengkap",
    nisn: "nisn",
    kelas: "kelas",
    juara: "juara",
    walikelas: "wali_kelas",
    date: "date",
    verifikasi: "verifikasi",
    semester: "semester",
    tahunpelajaran: "tahun_pelajaran",
  },
  DataMadrasah: {
    madrasah: "madrasah",
    nsm: "nsm",
    npsn: "npsn",
    siapid: "siap_id",
    nomorakreditasi: "nomor_akreditasi",
    akreditasi: "akreditasi",
    nohpkamad: "no_hp_kamad",
  },
  AkunEmis: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  AkunEmail: {
    nama: "nama",
    username: "username",
    password: "password",
  },
  AkunSimpatika: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  AkunEmisGTK: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  AkunRdm: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  Operator: {
    nama: "nama",
    username: "username",
    password: "password",
    link: "link",
  },
  Berkas: {
    title: "title",
    link: "link",
  },
  Aplikasi: {
    title: "title",
    link: "link",
  },
};

const D1_TABLE_MAP = {
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

// Helper: Escape SQL string
function escapeSql(value) {
  if (value === null || value === undefined) return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

// Helper: Mencari file lokal
function findLocalFile(filename) {
  const paths = [
    path.join(__dirname, "..", "app-script", filename),
    path.join(__dirname, "app-script", filename),
    path.join(process.cwd(), "app-script", filename),
    path.join(process.cwd(), "..", "app-script", filename),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Helper: Membaca dan menormalisasi file JSON Utama (bisa memproses file skeleton)
function readLocalMainData(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(content);
  } catch (err) {
    console.log(`⚠️  Gagal parse ${path.basename(filePath)} langsung. Mencoba recovery dari format skeleton...`);
    
    // Perbaiki format skeleton dari: "Table": [ "Col": null, ... ] menjadi "Table": { "Col": null, ... }
    let cleaned = content;
    TABLES_TO_MIGRATE.forEach((table) => {
      const regex = new RegExp(`"${table}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'g');
      cleaned = cleaned.replace(regex, (match, p1) => {
        if (p1.trim().startsWith('{')) return match; // valid array of objects
        return `"${table}": {${p1}}`;
      });
    });

    try {
      const parsed = JSON.parse(cleaned);
      const result = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (Array.isArray(val)) {
          result[key] = val;
        } else {
          console.log(`  ℹ️  Tabel ${key} dideteksi sebagai struktur kolom saja (tidak ada baris data).`);
          result[key] = [];
        }
      }
      return result;
    } catch (recoverErr) {
      console.error(`❌ Gagal merecover JSON: ${recoverErr.message}`);
      throw new Error(`Format file ${path.basename(filePath)} tidak valid.`);
    }
  }
}

// Transform flat TemplatePath + Placeholders menjadi format nested templateMap
function transformLocalSuratData(localSuratData) {
  const templateMap = {};

  if (Array.isArray(localSuratData.TemplatePath)) {
    localSuratData.TemplatePath.forEach((item) => {
      const suratType = item["Surat Type"];
      const templatePath = item["Template Path"];
      const ext = templatePath ? templatePath.split(".").pop() : "docx";
      templateMap[suratType] = {
        templatePath: templatePath || "",
        templateType: ext || "docx",
        placeholder: [],
      };
    });
  }

  if (Array.isArray(localSuratData.Placeholders)) {
    localSuratData.Placeholders.forEach((item) => {
      const suratType = item["Surat Type"];
      if (!templateMap[suratType]) {
        templateMap[suratType] = {
          templatePath: "",
          templateType: "docx",
          placeholder: [],
        };
      }

      const ph = {
        key: item["Key"] || "",
        label: item["Label"] || "",
        type: item["Type"] || "text",
      };

      if (item["Default"] !== undefined) {
        ph.default = item["Default"];
      } else if (item["Default Value"] !== undefined) {
        ph.default = item["Default Value"];
      }

      if (item["Options"] !== undefined) {
        if (typeof item["Options"] === "string") {
          ph.options = item["Options"]
            .split(",")
            .map((opt) => opt.trim())
            .filter(Boolean);
        } else {
          ph.options = item["Options"];
        }
      }

      templateMap[suratType].placeholder.push(ph);
    });
  }

  return templateMap;
}

// Helper: Fetch dari AppScript
async function fetchFromAppScript(url, table = null) {
  const fetchUrl = table ? `${url}?table=${encodeURIComponent(table)}` : url;
  console.log(`  Fetching: ${fetchUrl}`);

  const response = await fetch(fetchUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Helper: Map kolom spreadsheet ke kolom D1
function mapRow(row, tableName) {
  const mapping = COLUMN_MAP[tableName];
  if (!mapping) return null;

  const d1Row = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const d1Col = mapping[cleanedKey];
    if (d1Col) {
      d1Row[d1Col] = value;
    }
  }
  return d1Row;
}

// Generate SQL INSERT statements
function generateInsertSQL(d1Table, rows) {
  if (rows.length === 0) return "";

  const columns = Object.keys(rows[0]);
  const lines = [];

  lines.push(`-- ${d1Table}: ${rows.length} baris`);
  lines.push(`DELETE FROM ${d1Table};`);

  for (const row of rows) {
    const values = columns.map((col) => escapeSql(row[col]));
    lines.push(
      `INSERT INTO ${d1Table} (${columns.join(", ")}) VALUES (${values.join(", ")});`
    );
  }

  lines.push("");
  return lines.join("\n");
}

// Generate SQL untuk data surat
function generateSuratSQL(templateMap) {
  const lines = [];

  lines.push("-- Template Surat");
  lines.push("DELETE FROM placeholders;");
  lines.push("DELETE FROM template_path;");
  lines.push("");

  for (const [suratType, config] of Object.entries(templateMap)) {
    lines.push(
      `INSERT INTO template_path (surat_type, template_path, template_type) VALUES (${escapeSql(suratType)}, ${escapeSql(config.templatePath)}, ${escapeSql(config.templateType)});`
    );

    if (config.placeholder && Array.isArray(config.placeholder)) {
      config.placeholder.forEach((ph, index) => {
        const options = ph.options ? JSON.stringify(ph.options) : null;
        lines.push(
          `INSERT INTO placeholders (surat_type, key, label, type, options, default_value, sort_order) VALUES (${escapeSql(suratType)}, ${escapeSql(ph.key)}, ${escapeSql(ph.label)}, ${escapeSql(ph.type || "text")}, ${escapeSql(options)}, ${escapeSql(ph.default || null)}, ${index});`
        );
      });
    }
    lines.push("");
  }

  return lines.join("\n");
}

// Generate SQL seed file
async function generateSeedFile() {
  let sql = "";
  sql += "-- ============================================================================\n";
  sql += "-- SopokDate Seed Data — Auto-generated\n";
  sql += `-- Generated at: ${new Date().toISOString()}\n`;
  sql += "-- ============================================================================\n\n";

  // Coba cari file lokal terlebih dahulu
  const mainJsonPath = findLocalFile("SopokDateDB-Main.json");
  const suratJsonPath = findLocalFile("SopokDateDB-Surat.json");

  // --- MIGRASI DB UTAMA ---
  let dataMain = {};
  if (APPSCRIPT_URL_UTAMA) {
    console.log("\n📦 Mengambil data dari AppScript DB Utama (Remote)...\n");
    for (const table of TABLES_TO_MIGRATE) {
      try {
        console.log(`  📋 Tabel: ${table}`);
        const data = await fetchFromAppScript(APPSCRIPT_URL_UTAMA, table);

        if (Array.isArray(data) && data.length > 0) {
          dataMain[table] = data;
          const d1Table = D1_TABLE_MAP[table];
          const mappedRows = data.map((row) => mapRow(row, table)).filter(Boolean);
          sql += generateInsertSQL(d1Table, mappedRows);
          console.log(`     ✅ ${mappedRows.length} baris berhasil di-generate`);
        } else {
          console.log(`     ⚠️  Tidak ada data atau format tidak sesuai`);
        }
      } catch (err) {
        console.error(`     ❌ Error: ${err.message}`);
      }
    }
  } else if (mainJsonPath) {
    console.log(`\n📂 Membaca database utama dari file lokal: ${mainJsonPath}`);
    try {
      const localData = readLocalMainData(mainJsonPath);
      dataMain = localData;
      for (const table of TABLES_TO_MIGRATE) {
        const rows = localData[table];
        if (Array.isArray(rows) && rows.length > 0) {
          const d1Table = D1_TABLE_MAP[table];
          const mappedRows = rows.map((row) => mapRow(row, table)).filter(Boolean);
          if (mappedRows.length > 0) {
            sql += generateInsertSQL(d1Table, mappedRows);
            console.log(`  ✅ Tabel ${table}: ${mappedRows.length} baris di-generate`);
          }
        } else {
          console.log(`  ℹ️  Tabel ${table}: Tidak ada data untuk dimasukkan (kosong)`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Gagal membaca ${path.basename(mainJsonPath)}: ${err.message}`);
    }
  } else {
    console.log("\n⚠️  Tidak ditemukan file SopokDateDB-Main.json dan APPSCRIPT_URL_UTAMA kosong.");
  }

  // --- MIGRASI DB SURAT ---
  if (APPSCRIPT_URL_SURAT) {
    console.log("\n📦 Mengambil data dari AppScript DB Surat (Remote)...\n");
    try {
      const templateMap = await fetchFromAppScript(APPSCRIPT_URL_SURAT);
      if (templateMap && typeof templateMap === "object" && !Array.isArray(templateMap)) {
        sql += generateSuratSQL(templateMap);
        console.log(`  ✅ ${Object.keys(templateMap).length} template surat berhasil di-generate`);
      } else {
        console.log("  ⚠️  Format data surat tidak sesuai");
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  } else if (suratJsonPath) {
    console.log(`\n📂 Membaca data surat dari file lokal: ${suratJsonPath}`);
    try {
      const dataSurat = JSON.parse(fs.readFileSync(suratJsonPath, "utf-8"));
      const templateMap = transformLocalSuratData(dataSurat);
      if (Object.keys(templateMap).length > 0) {
        sql += generateSuratSQL(templateMap);
        console.log(`  ✅ Template Surat: ${Object.keys(templateMap).length} template di-generate`);
      }
    } catch (err) {
      console.error(`  ❌ Gagal membaca ${path.basename(suratJsonPath)}: ${err.message}`);
    }
  } else {
    console.log("\n⚠️  Tidak ditemukan file SopokDateDB-Surat.json dan APPSCRIPT_URL_SURAT kosong.");
  }

  // --- MIGRASI AKUN USERS ---
  console.log(`\n🔑 Membuat akun users (admin + guru dari data_gtk)...`);
  sql += "-- ============================================================================\n";
  sql += "-- Akun Users (Admin + Guru)\n";
  sql += "-- ============================================================================\n\n";
  sql += "DELETE FROM users;\n\n";

  // Admin account (hardcoded, sama dengan yang sebelumnya)
  sql += `-- Admin Account\n`;
  sql += `INSERT INTO users (username, password, role, display_name, gtk_id, is_active) VALUES ('bayu2kali@my.my', 'bayU*Saya', 'admin', 'Bayu Administrator', NULL, 1);\n\n`;
  console.log(`  ✅ Akun admin (bayu2kali@my.my) di-generate`);

  // Guru accounts dari data_gtk (jika ada data migrasi)
  const gtkRows = dataMain["DataGtk"];
  if (Array.isArray(gtkRows) && gtkRows.length > 0) {
    try {
      let guruCount = 0;

      sql += `-- Guru Accounts (auto-generated dari DataGtk)\n`;

      for (let i = 0; i < gtkRows.length; i++) {
        const row = gtkRows[i];
        const mapped = mapRow(row, "DataGtk");
        if (!mapped) continue;

        const pegId = mapped.peg_id;
        if (!pegId || String(pegId).trim() === "") continue;

        // Generate random password
        const chars = "abcdefghjkmnpqrstuvwxyz23456789";
        let password = "";
        for (let c = 0; c < 8; c++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const displayName = mapped.nama_lengkap || pegId;
        // gtk_id = i + 1 karena AUTOINCREMENT mulai dari 1
        const gtkId = i + 1;

        sql += `INSERT INTO users (username, password, role, display_name, gtk_id, is_active) VALUES (${escapeSql(pegId)}, ${escapeSql(password)}, 'guru', ${escapeSql(displayName)}, ${gtkId}, 1);\n`;
        guruCount++;
      }

      sql += "\n";
      console.log(`  ✅ ${guruCount} akun guru di-generate dari DataGtk`);
    } catch (err) {
      console.error(`  ❌ Gagal membuat akun guru: ${err.message}`);
    }
  } else {
    console.log(`  ⚠️  Tidak ada data GTK untuk membuat akun guru.`);
  }

  // Tulis ke file
  fs.writeFileSync("seed.sql", sql, "utf-8");
  console.log(`\n=======================================================`);
  console.log(`✅ File seed.sql berhasil di-generate!`);
  console.log(`=======================================================`);
  console.log(`\nLangkah selanjutnya untuk setup database D1:`);
  console.log(`1. Buat database D1 (jika belum ada):`);
  console.log(`   npm run db:create`);
  console.log(`2. Terapkan skema tabel:`);
  console.log(`   npm run db:schema:local (untuk lokal)`);
  console.log(`   npm run db:schema       (untuk cloud/remote)`);
  console.log(`3. Masukkan data (seeding):`);
  console.log(`   npm run db:seed:local   (untuk lokal)`);
  console.log(`   npm run db:seed         (untuk cloud/remote)`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  SopokDate — Migrasi Data Spreadsheet → Cloudflare D1");
  console.log("═══════════════════════════════════════════════════════");

  await generateSeedFile();
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});

