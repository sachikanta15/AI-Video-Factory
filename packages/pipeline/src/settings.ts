import { cleanModelSettings, type ModelSettings } from "@ys/core";
import { getJson, putJson, type AssetStore } from "@ys/storage";

const MODELS_KEY = "settings/models.json";
const BACKEND_KEY = "settings/llm-backend.json";

/** Ajan arka uçları: Claude SDK (varsayılan), abonelik CLI'si ve OpenAI uyumlu ağ geçidi. */
export type LlmBackend = "claude" | "opencode" | "experiential";
const BACKENDS: LlmBackend[] = ["claude", "opencode", "experiential"];

/** Kullanıcının ajan başına model seçimi (Stüdyo → Modeller). Dosya yoksa ya da bozuksa boş: varsayılanlar geçerli. */
export async function loadModelSettings(store: AssetStore): Promise<ModelSettings> {
  return cleanModelSettings(await getJson(store, MODELS_KEY));
}

/** Yalnız geçerli seçimler yazılır; varsayılanla aynı olan seçim de saklanır (kullanıcı bilerek seçti). */
export async function saveModelSettings(store: AssetStore, raw: unknown): Promise<ModelSettings> {
  const clean = cleanModelSettings(raw);
  await putJson(store, MODELS_KEY, clean);
  return clean;
}

/**
 * Stüdyo'daki ajan arka ucu anahtarı. Abonelik kotası dolduğunda (15 Kas: haftalık limit, 28 saat) üretim durmasın
 * diye ağ geçidine geçilir; seçim kayıtta durur, böylece sunucuyu yeniden başlatmadan bir sonraki işte geçerli olur.
 * Kayıt yoksa ortam değişkeni (`YS_AGENT_BACKEND`) geçerlidir.
 */
export async function loadLlmBackend(store: AssetStore): Promise<LlmBackend | undefined> {
  const raw = (await getJson(store, BACKEND_KEY)) as { backend?: unknown } | undefined;
  const backend = raw?.backend;
  return typeof backend === "string" && BACKENDS.includes(backend as LlmBackend) ? (backend as LlmBackend) : undefined;
}

/** Anahtarı yazar; `undefined` kaydı siler ve ortam değişkenine geri döner. */
export async function saveLlmBackend(store: AssetStore, raw: unknown): Promise<LlmBackend | undefined> {
  const backend = (raw as { backend?: unknown } | undefined)?.backend;
  const clean = typeof backend === "string" && BACKENDS.includes(backend as LlmBackend) ? (backend as LlmBackend) : undefined;
  await putJson(store, BACKEND_KEY, clean ? { backend: clean } : {});
  return clean;
}

/** Ajanlara verilecek ortam: kayıtlı arka uç varsa `YS_AGENT_BACKEND` onunla ezilir. */
export async function agentEnv(store: AssetStore, env: NodeJS.ProcessEnv = process.env): Promise<NodeJS.ProcessEnv> {
  const backend = await loadLlmBackend(store);
  return backend ? { ...env, YS_AGENT_BACKEND: backend } : env;
}
