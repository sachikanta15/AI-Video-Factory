import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Options, SDKResultMessage, SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { AgentError, type QueryFn } from "./runner.ts";

/**
 * OpenCode arka ucuna yönelen ajan çalıştırıcı. Claude Agent SDK'nın `query()` yerine geçer:
 * `opencode run --model … --format json` alt sürecini açar, NDJSON akışından model metnini çıkarır
 * ve SDK'nın beklediği `result` mesajı biçiminde döndürür. Abonelik (opencode-go) ve bedava
 * (nvidia nemotron-vl) modelleriyle çalışır; `opencode/` kredili modeller bakiyesiz olduğundan
 * varsayılan eşlemede kullanılmaz.
 *
 * JSON şeması OpenCode tarafında zorlanmadığından (json_schema çıktı biçimi yok), şema talimatın
 * sonuna eklenir ve modelden yalnız JSON istenir; pipeline ayrıştırmayı `call.schema.safeParse`
 * ile yine doğrular.
 */

const DEFAULT_BIN = "opencode";

const DEFAULT_BY_TIER = {
  creative: "opencode-go/deepseek-v4-pro",
  fast: "opencode-go/deepseek-v4.1-flash",
  cheap: "opencode-go/minimax-m3.1-flash",
} as const;

const DEFAULT_VISION = "nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b";

/** Claude model takma adı → sınıf (core/models.ts MODEL_CHOICES ile aynı küme). */
const TIER_ALIAS: Record<string, keyof typeof DEFAULT_BY_TIER> = {
  "claude-opus-5-5": "creative",
  "claude-fable-5-1": "creative",
  "claude-sonnet-5-5": "fast",
  "claude-haiku-5-5": "cheap",
};

/** Görselli çağrılar (kalite kapısı, kare denetimi) her zaman görüntü modeline gider. */
function resolveModel(model: string, hasImages: boolean, env: NodeJS.ProcessEnv): string {
  if (hasImages) return env.YS_OPENCODE_VISION?.trim() || DEFAULT_VISION;
  if (model.includes("/")) return model; // YS_MODEL_* ile verilmiş tam model kimliği.
  const tier = TIER_ALIAS[model] ?? "fast";
  const key = `YS_OPENCODE_${tier.toUpperCase()}` as const;
  return env[key]?.trim() || DEFAULT_BY_TIER[tier];
}

/** Metni ve görselleri ayrıştırır: prompt düz metinse olduğu gibi, akışsa içerik bloklarını okur. */
async function collectPrompt(
  prompt: string | AsyncIterable<SDKUserMessage>,
): Promise<{ text: string; images: { bytes: Uint8Array; mimeType: string }[] }> {
  if (typeof prompt === "string") return { text: prompt, images: [] };
  let text = "";
  const images: { bytes: Uint8Array; mimeType: string }[] = [];
  for await (const msg of prompt) {
    const content = msg.message?.content;
    if (typeof content === "string") {
      text += content;
      continue;
    }
    if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part === "object" && part !== null && "type" in part) {
          if (part.type === "text" && typeof (part as { text?: string }).text === "string") {
            text += (part as { text: string }).text;
          } else if (part.type === "image") {
            const src = (part as { source?: { type?: string; data?: string; media_type?: string } }).source;
            if (src?.type === "base64" && src.data) {
              images.push({ bytes: new Uint8Array(Buffer.from(src.data, "base64")), mimeType: src.media_type ?? "image/png" });
            }
          }
        }
      }
    }
  }
  return { text, images };
}

/** Modelin döndürdüğü metinden JSON çıkarır: doğrudan, markdown çitinden ya da ilk dengeli nesneden. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* devam */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]!.trim());
    } catch {
      /* devam */
    }
  }
  const start = trimmed.search(/[[{]/);
  if (start >= 0) {
    const candidate = balancedJson(trimmed.slice(start));
    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch {
        /* devam */
      }
    }
  }
  throw new Error("model output contained no parseable JSON");
}

