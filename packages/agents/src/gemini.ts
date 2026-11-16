import { AgentError, toOutputSchema, type AgentCall, type AgentImage, type AgentResult } from "./runner.ts";
import { vertexAccessToken, vertexUrl } from "./vertex.ts";
import { z } from "zod";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
type GeminiResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }; error?: { message?: string } };

/** Gemini structured output accepts a useful JSON-Schema subset, not every draft-07 keyword emitted by Zod. */
function geminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(["type", "format", "description", "enum", "minimum", "maximum", "properties", "required", "items", "additionalProperties", "minItems", "maxItems"]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (!allowed.has(key)) continue;
    if (key === "properties" && value && typeof value === "object") out.properties = Object.fromEntries(Object.entries(value).map(([name, child]) => [name, geminiSchema(child as Record<string, unknown>)]));
    else if (key === "items" && value && typeof value === "object") out.items = geminiSchema(value as Record<string, unknown>);
    else out[key] = value;
  }
  return out;
}

function imagePart(image: AgentImage) { return { inlineData: { mimeType: image.mimeType, data: Buffer.from(image.data).toString("base64") } }; }
function pricePerMillion(name: string, fallback: number): number { const value = Number(process.env[name]); return Number.isFinite(value) && value >= 0 ? value : fallback; }

export async function runGeminiStructured<T>(call: AgentCall<T>, model: string): Promise<AgentResult<T>> {
  const vertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === "1" || process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!vertex && !key) throw new AgentError("Gemini backend requires GEMINI_API_KEY or Vertex ADC", 0, model, call.name);
  const started = Date.now();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (vertex) headers.authorization = `Bearer ${await vertexAccessToken()}`;
  else headers["x-goog-api-key"] = key!;
  const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
  if (vertex && !project) throw new AgentError("Vertex backend requires GOOGLE_CLOUD_PROJECT", 0, model, call.name);
  const location = process.env.GOOGLE_CLOUD_LOCATION?.trim() || "global";
  const response = await fetch(vertex ? vertexUrl(project!, location, model) : `${BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers,
    body: JSON.stringify({ systemInstruction: { parts: [{ text: call.system }] }, contents: [{ role: "user", parts: [...(call.images ?? []).map(imagePart), { text: call.prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: geminiSchema(toOutputSchema(call.schema)) } }),
  });
  const body = (await response.json()) as GeminiResponse;
  if (!response.ok || body.error) {
    const reason = body.error?.message ?? `HTTP ${response.status}`;
    throw new AgentError(`Gemini ${call.name} failed: ${reason}`, 0, model, call.name, response.status === 429 || response.status >= 500);
  }
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new AgentError(`Gemini ${call.name} returned no structured output`, 0, model, call.name, true);
  let parsedJson: unknown;
  try { parsedJson = JSON.parse(text); } catch { throw new AgentError(`Gemini ${call.name} returned invalid JSON`, 0, model, call.name, true); }
  const parsed = call.schema.safeParse(parsedJson);
  if (!parsed.success) throw new AgentError(`Gemini ${call.name} returned invalid schema: ${z.prettifyError(parsed.error)}`, 0, model, call.name, true);
  const inputTokens = body.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = body.usageMetadata?.candidatesTokenCount ?? 0;
  const costUsd = inputTokens / 1_000_000 * pricePerMillion("GEMINI_AGENT_INPUT_USD_PER_MILLION", 1.5) + outputTokens / 1_000_000 * pricePerMillion("GEMINI_AGENT_OUTPUT_USD_PER_MILLION", 7.5);
  return { data: parsed.data, name: call.name, costUsd, model, durationMs: Date.now() - started };
}
