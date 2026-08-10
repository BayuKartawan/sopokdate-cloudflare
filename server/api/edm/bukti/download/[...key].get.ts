import { requireAuth, getWorkerUrl, proxyStream } from "../../../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  // Validate token from Auth header or query param
  requireAuth(event);

  let rawKey = event.context.params?.key || getRouterParam(event, "key");
  if (!rawKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Parameter 'key' diperlukan",
    });
  }

  // Handle Nitro catch-all array vs string
  const keyPath = Array.isArray(rawKey) ? rawKey.join("/") : String(rawKey);

  const workerUrl = getWorkerUrl();
  const targetUrl = `${workerUrl}/api/edm/bukti/download/${keyPath}`;
  return await proxyStream(targetUrl, event);
});