/** İlk karakterden başlayan dengeli JSON metnini döndürür (dize ve kaçışlara saygılı). */
function balancedJson(input: string): string | undefined {
  const open = input[0]!;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return input.slice(0, i + 1);
    }
  }
  return undefined;
}

interface RunResult {
  text: string;
  cost: number;
}

/** `opencode run` alt sürecini açar, NDJSON çıktısını toplar; iptalde çocuğu öldürür. */
function runOpenCode(bin: string, args: string[], signal: AbortSignal | undefined): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"], env: process.env });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      reject(err);
    };
    const onAbort = () => {
      child.kill("SIGTERM");
      fail(new AgentError(`opencode run aborted`, 0, undefined, undefined, true));
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString("utf8")));
    child.on("error", (err) => fail(new AgentError(`opencode spawn: ${err.message}`, 0, undefined, undefined, true)));
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      if (signal?.aborted) {
        reject(new AgentError(`opencode run aborted`, 0, undefined, undefined, true));
        return;
      }
      if (code !== 0) {
        // `opencode run` çıktı vermeden 1 ile çıkarsa neden genellikle sağlayıcı 5xx/500 hatasıdır
        // (ayrıntı opencode sunucu günlüğüne yazılır, stderr'e değil): yeniden denemek güvenli.
        reject(
          new AgentError(
            `opencode run exited ${code}${stderr.trim() ? `: ${stderr.slice(0, 400)}` : " (provider error)"}`,
            0,
            undefined,
            undefined,
            true,
          ),
        );
        return;
      }
      let text = "";
      let cost = 0;
      for (const line of stdout.split("\n")) {
        const l = line.trim();
        if (!l) continue;
        let obj: unknown;
        try {
          obj = JSON.parse(l);
        } catch {
          continue;
        }
        if (typeof obj !== "object" || obj === null || !("type" in obj)) continue;
        const o = obj as { type?: string; part?: { text?: string; type?: string; cost?: number }; error?: { message?: string; status?: number } };
        if (o.type === "text" && typeof o.part?.text === "string") text += o.part.text;
        else if (o.type === "step_finish" && typeof o.part?.cost === "number") cost = o.part.cost;
        else if (o.type === "error") {
          const msg = o.error?.message ?? "unknown opencode error";
          reject(new AgentError(`opencode: ${msg}`, 0, undefined, undefined, isTransient(msg)));
          return;
        }
      }
      resolve({ text, cost });
    });
  });
}

/** Kota/denge/ağ hataları geçicidir: SDK'nın alt süreç denemeleri gibi yeniden denenir. */
function isTransient(text: string): boolean {
  return /quota|balance|insufficient|rate.?limit|overload|timed out|timeout|connection|ECONN|network|internal server error|5\d\d|429|502|503|504|500/i.test(text);
}

/**
 * Modelin ürettiği JSON'u şemaya göre onarır: geçersiz enum değerlerini o enum'un ilk değerine çeker.
 * OpenCode arka ucu çıktı şemasını zorlamadığından hızlı modeller "confident", "bright" gibi geçersiz
 * enum değerleri yazabiliyor; bunlar yüzünden tüm aşamayı düşürmek yerine güvenli varsayılana çekilir
 * (expression→neutral, action→hold, mood→neutral, ambience→none). Claude SDK'sı zaten şemayı zorlar,
 * bu yüzden onarım yalnız OpenCode yolunda etkilidir.
 */
export function repairEnums(schema: unknown, data: unknown): unknown {
  if (!schema || typeof schema !== "object") return data;
  const s = schema as Record<string, unknown>;
  if (Array.isArray(s.enum) && s.enum.length && typeof data === "string" && !s.enum.includes(data)) {
    return s.enum[0];
  }
  if (data && typeof data === "object" && !Array.isArray(data) && s.properties && typeof s.properties === "object") {
    const props = s.properties as Record<string, unknown>;
    const out = { ...(data as Record<string, unknown>) };
    for (const key of Object.keys(props)) if (key in out) out[key] = repairEnums(props[key], out[key]);
    return out;
  }
  if (Array.isArray(data) && s.items && typeof s.items === "object" && !Array.isArray(s.items)) {
    return data.map((v) => repairEnums(s.items, v));
  }
  return data;
}

