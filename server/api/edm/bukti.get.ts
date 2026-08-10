import { requireAuth, getWorkerUrl, proxyGet } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId: tokenGtkId } = requireAuth(event);
  const query = getQuery(event);
  const indikatorId = query.indikator_id as string;
  const bagianId = query.bagian_id as string;

  if (!indikatorId || !bagianId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Parameter 'indikator_id' dan 'bagian_id' diperlukan",
    });
  }

  const workerUrl = getWorkerUrl();
  const targetUrl = `${workerUrl}/api/edm/bukti?indikator_id=${indikatorId}&bagian_id=${bagianId}`;
  return await proxyGet(targetUrl, role, tokenGtkId);
});
