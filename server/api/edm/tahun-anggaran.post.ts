import { requireAuth, getWorkerUrl, proxyMutation } from "../../utils/edm-proxy";

export default defineEventHandler(async (event) => {
  const { role, gtkId } = requireAuth(event);
  const body = await readBody(event);
  const workerUrl = getWorkerUrl();
  return await proxyMutation(`${workerUrl}/api/edm/tahun-anggaran`, "POST", role, gtkId, body);
});