/** Şemayı (draft-07) okunur bir JSON talimatına çevirir; çıktı biçimi zorlanamayan arka uçlarda prompt'a yazılır. */
export function buildPrompt(system: unknown, task: string, schema: unknown): string {
  const parts = [];
  const sys = typeof system === "string" ? system.trim() : Array.isArray(system) ? system.filter((s): s is string => typeof s === "string").join("\n").trim() : "";
  if (sys) parts.push(sys);
  if (task.trim()) parts.push(`TASK:\n${task.trim()}`);
  if (schema !== undefined) {
    let schemaText: string;
    try {
      schemaText = JSON.stringify(schema);
    } catch {
      schemaText = String(schema);
    }
    parts.push(
      `OUTPUT FORMAT:\nRespond with ONLY a single JSON value that validates against this JSON Schema. No markdown code fences, no commentary, no surrounding text.\n${schemaText}`,
    );
  }
  return parts.join("\n\n");
}

/** Yerel görselleri geçici dosyalara yazar; iş bitince klasör silinir. */
async function stageImages(images: { bytes: Uint8Array; mimeType: string }[]): Promise<{ dir: string; files: string[] }> {
  const dir = await mkdtemp(join(tmpdir(), "ys-agent-"));
  const files: string[] = [];
  for (const [i, img] of images.entries()) {
    const ext = img.mimeType.includes("png") ? "png" : img.mimeType.includes("jpeg") || img.mimeType.includes("jpg") ? "jpg" : "bin";
    const path = join(dir, `img-${i}.${ext}`);
    await writeFile(path, img.bytes);
    files.push(path);
  }
  return { dir, files };
}

export function opencodeQuery(env: NodeJS.ProcessEnv = process.env): QueryFn {
  const bin = env.YS_OPENCODE_BIN?.trim() || DEFAULT_BIN;
  return async function* (params: {
    prompt: string | AsyncIterable<SDKUserMessage>;
    options?: Options;
  }) {
    const started = Date.now();
    const signal = params.options?.abortController?.signal;
    const { text, images } = await collectPrompt(params.prompt);
    const model = resolveModel(params.options?.model ?? "", images.length > 0, env);
    const schema = (params.options?.outputFormat as { schema?: unknown } | undefined)?.schema;
    const full = buildPrompt(params.options?.systemPrompt, text, schema);

    let dir: string | undefined;
    let args: string[];
    try {
      args = ["run", "--model", model, "--format", "json", "--archived"];
      if (images.length) {
        const staged = await stageImages(images);
        dir = staged.dir;
        for (const f of staged.files) args.push("-f", f);
      }
      args.push(full);
    } catch (e) {
      throw new AgentError(`opencode: image staging failed: ${e instanceof Error ? e.message : String(e)}`, 0, model, undefined, true);
    }

    let result: RunResult;
    try {
      result = await runOpenCode(bin, args, signal);
    } catch (e) {
      throw e;
    } finally {
      if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
    }

    const duration = Date.now() - started;
    if (signal?.aborted) throw new AgentError("opencode run aborted", 0, model, undefined, true);

    let structured: unknown;
    try {
      structured = extractJson(result.text);
    } catch {
      throw new AgentError(
        `opencode: model returned unparseable output (first 300): ${result.text.slice(0, 300)}`,
        0,
        model,
        undefined,
        true,
      );
    }
    // Geçersiz enum değerlerini güvenli varsayılana çek (şema uyumsuzluğu tüm aşamayı düşürmesin).
    structured = repairEnums(schema, structured);

    yield {
      type: "result",
      subtype: "success",
      is_error: false,
      result: result.text,
      session_id: "opencode",
      duration_ms: duration,
      duration_api_ms: duration,
      num_turns: 1,
      total_cost_usd: result.cost,
      structured_output: structured,
      errors: [],
      usage: {},
      modelUsage: {},
      permission_denials: [],
      stop_reason: "completed",
      uuid: randomUUID(),
    } as unknown as SDKResultMessage;
  } as QueryFn;
}

