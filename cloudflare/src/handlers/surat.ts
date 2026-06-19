// handlers/surat.ts
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";

interface PlaceholderOption {
  key: string;
  label: string;
  type: string;
  options?: string[];
  default?: string;
}

interface SuratTemplate {
  templatePath: string;
  templateType: string;
  placeholder: PlaceholderOption[];
}

// ---------------------------------------------------------------------------
// Handler: GET /api/surat — Ambil data template surat
// (pengganti doGet AppScript DB Surat)
// ---------------------------------------------------------------------------
export async function handleGetSurat(env: Env): Promise<Response> {
  try {
    // Ambil semua template path
    const templates = await env.DB.prepare(
      "SELECT surat_type, template_path, template_type FROM template_path",
    ).all<{
      surat_type: string;
      template_path: string;
      template_type: string;
    }>();

    // Ambil semua placeholders
    const allPlaceholders = await env.DB.prepare(
      "SELECT surat_type, key, label, type, options, default_value FROM placeholders ORDER BY sort_order ASC",
    ).all<{
      surat_type: string;
      key: string;
      label: string;
      type: string | null;
      options: string | null;
      default_value: string | null;
    }>();

    // Bangun templateMap (format sama dengan output AppScript)
    const templateMap: Record<string, SuratTemplate> = {};

    if (templates.results) {
      for (const tpl of templates.results) {
        templateMap[tpl.surat_type] = {
          templatePath: tpl.template_path,
          templateType: tpl.template_type,
          placeholder: [],
        };
      }
    }

    if (allPlaceholders.results) {
      for (const ph of allPlaceholders.results) {
        if (templateMap[ph.surat_type]) {
          const placeholder: PlaceholderOption = {
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
                .map((opt: string) => opt.trim())
                .filter((opt: string) => opt.length > 0);
            }
          }

          // Tambahkan default value jika ada
          if (ph.default_value) {
            placeholder.default = ph.default_value;
          }

          templateMap[ph.surat_type].placeholder.push(placeholder);
        }
      }
    }

    return jsonResponse(templateMap);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
