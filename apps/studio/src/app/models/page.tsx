import { loadLlmBackend, loadModelSettings } from "@ys/pipeline/light";
import { getI18n } from "../../lib/locale";
import { store } from "../../lib/server";
import { LlmBackendForm } from "./llm-backend-form";
import { ModelsForm } from "./models-form";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const [settings, backend, { t }] = await Promise.all([loadModelSettings(store()), loadLlmBackend(store()), getI18n()]);
  return (
    <div className="grid max-w-4xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("models.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("models.intro")}</p>
      </div>
      {/* Arka uç seçimi model seçiminden önce gelir: kota dolduğunda ilk bakılacak yer burası. */}
      <LlmBackendForm initial={backend ?? null} gatewayKey={Boolean(process.env.EXPLABS_API_KEY?.trim())} />
      <ModelsForm initial={settings} />
    </div>
  );
}
