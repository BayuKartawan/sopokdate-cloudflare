// handlers/auth.ts
import { jsonResponse, errorResponse, generateRandomPassword } from "../utils";
import type { Env } from "../types";

// ---------------------------------------------------------------------------
// POST /api/auth/login — Login dengan username & password dari tabel users
// ---------------------------------------------------------------------------
export async function handleAuthLogin(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return errorResponse("Username dan password diperlukan");
  }

  try {
    const user = await env.DB.prepare(
      "SELECT id, username, password, role, display_name, gtk_id, is_active FROM users WHERE username = ?"
    )
      .bind(username)
      .first<{
        id: number;
        username: string;
        password?: string;
        role: string;
        display_name: string;
        gtk_id: number | null;
        is_active: number;
      }>();

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
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/seed-guru — Buat akun guru otomatis dari data_gtk
// Membuat akun untuk semua GTK yang punya peg_id dan belum punya akun
// ---------------------------------------------------------------------------
export async function handleSeedGuru(env: Env): Promise<Response> {
  try {
    // Ambil semua GTK yang punya peg_id
    const gtkRows = await env.DB.prepare(
      "SELECT id, nama_lengkap, peg_id FROM data_gtk WHERE peg_id IS NOT NULL AND peg_id != ''"
    ).all<{ id: number; nama_lengkap: string | null; peg_id: string }>();

    if (!gtkRows.results || gtkRows.results.length === 0) {
      return jsonResponse({
        success: true,
        message: "Tidak ada data GTK dengan Peg ID",
        created: 0,
      });
    }

    let created = 0;
    let skipped = 0;
    const createdAccounts: Array<{
      username: string;
      password: string;
      display_name: string | null;
      gtk_id: number;
    }> = [];

    for (const gtk of gtkRows.results) {
      // Cek apakah sudah ada akun untuk gtk ini
      const existing = await env.DB.prepare(
        "SELECT id FROM users WHERE gtk_id = ?"
      )
        .bind(gtk.id)
        .first<{ id: number }>();

      if (existing) {
        skipped++;
        continue;
      }

      // Cek apakah username (peg_id) sudah dipakai
      const usernameExists = await env.DB.prepare(
        "SELECT id FROM users WHERE username = ?"
      )
        .bind(gtk.peg_id)
        .first<{ id: number }>();

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
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/users — Daftar semua akun (admin only)
// ---------------------------------------------------------------------------
export async function handleGetUsers(env: Env): Promise<Response> {
  try {
    const users = await env.DB.prepare(
      `SELECT u.id, u.username, u.password, u.role, u.display_name, u.gtk_id, u.is_active, u.created_at,
              g.nama_lengkap as gtk_nama, g.peg_id as gtk_peg_id, g.nuptk as gtk_nuptk
       FROM users u
       LEFT JOIN data_gtk g ON u.gtk_id = g.id
       ORDER BY u.role ASC, u.display_name ASC`
    ).all<{
      id: number;
      username: string;
      password?: string;
      role: string;
      display_name: string;
      gtk_id: number | null;
      is_active: number;
      created_at: string;
      gtk_nama: string | null;
      gtk_peg_id: string | null;
      gtk_nuptk: string | null;
    }>();

    return jsonResponse(users.results);
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/auth/users/:id — Update akun user (admin: reset password, toggle active)
// ---------------------------------------------------------------------------
export async function handleUpdateUser(request: Request, env: Env, userId: string): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const updates: string[] = [];
  const params: any[] = [];

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
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/auth/users/:id — Hapus akun user (admin only)
// ---------------------------------------------------------------------------
export async function handleDeleteUser(env: Env, userId: string): Promise<Response> {
  try {
    await env.DB.prepare("DELETE FROM users WHERE id = ?")
      .bind(parseInt(userId))
      .run();

    return jsonResponse({
      success: true,
      message: "Akun berhasil dihapus",
    });
  } catch (err: any) {
    return errorResponse(`Database error: ${err.message}`, 500);
  }
}
