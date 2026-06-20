import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV file
const csvPath = path.join(__dirname, 'Data MIS NW Penyenggir - Alumni.csv');
const content = fs.readFileSync(csvPath, 'utf8');

// A simple but robust CSV parser that handles quotes and commas
function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}

const rows = parseCSV(content);
const headers = rows[0];
const dataRows = rows.slice(1).filter(r => r.length > 1 && r[1]); // must have a name

console.log(`Parsed ${dataRows.length} alumni rows from CSV.`);

// Generate SQL file
let sql = `-- Seeding data alumni asli dari CSV (hanya untuk remote D1)\n`;
sql += `DELETE FROM alumni;\n\n`;
sql += `INSERT INTO alumni (id, nama, foto, nis_lokal, nisn, nik, no_kk, tempat_lahir, tanggal_lahir, umur, jenis_kelamin, status, thn_lulus, menjutkan_ke, alamat, no_hp, no_kip, nama_ayah_kandung, nama_ibu_kandung, nama_wali) VALUES\n`;

const escapeSQL = (val) => {
  if (val === undefined || val === null) return "''";
  const str = String(val).trim();
  // Escape single quotes for SQL
  return `'` + str.replace(/'/g, "''") + `'`;
};

const valueRows = dataRows.map((row) => {
  const id = parseInt(row[0]) || null;
  const nama = row[1];
  const foto = row[2] === '0' || !row[2] || row[2] === 'Github' ? '' : row[2];
  const nis_lokal = row[3];
  const nisn = row[4];
  const nik = String(row[5] || '').replace(/'/g, ""); // remove lead quotes if any e.g. '5203...
  const tempat_lahir = row[6];
  const tanggal_lahir = row[7];
  const umur = row[8];
  const jenis_kelamin = row[9];
  const status = row[10];
  const thn_lulus = row[11];
  const menjutkan_ke = row[12];
  const alamat = row[13];
  const no_hp = row[14]; // maps to no_hp in database
  const no_kip = row[15];
  const nama_ayah = row[16];
  const nama_ibu = row[17];
  const nama_wali = row[18] || '';

  return `(${id}, ${escapeSQL(nama)}, ${escapeSQL(foto)}, ${escapeSQL(nis_lokal)}, ${escapeSQL(nisn)}, ${escapeSQL(nik)}, '', ${escapeSQL(tempat_lahir)}, ${escapeSQL(tanggal_lahir)}, ${escapeSQL(umur)}, ${escapeSQL(jenis_kelamin)}, ${escapeSQL(status)}, ${escapeSQL(thn_lulus)}, ${escapeSQL(menjutkan_ke)}, ${escapeSQL(alamat)}, ${escapeSQL(no_hp)}, ${escapeSQL(no_kip)}, ${escapeSQL(nama_ayah)}, ${escapeSQL(nama_ibu)}, ${escapeSQL(nama_wali)})`;
});

sql += valueRows.join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, 'seed_alumni_remote.sql'), sql, 'utf8');
console.log('Successfully generated seed_alumni_remote.sql');
