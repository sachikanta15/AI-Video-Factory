import { loadLlmBackend, saveLlmBackend } from "@ys/pipeline/light";
import { errorResponse, readJson } from "../../../../lib/api";
import { store } from "../../../../lib/server";

/** Ajan arka ucu (Modeller sayfası): abonelik kotası dolunca ağ geçidine geçmek için. Sonraki işte geçerli olur. */
export async function GET() {
  return Response.json({ backend: (await loadLlmBackend(store())) ?? null });
}

export async function PUT(req: Request) {
  try {
    return Response.json({ backend: (await saveLlmBackend(store(), await readJson(req))) ?? null });
  } catch (e) {
    return errorResponse(req, e);
  }
}
