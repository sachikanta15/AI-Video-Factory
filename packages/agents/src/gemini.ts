import { AgentError, toOutputSchema, type AgentCall, type AgentImage, type AgentResult } from "./runner.ts";
import { z } from "zod";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
type GeminiResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }; error?: { message?: string } };

function imagePart(image: AgentImage) { return { inlineData: { mimeType: image.mimeType, data: Buffer.from(image.data).toString("base64") } }; }
function pricePerMillion(name: string, fallback: number): number { const value = Number(process.env[name]); return Number.isFinite(value) && value >= 0 ? value : fallback; }

export async function runGeminiStructured<T>(call: AgentCall<T>, model: string): Promise<AgentResult<T>> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new AgentError("Gemini backend requires GEMINI_API_KEY", 0, model, call.name);
  const started = Date.now();
  const response = await fetch(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: call.system }] }, contents: [{ role: "user", parts: [...(call.images ?? []).map(imagePart), { text: call.prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: toOutputSchema(call.schema) } }),
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
