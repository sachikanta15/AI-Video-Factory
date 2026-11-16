import { LocalizedError, msg, type Capability } from "@ys/core";
import { requestBytes } from "../http.ts";
import type {
  GenerateContext,
  GenerationRequest,
  GenerationResult,
  PriceRule,
  ProviderAdapter,
  ProviderLimits,
} from "../types.ts";

/**
 * VoiceStudio (k2-fsa/OmniVoice) yerel TTS sağlayıcısı. Elektron uygulamasının FastAPI arka ucuna
 * (varsayılan http://127.0.0.1:3900) `POST /generate` ile metin gönderir, WAV alır. Kelime zamanlaması
 * döndürmez: pipeline'ın sessizlik tabanlı hizalaması (`alignWords` / `detectSilences`) devreye girer,
 * `estimatedTiming: true` işaretlenir. Ses `voiceId` → VoiceStudio `profile_id`'ye, `language` ise ISO
 * koduna (örn. "en", "tr") eşlenir; ikisi de verilmezse arka ucun varsayılan sesi kullanılır.
 *
 * Yerel ve ücretsizdir (elektrik hariç); `local: true` ile ComfyUI gibi yönlendirilir.
 */
export class VoiceStudioTtsAdapter implements ProviderAdapter {
  readonly local = true;
  readonly capabilities: readonly Capability[] = ["tts"];
  readonly limits: ProviderLimits = {};
  readonly id = "voicestudio:tts";
  readonly qualityPrior = 0.7;
  readonly price: PriceRule = { unit: "free" };

  constructor(
    private readonly baseUrl: string,
    private readonly defaultProfileId?: string,
  ) {}

  async generate(req: GenerationRequest, ctx: GenerateContext): Promise<GenerationResult> {
    if (!req.text?.trim()) throw new LocalizedError(msg("gw.text", { text: "VoiceStudio TTS requires text" }));
    const form = new FormData();
    form.set("text", req.text);
    form.set("speed", "1.0");
    form.set("num_step", "16");
    if (req.language) form.set("language", req.language);
    const profileId = req.voiceId ?? this.defaultProfileId;
    if (profileId) form.set("profile_id", profileId);
    const res = await requestBytes(ctx.fetch, `${this.baseUrl}/generate`, {
      method: "POST",
      body: form,
      signal: ctx.signal,
      // Soğuk model yükleme + uzun anlatım cümlesi dakikalar sürebilir (ElevenLabs ile aynı pay).
      timeoutMs: 600_000,
    });
    return { files: [{ bytes: res.bytes, mimeType: res.mimeType === "audio/wav" ? "audio/wav" : "audio/wav" }] };
  }
}
