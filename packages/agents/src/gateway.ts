import { randomUUID } from "node:crypto";
import type { Options, SDKResultMessage, SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { AgentError, type QueryFn } from "./runner.ts";
import { buildPrompt, extractJson, opencodeQuery, repairEnums } from "./opencode.ts";

/**
 * OpenAI Chat Completions konuşan bir ağ geçidi üzerinden ajan çalıştırıcı (Experiential).
 *
 * Neden var: abonelik kotası (opencode-go) dolduğunda üretim tamamen duruyordu (15 Kas: haftalık limit, 28 saat).
 * Bu arka uç aynı `QueryFn` sözleşmesini uygular; yalnız HTTP istemcisi değişir. Streaming ve araç çağrısı yoktur:
 * boru hattı tek sonuç (`result`) bekler, araçlar zaten kapalıdır (`tools: []`).
 *
 * Şema zorlanamadığı için (json_schema çıktı biçimi garanti değil) OpenCode yolundaki gibi şema prompt'a yazılır,
 * yanıt `extractJson` ile ayrıştırılır ve geçersiz enum değerleri `repairEnums` ile güvenli varsayılana çekilir.
 */

const DEFAULT_BASE_URL = "https://api.experientiallabs.ai/v1";
/** Kullanıcının istediği kimlik birebir: gpt-6-luna. */
const DEFAULT_MODEL = "gpt-6-luna";
const DEFAULT_TIMEOUT_MS = 240_000;

/** Geçici (yeniden denenebilir) hatalar: kota, oran sınırı, ağ, 5xx. */
function isTransient(text: string, status?: number): boolean {
  if (status === 429 || (typeof status === "number" && status >= 500)) return true;
  return /quota|balance|insufficient|rate.?limit|overload|timed out|timeout|connection|ECONN|network|internal server error|5\d\d|429|502|503|504|500/i.test(text);
}

interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  visionModel: string;
}

/** Ayarları ortamdan okur; anahtar yoksa ne yapılacağını söyleyen bir hata fırlatır. */
export function gatewayConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const apiKey = env.EXPLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new AgentError(
      "Experiential gateway: EXPLABS_API_KEY is not set. Create a key under Settings → API Keys at https://api.experientiallabs.ai and export it (EXPLABS_API_KEY=…) before using this backend.",
      0,
      undefined,
      undefined,
      false,
    );
  }
  const baseUrl = (env.EXPLABS_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = env.EXPLABS_MODEL?.trim() || DEFAULT_MODEL;
  return { baseUrl, apiKey, model, visionModel: env.EXPLABS_VISION_MODEL?.trim() || model };
}

/** Metni ve görselleri ayrıştırır: prompt düz metinse olduğu gibi, akışsa içerik bloklarını okur. */
async function collectPrompt(
  prompt: string | AsyncIterable<SDKUserMessage>,
): Promise<{ text: string; images: { bytes: Uint8Array; mimeType: string }[] }> {
  if (typeof prompt === "string") return { text: prompt, images: [] };
  let text = "";
  const images: { bytes: Uint8Array; mimeType: string }[] = [];
  for await (const message of prompt) {
    const content = message.message?.content;
    if (typeof content === "string") {
      text += content;
      continue;
    }
    for (const block of content ?? []) {
      if (block.type === "text") text += block.text;
      else if (block.type === "image" && block.source.type === "base64") {
        images.push({ bytes: Buffer.from(block.source.data, "base64"), mimeType: block.source.media_type });
      }
    }
  }
  return { text, images };
}

interface ChatResponse {
  choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
  model?: string;
  error?: { message?: string; type?: string };
}

