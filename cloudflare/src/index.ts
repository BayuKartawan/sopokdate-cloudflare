// index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  handleGetData,
  handlePostData,
  handlePutData,
  handleDeleteData,
} from "./handlers/data";
import {
  handleGetSurat,
  handleGetAllSurat,
  handlePostSurat,
  handlePutSurat,
  handleDeleteSurat,
} from "./handlers/surat";
import {
  handleAuthLogin,
  handleSeedGuru,
  handleGetUsers,
  handleUpdateUser,
  handleDeleteUser,
} from "./handlers/auth";
import {
  handleGetMenuAksesRole,
  handleSaveMenuAksesRole,
  handleGetMenuAksesUser,
  handleSaveMenuAksesUser,
  handleResetMenuAksesUser,
  handleGetMyMenuAkses,
} from "./handlers/menu-akses";
import {
  handleGetAbsensi,
  handlePostAbsensi,
  handleGetAbsensiRekap,
  handleGetAbsensiRekapStatus,
} from "./handlers/absensi";
import {
  handleGetMapelGuru,
  handleGetJenisAsesmen,
  handlePostJenisAsesmen,
  handleDeleteJenisAsesmen,
  handleGetNilai,
  handlePostNilai,
} from "./handlers/asesmen";
import {
  handleGetEdmTahunAnggaran,
  handlePostEdmTahunAnggaran,
  handleDeleteEdmTahunAnggaran,
  handleGetEdmKelompok,
  handlePostEdmKelompok,
  handleGetEdmBagian,
  handlePostEdmBagian,
  handleGetEdmIndikator,
  handlePostEdmIndikator,
  handlePutEdmIndikator,
  handleDeleteEdmIndikator,
  handleGetEdmJawaban,
  handlePostEdmJawaban,
  handleGetEdmRekap,
} from "./handlers/edm";

import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// CORS Middleware
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

// API Key Validation Middleware
app.use("/api/*", async (c, next) => {
  // Exclude login
  if (c.req.path === "/api/auth/login") {
    await next();
    return;
  }

  const authHeader = c.req.header("Authorization");
  const expectedToken = c.env.API_KEY;

  if (!expectedToken) {
    return c.json(
      { error: "Server configuration error: API_KEY is missing" },
      500,
    );
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return c.json({ error: "Unauthorized: Invalid or missing API Key" }, 401);
  }

  await next();
});

// Routing definition
app.get("/", (c) => {
  return c.json({
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
      "GET  /api/surat/all",
      "POST /api/surat",
      "PUT  /api/surat/:suratType",
      "DELETE /api/surat/:suratType",
      "POST /api/data",
      "POST /api/absensi",
      "POST /api/auth/login",
      "POST /api/auth/seed-guru",
      "GET  /api/auth/users",
      "PUT  /api/auth/users/:id",
      "DELETE /api/auth/users/:id",
      "GET  /api/menu-akses/role",
      "PUT  /api/menu-akses/role",
      "GET  /api/menu-akses/user",
      "PUT  /api/menu-akses/user",
      "DELETE /api/menu-akses/user",
      "GET  /api/menu-akses/my",
    ],
  });
});

app.get("/api/data", async (c) => {
  return await handleGetData(c.req.raw, c.env);
});

app.get("/api/absensi", async (c) => {
  return await handleGetAbsensi(c.req.raw, c.env);
});

app.get("/api/absensi/rekap", async (c) => {
  return await handleGetAbsensiRekap(c.req.raw, c.env);
});

app.get("/api/absensi/rekap-status", async (c) => {
  return await handleGetAbsensiRekapStatus(c.req.raw, c.env);
});

app.get("/api/surat", async (c) => {
  return await handleGetSurat(c.env);
});

app.get("/api/surat/all", async (c) => {
  return await handleGetAllSurat(c.env);
});

app.post("/api/surat", async (c) => {
  return await handlePostSurat(c.req.raw, c.env);
});

app.put("/api/surat/:suratType", async (c) => {
  const suratType = c.req.param("suratType");
  return await handlePutSurat(c.req.raw, c.env, suratType);
});

app.delete("/api/surat/:suratType", async (c) => {
  const suratType = c.req.param("suratType");
  return await handleDeleteSurat(c.env, suratType);
});

app.get("/api/auth/users", async (c) => {
  return await handleGetUsers(c.env);
});

app.post("/api/data", async (c) => {
  return await handlePostData(c.req.raw, c.env);
});

app.post("/api/absensi", async (c) => {
  return await handlePostAbsensi(c.req.raw, c.env);
});

