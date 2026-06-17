// handlers/surat.js
import { jsonResponse, errorResponse } from "../utils.js";

// ---------------------------------------------------------------------------
// Handler: GET /api/surat — Ambil data template surat
// (pengganti doGet AppScript DB Surat)
// ---------------------------------------------------------------------------
export async function handleGetSurat(env) {
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
