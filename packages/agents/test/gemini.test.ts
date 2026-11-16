import { afterEach, describe, expect, it, vi } from "vitest";
import { runGeminiStructured } from "../src/gemini.ts";
import { z } from "zod";

describe("Gemini structured backend", () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.GEMINI_API_KEY; });

  it("sends JSON schema output requests and validates the response", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetch = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const result = await runGeminiStructured({ name: "test", model: "ignored", system: "Return JSON", prompt: "go", schema: z.object({ ok: z.boolean() }) }, "gemini-4-hydrogen");
    expect(result.data).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("gemini-4-hydrogen:generateContent"), expect.objectContaining({ headers: expect.objectContaining({ "x-goog-api-key": "test-key" }) }));
  });
});
