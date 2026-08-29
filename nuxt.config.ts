// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  experimental: {
    appManifest: false,
  },

  srcDir: "app/",
  serverDir: "server/",
  dir: {
    public: "../public",
  },

  ssr: false,

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/main.css", "~/assets/css/print.css"],

  runtimeConfig: {
    // URL Cloudflare Worker
    apiWorkerUrl: process.env.NUXT_API_WORKER_URL,
    apiWorkerToken:
      process.env.NUXT_API_WORKER_TOKEN,
    // Mengaktifkan/menonaktifkan cache server (in-memory cache)
    enableServerCache: process.env.NUXT_ENABLE_SERVER_CACHE !== "false",
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "SopokDate",
      appLink: process.env.NUXT_PUBLIC_APP_LINK || "",
      appMadrasah: process.env.NUXT_PUBLIC_APP_MADRASAH || "",
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: "id" },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      title: "SopokDate by Bayu",
      meta: [
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        // theme-color: notifbar ikut warna bg app, support light & dark
        { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
        { name: "theme-color", content: "#18181b", media: "(prefers-color-scheme: dark)" },
        { name: "mobile-web-app-capable", content: "yes" },
      ],
      link: [
        { rel: "icon", type: "image/webp", href: "/sopokdate.webp" },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          href: "https://fonts.googleapis.com/css2?family=Meddon&display=swap",
          rel: "stylesheet",
        },
      ],
    },
  },

  hooks: {
    "pages:extend"(pages) {
      function renameRoutes(routes: any) {
        routes.forEach((route: any) => {
          let newPath = route.path;
          if (newPath.startsWith("/doc")) {
            newPath = newPath.replace(/^\/doc(\/|$)/, "/dokumen$1");
          }
          if (newPath.includes("/account")) {
            newPath = newPath.replace("/account", "/akun");
          }
          if (newPath.includes("/bulk")) {
            newPath = newPath.replace("/bulk", "/massal");
          }

          // Remap routes for Akun category
          if (newPath.startsWith("/gtk/akun")) {
            newPath = newPath.replace("/gtk/akun", "/akun/gtk");
          }
          if (newPath.startsWith("/madrasah/akun")) {
            newPath = newPath.replace("/madrasah/akun", "/akun/madrasah");
          }

          // Remap routes for Akademik category
          if (newPath.startsWith("/siswa/data")) {
            newPath = newPath.replace("/siswa/data", "/akademik/siswa");
          }
          if (newPath.startsWith("/siswa/alumni-detail")) {
            newPath = newPath.replace(
              "/siswa/alumni-detail",
              "/akademik/alumni/detail",
            );
          } else if (newPath.startsWith("/siswa/alumni")) {
            newPath = newPath.replace("/siswa/alumni", "/akademik/alumni");
          }
          if (newPath.startsWith("/siswa/mutasi-detail")) {
            newPath = newPath.replace(
              "/siswa/mutasi-detail",
              "/akademik/mutasi/detail",
            );
          } else if (newPath.startsWith("/siswa/mutasi")) {
            newPath = newPath.replace("/siswa/mutasi", "/akademik/mutasi");
          }
          if (newPath.startsWith("/siswa/detail")) {
            newPath = newPath.replace(
              "/siswa/detail",
              "/akademik/siswa/detail",
            );
          }
          if (newPath.startsWith("/gtk/data")) {
            newPath = newPath.replace("/gtk/data", "/akademik/gtk");
          }
          if (newPath.startsWith("/madrasah/rombel")) {
            newPath = newPath.replace("/madrasah/rombel", "/akademik/rombel");
          }

          route.path = newPath;
          if (route.children && route.children.length > 0) {
            renameRoutes(route.children);
          }
        });
      }
      renameRoutes(pages);
    },
  },
});
