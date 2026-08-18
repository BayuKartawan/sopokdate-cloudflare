import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId: tokenGtkId } = requireAuth(event);
  const query = getQuery(event);
  const kodeSoal = (query.kode_soal as string) || (query.indikator_id as string);
  const bagianId = query.bagian_id as string;

  if (!kodeSoal || !bagianId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Parameter 'kode_soal' dan 'bagian_id' diperlukan",
    });
  }

  const workerUrl = getWorkerUrl();
  const targetUrl = `${workerUrl}/api/edm/bukti?kode_soal=${encodeURIComponent(kodeSoal)}&bagian_id=${bagianId}`;
  return await proxyGet(targetUrl, role, tokenGtkId);
});

