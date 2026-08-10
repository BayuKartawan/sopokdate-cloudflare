import { requireAuth, getWorkerUrl, proxyMutation } from "../../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId: tokenGtkId } = requireAuth(event);
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Parameter 'id' diperlukan",
    });
  }

  const workerUrl = getWorkerUrl();
  const targetUrl = `${workerUrl}/api/edm/bukti/${id}`;
  return await proxyMutation(targetUrl, "DELETE", role, tokenGtkId);
});
