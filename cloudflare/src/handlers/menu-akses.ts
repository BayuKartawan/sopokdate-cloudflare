// handlers/menu-akses.ts
// Handler untuk pengelolaan akses menu per role dan per user
import { jsonResponse, errorResponse } from "../utils";
import type { Env } from "../types";

// ---------------------------------------------------------------------------
// Daftar semua menu key yang tersedia di sistem
// Digunakan sebagai referensi untuk validasi dan seeding default
// ---------------------------------------------------------------------------
const ALL_MENU_KEYS: string[] = [
  "/",
  "/akun/gtk/kelola",
  "/akun/gtk/emis",
  "/akun/gtk/email",
  "/akun/gtk/rdm",
  "/akun/gtk/emis-gtk",
  "/akun/gtk/simpatika",
  "/akun/madrasah",
  "/akun/gtk/pengelola-akses",
  "/akademik/gtk",
  "/akademik/siswa",
  "/akademik/rombel",
  "/akademik/alumni",
  "/akademik/mutasi",
  "/jadwal/kurikulum",
  "/jadwal/alokasi",
  "/jadwal/buat",
  "/jadwal/cetak",
  "/absensi/kalender",
  "/absensi/siswa",
  "/absensi/rekap",
  "/madrasah/data",
  "/madrasah/berkas",
  "/madrasah/aplikasi",
  "/dokumen/surat",
  "/dokumen/sertifikat",
  "/dokumen/sampul",
  "/dokumen/pas-foto",
  "/bos/penerimaan-honor",
  "/bos/kuitansi",
  "/bos/nota",
];

// ---------------------------------------------------------------------------
// GET /api/menu-akses/role?role=guru — Ambil akses menu default per role
// ---------------------------------------------------------------------------
export async function handleGetMenuAksesRole(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  if (!role) {
    return errorResponse("Parameter 'role' diperlukan", 400);
  }

  try {
    const rows = await env.DB.prepare(
      "SELECT menu_key, is_allowed FROM menu_akses_role WHERE role = ?",
    )
      .bind(role)
      .all<{ menu_key: string; is_allowed: number }>();

    return jsonResponse({
      success: true,
      role,
      menu_akses: rows.results,
      all_menu_keys: ALL_MENU_KEYS,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/menu-akses/role — Simpan/update akses menu per role (batch upsert)
// Body: { role: string, items: [{ menu_key: string, is_allowed: number }] }
// ---------------------------------------------------------------------------
export async function handleSaveMenuAksesRole(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { role, items } = body as {
    role?: string;
    items?: Array<{ menu_key: string; is_allowed: number }>;
  };

  if (!role || !items || !Array.isArray(items)) {
    return errorResponse("'role' dan 'items' (array) diperlukan", 400);
  }

  try {
    // Batch upsert menggunakan INSERT OR REPLACE
    const stmts = items.map((item) =>
      env.DB.prepare(
        `INSERT INTO menu_akses_role (role, menu_key, is_allowed, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(role, menu_key) DO UPDATE SET
           is_allowed = excluded.is_allowed,
           updated_at = datetime('now')`,
      ).bind(role, item.menu_key, item.is_allowed ? 1 : 0),
    );

    await env.DB.batch(stmts);

    return jsonResponse({
      success: true,
      message: `Berhasil menyimpan ${items.length} pengaturan akses untuk role '${role}'`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/menu-akses/user?user_id=5 — Ambil akses menu custom per user
// ---------------------------------------------------------------------------
export async function handleGetMenuAksesUser(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return errorResponse("Parameter 'user_id' diperlukan", 400);
  }

  try {
    const rows = await env.DB.prepare(
      "SELECT menu_key, is_allowed FROM menu_akses_user WHERE user_id = ?",
    )
      .bind(parseInt(userId))
      .all<{ menu_key: string; is_allowed: number }>();

    return jsonResponse({
      success: true,
      user_id: parseInt(userId),
      menu_akses: rows.results,
      has_custom: rows.results.length > 0,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/menu-akses/user — Simpan/update akses menu per user (batch upsert)
// Body: { user_id: number, items: [{ menu_key: string, is_allowed: number }] }
// ---------------------------------------------------------------------------
export async function handleSaveMenuAksesUser(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { user_id, items } = body as {
    user_id?: number;
    items?: Array<{ menu_key: string; is_allowed: number }>;
  };

  if (!user_id || !items || !Array.isArray(items)) {
    return errorResponse("'user_id' dan 'items' (array) diperlukan", 400);
  }

  try {
    const stmts = items.map((item) =>
      env.DB.prepare(
        `INSERT INTO menu_akses_user (user_id, menu_key, is_allowed, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, menu_key) DO UPDATE SET
           is_allowed = excluded.is_allowed,
           updated_at = datetime('now')`,
      ).bind(user_id, item.menu_key, item.is_allowed ? 1 : 0),
    );

    await env.DB.batch(stmts);

    return jsonResponse({
      success: true,
      message: `Berhasil menyimpan ${items.length} pengaturan akses untuk user ID ${user_id}`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/menu-akses/user?user_id=5 — Reset akses user ke default role
// ---------------------------------------------------------------------------
export async function handleResetMenuAksesUser(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return errorResponse("Parameter 'user_id' diperlukan", 400);
  }

  try {
    await env.DB.prepare("DELETE FROM menu_akses_user WHERE user_id = ?")
      .bind(parseInt(userId))
      .run();

    return jsonResponse({
      success: true,
      message: `Akses menu user ID ${userId} berhasil direset ke default role`,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/menu-akses/my?user_id=5&role=guru — Ambil akses menu untuk user yang login
// Logika: jika ada custom per-user → pakai itu, jika tidak → pakai default role
// ---------------------------------------------------------------------------
export async function handleGetMyMenuAkses(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const role = url.searchParams.get("role");

  if (!userId || !role) {
    return errorResponse("Parameter 'user_id' dan 'role' diperlukan", 400);
  }

  // Admin selalu dapat akses penuh
  if (role === "admin") {
    return jsonResponse({
      success: true,
      source: "admin_full_access",
      allowed_menus: ALL_MENU_KEYS,
    });
  }

  try {
    // 1. Cek apakah user punya custom akses
    const userAkses = await env.DB.prepare(
      "SELECT menu_key, is_allowed FROM menu_akses_user WHERE user_id = ?",
    )
      .bind(parseInt(userId))
      .all<{ menu_key: string; is_allowed: number }>();

    if (userAkses.results.length > 0) {
      // Gunakan akses custom per-user
      const allowedMenus = userAkses.results
        .filter((row) => row.is_allowed === 1)
        .map((row) => row.menu_key);

      return jsonResponse({
        success: true,
        source: "user_custom",
        allowed_menus: allowedMenus,
      });
    }

    // 2. Fallback ke akses default role
    const roleAkses = await env.DB.prepare(
      "SELECT menu_key, is_allowed FROM menu_akses_role WHERE role = ?",
    )
      .bind(role)
      .all<{ menu_key: string; is_allowed: number }>();

    if (roleAkses.results.length > 0) {
      const allowedMenus = roleAkses.results
        .filter((row) => row.is_allowed === 1)
        .map((row) => row.menu_key);

      return jsonResponse({
        success: true,
        source: "role_default",
        allowed_menus: allowedMenus,
      });
    }

    // 3. Jika belum ada pengaturan sama sekali, beri akses penuh (semua menu)
    // Ini untuk backward compatibility — sebelum admin mengatur akses
    return jsonResponse({
      success: true,
      source: "no_config",
      allowed_menus: ALL_MENU_KEYS,
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
