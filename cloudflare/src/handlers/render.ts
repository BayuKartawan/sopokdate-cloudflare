import puppeteer from "@cloudflare/puppeteer";
import type { Context } from "hono";
import type { Env } from "../types";
import { errorResponse } from "../utils";

export const handleScreenshotHtml = async (c: Context<{ Bindings: Env }>) => {
  const env = c.env;

  if (!env.MYBROWSER) {
    return errorResponse("Cloudflare Browser Rendering (MYBROWSER) belum terhubung", 500);
  }

  try {
    const body = await c.req.json();
    const { html, width = 800, quality = 90 } = body;

    if (!html || typeof html !== "string") {
      return errorResponse("Parameter 'html' harus berupa string HTML yang valid", 400);
    }

    // 1. Coba Cloudflare Browser Quick Actions API jika tersedia
    if (typeof (env.MYBROWSER as any).quickAction === "function") {
      try {
        return await (env.MYBROWSER as any).quickAction("screenshot", {
          viewport: {
            width: Number(width) || 850,
            height: 1000,
          },
          screenshotOptions: {
            type: "jpeg",
            quality: Math.min(100, Math.max(10, Number(quality) || 92)),
          },
          html,
        });
      } catch (qaErr) {
        console.warn("quickAction gagal, mencoba Puppeteer launch:", qaErr);
      }
    }

    // 2. Puppeteer launch fallback
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();

    await page.setViewport({
      width: Number(width) || 850,
      height: 1000,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const screenshot = (await page.screenshot({
      type: "jpeg",
      quality: Math.min(100, Math.max(10, Number(quality) || 92)),
      fullPage: true,
    })) as Uint8Array;

    await browser.close();

    return new Response(screenshot, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Gagal generate screenshot via Cloudflare Browser Rendering:", error);
    return errorResponse(`Gagal generate screenshot: ${error.message || "Unknown error"}`, 500);
  }
};
