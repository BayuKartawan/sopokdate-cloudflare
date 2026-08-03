import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId } = requireAuth(event);
  const workerUrl = getWorkerUrl();
  return await proxyGet(`${workerUrl}/api/edm/tahun-anggaran`, role, gtkId);
});
