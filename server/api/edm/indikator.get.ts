import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId } = requireAuth(event);
  const query = getQuery(event);
  const tahunAnggaranId = query.tahun_anggaran_id as string;
  const bagianTarget = (query.bagian_target || query.kelompok_target) as string;
  if (!tahunAnggaranId) {
    throw createError({ statusCode: 400, statusMessage: "Parameter 'tahun_anggaran_id' diperlukan" });
  }

  const qs = new URLSearchParams({ tahun_anggaran_id: tahunAnggaranId });
  if (bagianTarget) {
    qs.append("bagian_target", bagianTarget);
    qs.append("kelompok_target", bagianTarget);
  }

  const workerUrl = getWorkerUrl();
  return await proxyGet(`${workerUrl}/api/edm/indikator?${qs.toString()}`, role, gtkId);
});
