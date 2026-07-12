// handlers/surat.ts
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";

interface PlaceholderOption {
  key: string;
  label: string;
  type: string;
  options?: string[];
  default?: string;
  is_required?: number;
}

interface SuratTemplate {
  templatePath: string;
  templateType: string;
  description?: string;
  is_active?: number;
  placeholder: PlaceholderOption[];
}

// ---------------------------------------------------------------------------
// Handler: GET /api/surat — Ambil data template surat (hanya yang aktif)
// ---------------------------------------------------------------------------
export async function handleGetSurat(env: Env): Promise<Response> {
  try {
    // Ambil semua template path yang aktif
    const templates = await env.DB.prepare(
      "SELECT surat_type, template_path, template_type, description, is_active FROM template_path WHERE is_active = 1",
    ).all<{
      surat_type: string;
      template_path: string;
      template_type: string;
      description: string | null;
      is_active: number;
    }>();

    // Ambil semua placeholders
    const allPlaceholders = await env.DB.prepare(
      "SELECT surat_type, key, label, type, options, default_value, is_required FROM placeholders ORDER BY sort_order ASC",
    ).all<{
      surat_type: string;
      key: string;
      label: string;
      type: string | null;
      options: string | null;
      default_value: string | null;
      is_required: number;
    }>();

    // Bangun templateMap
    const templateMap: Record<string, SuratTemplate> = {};

    if (templates.results) {
      for (const tpl of templates.results) {
        templateMap[tpl.surat_type] = {
          templatePath: tpl.template_path,
          templateType: tpl.template_type,
          description: tpl.description || "",
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

// ---------------------------------------------------------------------------
// Handler: GET /api/surat/all — Ambil SEMUA template (aktif & nonaktif) untuk admin
// ---------------------------------------------------------------------------
export async function handleGetAllSurat(env: Env): Promise<Response> {
  try {
    const templates = await env.DB.prepare(
      "SELECT id, surat_type, template_path, template_type, description, is_active, created_at, updated_at FROM template_path ORDER BY surat_type ASC",
    ).all<{
      id: number;
      surat_type: string;
      template_path: string;
      template_type: string;
      description: string | null;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>();

    const allPlaceholders = await env.DB.prepare(
      "SELECT id, surat_type, key, label, type, options, default_value, is_required, sort_order FROM placeholders ORDER BY sort_order ASC",
    ).all<{
      id: number;
      surat_type: string;
      key: string;
      label: string;
      type: string | null;
      options: string | null;
      default_value: string | null;
      is_required: number;
      sort_order: number;
    }>();

    // Group placeholders by surat_type
    const phMap: Record<string, any[]> = {};
    if (allPlaceholders.results) {
      for (const ph of allPlaceholders.results) {
        if (!phMap[ph.surat_type]) {
          phMap[ph.surat_type] = [];
        }
        phMap[ph.surat_type].push({
          id: ph.id,
          key: ph.key,
          label: ph.label,
          type: ph.type || "text",
          options: ph.options || "",
          default_value: ph.default_value || "",
          is_required: ph.is_required ?? 1,
          sort_order: ph.sort_order ?? 0,
        });
      }
    }

    const result = (templates.results || []).map((tpl) => ({
      id: tpl.id,
      surat_type: tpl.surat_type,
      template_path: tpl.template_path,
      template_type: tpl.template_type,
      description: tpl.description || "",
      is_active: tpl.is_active,
      created_at: tpl.created_at,
      updated_at: tpl.updated_at,
      placeholders: phMap[tpl.surat_type] || [],
    }));

    return jsonResponse(result);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: POST /api/surat — Buat template surat baru beserta placeholder
// ---------------------------------------------------------------------------
export async function handlePostSurat(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { surat_type, template_path, template_type, description, placeholders } = body as {
    surat_type?: string;
    template_path?: string;
    template_type?: string;
    description?: string;
    placeholders?: any[];
  };

  if (!surat_type || !surat_type.trim()) {
    return errorResponse("Parameter 'surat_type' is required");
  }
  if (!template_path || !template_path.trim()) {
    return errorResponse("Parameter 'template_path' is required");
  }

  try {
    // Cek apakah surat_type sudah ada
    const existing = await env.DB.prepare(
      "SELECT id FROM template_path WHERE surat_type = ?",
    )
      .bind(surat_type.trim())
      .first();

    if (existing) {
      return errorResponse(
        `Template surat '${surat_type}' sudah ada. Gunakan update untuk mengubahnya.`,
        409,
      );
    }

    // Insert template_path
    await env.DB.prepare(
      "INSERT INTO template_path (surat_type, template_path, template_type, description) VALUES (?, ?, ?, ?)",
    )
      .bind(
        surat_type.trim(),
        template_path.trim(),
        (template_type || "docx").trim(),
        (description || "").trim(),
      )
      .run();

    // Insert placeholders jika ada
    if (Array.isArray(placeholders) && placeholders.length > 0) {
      for (let i = 0; i < placeholders.length; i++) {
        const ph = placeholders[i];
        if (!ph.key || !ph.label) continue;

        const optionsStr =
          ph.type === "select" && ph.options
            ? typeof ph.options === "string"
              ? ph.options
              : JSON.stringify(ph.options)
            : null;

        await env.DB.prepare(
          "INSERT INTO placeholders (surat_type, key, label, type, options, default_value, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            surat_type.trim(),
            ph.key.trim(),
            ph.label.trim(),
            ph.type || "text",
            optionsStr,
            ph.default_value || null,
            ph.is_required !== undefined ? ph.is_required : 1,
            ph.sort_order !== undefined ? ph.sort_order : i,
          )
          .run();
      }
    }

    return jsonResponse({
      success: true,
      message: `Template surat '${surat_type}' berhasil ditambahkan`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: PUT /api/surat — Update template surat dan placeholder
// ---------------------------------------------------------------------------
export async function handlePutSurat(
  request: Request,
  env: Env,
  suratType: string,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  if (!suratType) {
    return errorResponse("Parameter 'suratType' is required");
  }

  const decodedType = decodeURIComponent(suratType);

  try {
    // Cek apakah template ada
    const existing = await env.DB.prepare(
      "SELECT id FROM template_path WHERE surat_type = ?",
    )
      .bind(decodedType)
      .first();

    if (!existing) {
      return errorResponse(`Template surat '${decodedType}' tidak ditemukan`, 404);
    }

    // Update template_path fields
    const updates: string[] = [];
    const params: any[] = [];

    if (body.template_path !== undefined) {
      updates.push("template_path = ?");
      params.push(body.template_path);
    }
    if (body.template_type !== undefined) {
      updates.push("template_type = ?");
      params.push(body.template_type);
    }
    if (body.description !== undefined) {
      updates.push("description = ?");
      params.push(body.description);
    }
    if (body.is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(body.is_active);
    }
    if (body.surat_type !== undefined && body.surat_type !== decodedType) {
      updates.push("surat_type = ?");
      params.push(body.surat_type.trim());
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(decodedType);

      await env.DB.prepare(
        `UPDATE template_path SET ${updates.join(", ")} WHERE surat_type = ?`,
      )
        .bind(...params)
        .run();
    }

    // Jika ada rename surat_type, update juga di placeholders
    const effectiveType =
      body.surat_type && body.surat_type !== decodedType
        ? body.surat_type.trim()
        : decodedType;

    // Replace strategy: hapus semua placeholder lama, insert baru
    if (Array.isArray(body.placeholders)) {
      await env.DB.prepare(
        "DELETE FROM placeholders WHERE surat_type = ?",
      )
        .bind(effectiveType)
        .run();

      for (let i = 0; i < body.placeholders.length; i++) {
        const ph = body.placeholders[i];
        if (!ph.key || !ph.label) continue;

        const optionsStr =
          ph.type === "select" && ph.options
            ? typeof ph.options === "string"
              ? ph.options
              : JSON.stringify(ph.options)
            : null;

        await env.DB.prepare(
          "INSERT INTO placeholders (surat_type, key, label, type, options, default_value, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            effectiveType,
            ph.key.trim(),
            ph.label.trim(),
            ph.type || "text",
            optionsStr,
            ph.default_value || null,
            ph.is_required !== undefined ? ph.is_required : 1,
            ph.sort_order !== undefined ? ph.sort_order : i,
          )
          .run();
      }
    }

    return jsonResponse({
      success: true,
      message: `Template surat '${effectiveType}' berhasil diperbarui`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// Handler: DELETE /api/surat — Hapus template surat (CASCADE ke placeholder)
// ---------------------------------------------------------------------------
export async function handleDeleteSurat(
  env: Env,
  suratType: string,
): Promise<Response> {
  if (!suratType) {
    return errorResponse("Parameter 'suratType' is required");
  }

  const decodedType = decodeURIComponent(suratType);

  try {
    // Cek apakah template ada
    const existing = await env.DB.prepare(
      "SELECT id FROM template_path WHERE surat_type = ?",
    )
      .bind(decodedType)
      .first();

    if (!existing) {
      return errorResponse(`Template surat '${decodedType}' tidak ditemukan`, 404);
    }

    // Hapus placeholder dulu (untuk kompatibilitas jika PRAGMA foreign_keys tidak aktif)
    await env.DB.prepare(
      "DELETE FROM placeholders WHERE surat_type = ?",
    )
      .bind(decodedType)
      .run();

    // Hapus template
    await env.DB.prepare(
      "DELETE FROM template_path WHERE surat_type = ?",
    )
      .bind(decodedType)
      .run();

    return jsonResponse({
      success: true,
      message: `Template surat '${decodedType}' berhasil dihapus`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
