// index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  handleGetData,
  handlePostData,
  handlePutData,
  handleDeleteData,
} from "./handlers/data";
import { handleGetSurat } from "./handlers/surat";
import {
  handleAuthLogin,
  handleSeedGuru,
  handleGetUsers,
  handleUpdateUser,
  handleDeleteUser,
} from "./handlers/auth";
import {
  handleGetAbsensi,
  handlePostAbsensi,
  handleGetAbsensiRekap,
} from "./handlers/absensi";

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
      "POST /api/data",
      "POST /api/absensi",
      "POST /api/auth/login",
      "POST /api/auth/seed-guru",
      "GET  /api/auth/users",
      "PUT  /api/auth/users/:id",
      "DELETE /api/auth/users/:id",
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

app.get("/api/surat", async (c) => {
  return await handleGetSurat(c.env);
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

export default app;