app.post("/api/auth/seed-guru", async (c) => {
  return await handleSeedGuru(c.env);
});

app.post("/api/auth/login", async (c) => {
  return await handleAuthLogin(c.req.raw, c.env);
});

app.put("/api/data", async (c) => {
  return await handlePutData(c.req.raw, c.env);
});

app.put("/api/auth/users/:id", async (c) => {
  const id = c.req.param("id");
  return await handleUpdateUser(c.req.raw, c.env, id);
});

app.delete("/api/data", async (c) => {
  return await handleDeleteData(c.req.raw, c.env);
});

app.delete("/api/auth/users/:id", async (c) => {
  const id = c.req.param("id");
  return await handleDeleteUser(c.env, id);
});

// --- Menu Akses Routes ---
app.get("/api/menu-akses/role", async (c) => {
  return await handleGetMenuAksesRole(c.req.raw, c.env);
});

app.put("/api/menu-akses/role", async (c) => {
  return await handleSaveMenuAksesRole(c.req.raw, c.env);
});

app.get("/api/menu-akses/user", async (c) => {
  return await handleGetMenuAksesUser(c.req.raw, c.env);
});

app.put("/api/menu-akses/user", async (c) => {
  return await handleSaveMenuAksesUser(c.req.raw, c.env);
});

app.delete("/api/menu-akses/user", async (c) => {
  return await handleResetMenuAksesUser(c.req.raw, c.env);
});

app.get("/api/menu-akses/my", async (c) => {
  return await handleGetMyMenuAkses(c.req.raw, c.env);
});

// --- Asesmen Routes ---
app.get("/api/asesmen/mapel-guru", async (c) => {
  return await handleGetMapelGuru(c.req.raw, c.env);
});

app.get("/api/asesmen/jenis", async (c) => {
  return await handleGetJenisAsesmen(c.req.raw, c.env);
});

app.post("/api/asesmen/jenis", async (c) => {
  return await handlePostJenisAsesmen(c.req.raw, c.env);
});

app.delete("/api/asesmen/jenis/:id", async (c) => {
  const id = c.req.param("id");
  return await handleDeleteJenisAsesmen(c.req.raw, c.env, id);
});

app.get("/api/asesmen/nilai", async (c) => {
  return await handleGetNilai(c.req.raw, c.env);
});

app.post("/api/asesmen/nilai", async (c) => {
  return await handlePostNilai(c.req.raw, c.env);
});

// --- EDM (Evaluasi Diri Madrasah) Routes ---
app.get("/api/edm/tahun-anggaran", async (c) => {
  return await handleGetEdmTahunAnggaran(c.req.raw, c.env);
});

app.post("/api/edm/tahun-anggaran", async (c) => {
  return await handlePostEdmTahunAnggaran(c.req.raw, c.env);
});

app.delete("/api/edm/tahun-anggaran/:id", async (c) => {
  const id = c.req.param("id");
  return await handleDeleteEdmTahunAnggaran(c.req.raw, c.env, id);
});

app.get("/api/edm/bagian", async (c) => {
  return await handleGetEdmBagian(c.req.raw, c.env);
});

app.post("/api/edm/bagian", async (c) => {
  return await handlePostEdmBagian(c.req.raw, c.env);
});

app.get("/api/edm/kelompok", async (c) => {
  return await handleGetEdmKelompok(c.req.raw, c.env);
});

app.post("/api/edm/kelompok", async (c) => {
  return await handlePostEdmKelompok(c.req.raw, c.env);
});

app.get("/api/edm/indikator", async (c) => {
  return await handleGetEdmIndikator(c.req.raw, c.env);
});

app.post("/api/edm/indikator", async (c) => {
  return await handlePostEdmIndikator(c.req.raw, c.env);
});

app.put("/api/edm/indikator/:id", async (c) => {
  const id = c.req.param("id");
  return await handlePutEdmIndikator(c.req.raw, c.env, id);
});

app.delete("/api/edm/indikator/:id", async (c) => {
  const id = c.req.param("id");
  return await handleDeleteEdmIndikator(c.req.raw, c.env, id);
});

app.get("/api/edm/jawaban", async (c) => {
  return await handleGetEdmJawaban(c.req.raw, c.env);
});

app.post("/api/edm/jawaban", async (c) => {
  return await handlePostEdmJawaban(c.req.raw, c.env);
});

app.get("/api/edm/rekap", async (c) => {
  return await handleGetEdmRekap(c.req.raw, c.env);
});

export default app;
