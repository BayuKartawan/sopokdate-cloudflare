import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId: tokenGtkId } = requireAuth(event);
  const query = getQuery(event);
  const tahunAnggaranId = query.tahun_anggaran_id as string;
  const kelompokTarget = query.kelompok_target as string;
  const kelompokId = query.kelompok_id as string;

  if (!tahunAnggaranId) {
    throw createError({ statusCode: 400, statusMessage: "Parameter 'tahun_anggaran_id' diperlukan" });
  }

  const qs = new URLSearchParams({ tahun_anggaran_id: tahunAnggaranId });
  if (kelompokTarget) qs.append("kelompok_target", kelompokTarget);
  if (kelompokId) qs.append("kelompok_id", kelompokId);

  const workerUrl = getWorkerUrl();
  return await proxyGet(`${workerUrl}/api/edm/jawaban?${qs.toString()}`, role, tokenGtkId);
});
