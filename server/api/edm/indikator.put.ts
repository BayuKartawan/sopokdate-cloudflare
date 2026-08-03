import { requireAuth, getWorkerUrl, proxyMutation } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId } = requireAuth(event);
  const query = getQuery(event);
  const id = query.id as string;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Parameter 'id' diperlukan" });
  }
  const body = await readBody(event);
  const workerUrl = getWorkerUrl();
  return await proxyMutation(`${workerUrl}/api/edm/indikator/${id}`, "PUT", role, gtkId, body);
});
