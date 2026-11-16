"use client";

import type { LlmBackend } from "@ys/pipeline/light";
import { useState } from "react";
import type { MessageKey } from "../../lib/i18n";
import { useI18n } from "../locale-provider";

const OPTIONS: { value: LlmBackend; label: MessageKey; hint: MessageKey }[] = [
  { value: "opencode", label: "backend.opencode", hint: "backend.opencode.hint" },
  { value: "experiential", label: "backend.experiential", hint: "backend.experiential.hint" },
  { value: "claude", label: "backend.claude", hint: "backend.claude.hint" },
];

/**
 * Ajan arka ucu anahtarı: abonelik kotası dolduğunda üretim durmasın diye ağ geçidine geçilir.
 * Seçim kayıtta durur (settings/llm-backend.json); CLI her çalıştırmada okur, sunucuyu yeniden başlatmak gerekmez.
 */
export function LlmBackendForm({ initial, gatewayKey }: { initial: LlmBackend | null; gatewayKey: boolean }) {
  const { t } = useI18n();
  const [backend, setBackend] = useState<LlmBackend | null>(initial);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = async (next: LlmBackend | null) => {
    setBackend(next);
    setSaved("saving");
    try {
      const res = await fetch("/api/settings/llm-backend", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ backend: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { backend: LlmBackend | null };
      setBackend(body.backend);
      setSaved("saved");
    } catch {
      setSaved("error");
    }
  };

  return (
    <section className="card grid gap-3 p-4">
      <div>
        <h2 className="font-semibold">{t("backend.title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("backend.intro")}</p>
      </div>
      <div className="grid gap-2">
        {OPTIONS.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="radio"
              name="llm-backend"
              className="mt-1"
              checked={backend === o.value}
              onChange={() => void save(o.value)}
            />
            <span className="min-w-0">
              <span className="font-medium">{t(o.label)}</span>
              <span className="block text-muted">{t(o.hint)}</span>
            </span>
          </label>
        ))}
      </div>
      {backend === "experiential" && !gatewayKey && (
        <p className="text-sm text-bad">{t("backend.missingKey")}</p>
      )}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={saved === "error" ? "text-bad" : "text-muted"}>
          {saved === "idle" ? t("backend.hint") : t(`backend.${saved}` as MessageKey)}
        </span>
        {backend !== null && (
          <button className="btn-ghost py-1 text-xs" onClick={() => void save(null)}>
            {t("backend.reset")}
          </button>
        )}
      </div>
    </section>
  );
}
