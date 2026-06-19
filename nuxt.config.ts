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
    // URL Cloudflare Worker (menggantikan URL AppScript)
    apiWorkerUrl: process.env.NUXT_API_WORKER_URL || "http://localhost:8787",
    apiWorkerToken:
      process.env.NUXT_API_WORKER_TOKEN || "sopokdate_secret_token_123",
    // URL AppScript lama (simpan sebagai fallback, bisa dihapus nanti)
    apiUrlUtama: process.env.NUXT_PUBLIC_API_URL_UTAMA || "",
    apiUrlSurat: process.env.NUXT_PUBLIC_API_URL_SURAT || "",
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "",
      appLink: process.env.NUXT_PUBLIC_APP_LINK || "",
      appMadrasah: process.env.NUXT_PUBLIC_APP_MADRASAH || "",
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: "id" },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "SopokDate",
      link: [
        { rel: "icon", type: "image/webp", href: "/logoMadrasah.webp" },
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
