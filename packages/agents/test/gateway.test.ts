import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentError } from "../src/runner.ts";
import { agentQueryFn, experientialQueryFn, gatewayConfig, gatewayQuery } from "../src/gateway.ts";

/**
 * Experiential ağ geçidi: OpenAI Chat Completions uyumlu uç nokta. Testler `fetch`i sahteler; gerçek çağrı yapılmaz
 * (kredi harcanmaz) ve anahtar hiçbir zaman günlüğe/dosyaya yazılmaz.
 */

const ENV: NodeJS.ProcessEnv = { NODE_ENV: "test", EXPLABS_API_KEY: "xpl_test", EXPLABS_BASE_URL: "https://gw.test/v1", EXPLABS_MODEL: "gpt-6-luna" };

const completion = (content: string, usage: Record<string, number> = { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 }) =>
  Response.json({
    id: "chatcmpl_1",
    object: "chat.completion",
    model: "gpt-6-luna",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    usage: { ...usage, cost: 0 },
    provider: "openai",
  });

const capture = () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return completion("ok");
  });
  vi.stubGlobal("fetch", fn);
  return calls;
};

const first = async (q: ReturnType<typeof gatewayQuery>, prompt: string, options: Record<string, unknown> = {}) => {
  let result: Record<string, unknown> | undefined;
  for await (const message of q({ prompt, options } as never)) result = message as Record<string, unknown>;
  return result as {
    result: string;
    structured_output?: unknown;
    usage: { input_tokens: number; output_tokens: number };
    total_cost_usd: number;
    stop_reason: string;
  };
};

afterEach(() => vi.unstubAllGlobals());

describe("gatewayConfig", () => {
  it("anahtarı ortamdan okur, uç noktadaki sondaki eğik çizgiyi atar", () => {
    expect(gatewayConfig({ ...ENV, EXPLABS_BASE_URL: "https://gw.test/v1///" })).toEqual({
      baseUrl: "https://gw.test/v1",
      apiKey: "xpl_test",
      model: "gpt-6-luna",
      visionModel: "gpt-6-luna",
    });
  });

  it("anahtar yoksa ne yapılacağını söyleyen, yeniden denenmeyecek hata verir", () => {
    try {
      gatewayConfig({ NODE_ENV: "test" });
      expect.unreachable("anahtarsız yapılandırma kabul edilmemeli");
    } catch (e) {
      expect(e).toBeInstanceOf(AgentError);
      const err = e as AgentError;
      expect(String(err)).toContain("EXPLABS_API_KEY");
      expect(String(err)).toContain("Settings → API Keys");
      expect(err.transient).toBe(false);
    }
  });
});

describe("gatewayQuery", () => {
  it("model kimliğini birebir gönderir ve kullanımı sonuca taşır", async () => {
    const calls = capture();
    const out = await first(gatewayQuery(ENV), "Reply with exactly: ok", { model: "claude-opus-5-5" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://gw.test/v1/chat/completions");
    const body = JSON.parse(String(calls[0]?.init.body));
    // Katman takma adı (claude-opus-5-5) ağ geçidinde tek modele düşer.
    expect(body.model).toBe("gpt-6-luna");
    expect(body.messages.at(-1).role).toBe("user");
    expect(String(body.messages.at(-1).content)).toContain("Reply with exactly: ok");
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe("Bearer xpl_test");
    expect(out.result).toBe("ok");
    expect(out.usage).toEqual({ input_tokens: 12, output_tokens: 7, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 });
    expect(out.stop_reason).toBe("stop");
  });

  it("şemayı prompt'a yazar, JSON yanıtını ayrıştırır ve geçersiz enum'u onarır", async () => {
    const calls = capture();
    const schema = {
      type: "object",
      properties: { tone: { type: "string", enum: ["warm", "grim"] } },
      required: ["tone"],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return completion('Here you go:\n{"tone":"destansı"}');
      }),
    );
    const out = await first(gatewayQuery(ENV), "Pick a tone", { systemPrompt: "You write Hindi mythology.", outputFormat: { type: "json_schema", schema } });
    const body = JSON.parse(String(calls[0]?.init.body));
    expect(body.messages[0]).toEqual({ role: "system", content: "You write Hindi mythology." });
    expect(String(body.messages[1].content)).toContain("warm");
    // Kod bloğu/ön söz olsa da JSON bulunur; enum dışı değer ilk geçerli değere çekilir.
    expect(out.structured_output).toEqual({ tone: "warm" });
  });

  it("şema yoksa düz metni JSON sanmaz", async () => {
    capture();
    const out = await first(gatewayQuery(ENV), "selam");
    expect(out.result).toBe("ok");
    expect(out.structured_output).toBeUndefined();
  });

  it("boş yanıtı geçici hata sayar (yeniden denenebilir)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ choices: [{ message: { content: "  " }, finish_reason: "length" }] })));
    await expect(first(gatewayQuery(ENV), "x")).rejects.toMatchObject({ transient: true });
  });

  it("HTTP 429'u geçici, 401'i kalıcı sayar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: { message: "rate limited" } }, { status: 429 })));
    await expect(first(gatewayQuery(ENV), "x")).rejects.toMatchObject({ transient: true });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: { message: "bad key" } }, { status: 401 })));
    await expect(first(gatewayQuery(ENV), "x")).rejects.toMatchObject({ transient: false });
  });
});

describe("agentQueryFn", () => {
  it("arka ucu ortam değişkenine göre seçer", () => {
    expect(agentQueryFn({ ...ENV, YS_AGENT_BACKEND: "experiential" })).toBeTypeOf("function");
    expect(agentQueryFn({ ...ENV, YS_AGENT_BACKEND: "claude" })).toBeUndefined();
    expect(agentQueryFn({ ...ENV, YS_AGENT_BACKEND: "" })).toBeUndefined();
    expect(experientialQueryFn(ENV)).toBeTypeOf("function");
  });
});
