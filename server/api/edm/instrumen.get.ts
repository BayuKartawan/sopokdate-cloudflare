import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId: tokenGtkId } = requireAuth(event);
  const query = getQuery(event);
  const kategori = (query.kategori as string) || (query.bagian_target as string);

  const workerUrl = getWorkerUrl();
  let targetUrl = `${workerUrl}/api/edm/instrumen`;
  if (kategori) {
    targetUrl += `?kategori=${encodeURIComponent(kategori)}`;
  }
  return await proxyGet(targetUrl, role, tokenGtkId);
});
