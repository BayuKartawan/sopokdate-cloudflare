import { requireAuth, getWorkerUrl, proxyFormData } from "../../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId: tokenGtkId } = requireAuth(event);
  const workerUrl = getWorkerUrl();
  const targetUrl = `${workerUrl}/api/edm/bukti/upload`;
  return await proxyFormData(targetUrl, event, role, tokenGtkId);
});
