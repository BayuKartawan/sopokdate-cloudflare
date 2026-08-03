import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId } = requireAuth(event);
  const query = getQuery(event);
  const tahunAnggaranId = query.tahun_anggaran_id as string;

  if (!tahunAnggaranId) {
    throw createError({ statusCode: 400, statusMessage: "Parameter 'tahun_anggaran_id' diperlukan" });
  }

  const workerUrl = getWorkerUrl();
  return await proxyGet(`${workerUrl}/api/edm/rekap?tahun_anggaran_id=${encodeURIComponent(tahunAnggaranId)}`, role, gtkId);
});