export function gatewayQuery(env: NodeJS.ProcessEnv = process.env): QueryFn {
  return async function* (params: {
    prompt: string | AsyncIterable<SDKUserMessage>;
    options?: Options;
  }) {
    const started = Date.now();
    const cfg = gatewayConfig(env);
    const signal = params.options?.abortController?.signal;
    const { text, images } = await collectPrompt(params.prompt);
    const model = images.length ? cfg.visionModel : cfg.model;
    const schema = (params.options?.outputFormat as { schema?: unknown } | undefined)?.schema;
    const full = buildPrompt(params.options?.systemPrompt, text, schema);

    const userContent = images.length
      ? [
          { type: "text" as const, text: full },
          ...images.map((img) => ({
            type: "image_url" as const,
            image_url: { url: `data:${img.mimeType};base64,${Buffer.from(img.bytes).toString("base64")}` },
          })),
        ]
      : full;

    const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let res: Response;
    try {
      res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            ...(params.options?.systemPrompt ? [{ role: "system", content: String(params.options.systemPrompt) }] : []),
            { role: "user", content: userContent },
          ],
          temperature: 0.7,
        }),
        signal: combined,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      throw new AgentError(`experiential: request failed: ${detail}`, 0, model, undefined, true);
    }

    const raw = await res.text();
    let body: ChatResponse;
    try {
      body = JSON.parse(raw) as ChatResponse;
    } catch {
      throw new AgentError(`experiential: non-JSON response (HTTP ${res.status}): ${raw.slice(0, 300)}`, 0, model, undefined, isTransient(raw, res.status));
    }

    if (!res.ok || body.error) {
      const detail = body.error?.message ?? raw.slice(0, 300);
      throw new AgentError(`experiential: HTTP ${res.status}: ${detail}`, 0, model, undefined, isTransient(detail, res.status));
    }

    const content = body.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) {
      throw new AgentError(`experiential: empty reply (finish_reason ${body.choices?.[0]?.finish_reason ?? "?"})`, 0, model, undefined, true);
    }

    const usage = body.usage ?? {};
    const duration = Date.now() - started;
    const cost = typeof usage.cost === "number" ? usage.cost : 0;

    let structured: unknown;
    if (schema !== undefined) {
      try {
        structured = repairEnums(schema, extractJson(content));
      } catch {
        throw new AgentError(`experiential: model returned unparseable output (first 300): ${content.slice(0, 300)}`, cost, model, undefined, true);
      }
    }

    yield {
      type: "result",
      subtype: "success",
      is_error: false,
      result: content,
      session_id: `experiential-${randomUUID()}`,
      duration_ms: duration,
      duration_api_ms: duration,
      num_turns: 1,
      total_cost_usd: cost,
      structured_output: structured,
      errors: [],
      usage: {
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
      modelUsage: { [model]: { inputTokens: usage.prompt_tokens ?? 0, outputTokens: usage.completion_tokens ?? 0 } },
      permission_denials: [],
      stop_reason: body.choices?.[0]?.finish_reason ?? "stop",
      uuid: randomUUID(),
    } as unknown as SDKResultMessage;
  } as QueryFn;
}

/**
 * `YS_AGENT_BACKEND=experiential` iken kullanılacak queryFn. Anahtar yoksa `gatewayConfig` çağrıldığında
 * (yani ilk ajan çağrısında) anlaşılır bir hata verilir; süreç başlarken çökmek yerine bu tercih edildi.
 */
export function experientialQueryFn(env: NodeJS.ProcessEnv = process.env): QueryFn {
  return gatewayQuery(env);
}

/**
 * Ajan arka ucunu seçer: `opencode` (abonelik CLI), `experiential` (OpenAI uyumlu ağ geçidi) ya da undefined
 * (varsayılan Claude Agent SDK). CLI ve Studio bu yardımla seçer; Stüdyo'daki anahtar bunu ortam değişkeniyle ezer.
 */
export function agentQueryFn(env: NodeJS.ProcessEnv = process.env): QueryFn | undefined {
  const backend = env.YS_AGENT_BACKEND?.trim();
  if (backend === "opencode") return opencodeQuery(env);
  if (backend === "experiential") return experientialQueryFn(env);
  return undefined;
}
