import { z } from "zod";

export const CameraPreset = z.enum(["epic_establishing", "dramatic_reveal", "character_reaction", "mythological_action", "object_macro", "map_journey", "parallel_story", "slow_reconstruction"]);
export type CameraPreset = z.infer<typeof CameraPreset>;

export const NarrativeAct = z.object({
  id: z.string(),
  purpose: z.enum(["hook", "setup", "escalation", "twist", "crisis", "payoff", "reflection"]),
  sceneIds: z.array(z.string()).min(1),
  emotionalTurn: z.string(),
  openLoop: z.string().optional(),
  payoff: z.string().optional(),
});
export type NarrativeAct = z.infer<typeof NarrativeAct>;

export const AudioCue = z.object({
  atSec: z.number().nonnegative(),
  kind: z.enum(["music", "ambience", "sfx", "silence", "narration_emphasis"]),
  description: z.string(),
  intensity: z.number().min(0).max(1).default(0.5),
});
export type AudioCue = z.infer<typeof AudioCue>;

export const DocumentaryBlueprint = z.object({
  version: z.literal(1),
  hook: z.string(),
  acts: z.array(NarrativeAct).min(1),
  visualMotifs: z.array(z.string()).default([]),
  continuityRules: z.array(z.string()).default([]),
  audioCues: z.array(AudioCue).default([]),
  createdAt: z.string(),
});
export type DocumentaryBlueprint = z.infer<typeof DocumentaryBlueprint>;

export const VideoReviewFinding = z.object({
  timeSec: z.number().nonnegative(),
  severity: z.enum(["info", "minor", "major", "critical"]),
  category: z.enum(["visual_narration_mismatch", "action_timing", "continuity", "repetition", "low_motion", "transition", "audio_narration", "subtitle_timing", "pronunciation"]),
  observation: z.string(),
  suggestedFix: z.string(),
  regenerate: z.array(z.string()).default([]),
});
export type VideoReviewFinding = z.infer<typeof VideoReviewFinding>;

export const MultimodalVideoReview = z.object({
  version: z.literal(1),
  renderId: z.string(),
  score: z.object({ storytelling: z.number().min(0).max(10), visual: z.number().min(0).max(10), motionEditing: z.number().min(0).max(10), audio: z.number().min(0).max(10), accuracyClarity: z.number().min(0).max(10) }),
  findings: z.array(VideoReviewFinding),
  status: z.enum(["not_run", "advisory", "needs_revision", "passed"]),
  evidence: z.object({ sampledFrames: z.number().int().nonnegative(), sampledAudio: z.boolean(), transcriptBound: z.boolean() }),
  at: z.string(),
});
export type MultimodalVideoReview = z.infer<typeof MultimodalVideoReview>;

export const ProductionProfile = z.object({
  language: z.enum(["hi", "or"]), displayName: z.string(), scriptInstructions: z.string(), ttsLocale: z.string(), subtitleFontFamily: z.string(), subtitleDirection: z.literal("ltr"), numberStyle: z.string(), pronunciationNotes: z.array(z.string()), nativeReviewRequired: z.boolean().default(true),
});
export type ProductionProfile = z.infer<typeof ProductionProfile>;

export const PRODUCTION_PROFILES: Record<"hi" | "or", ProductionProfile> = {
  hi: { language: "hi", displayName: "Hindi documentary", scriptInstructions: "Write natural spoken Hindi in Devanagari. Preserve Sanskrit names and familiar Hindi usage; avoid literal English calques.", ttsLocale: "hi-IN", subtitleFontFamily: "Noto Sans Devanagari", subtitleDirection: "ltr", numberStyle: "Use digits in captions and natural Hindi pronunciation in speech.", pronunciationNotes: ["Keep deity and place names consistent across script, voice and captions.", "Review Sanskrit compounds for natural spoken pronunciation."], nativeReviewRequired: true },
  or: { language: "or", displayName: "Odia documentary", scriptInstructions: "Write natural spoken Odia in Odia script. Prefer regionally familiar terms and do not mechanically translate Hindi sentence structure.", ttsLocale: "or-IN", subtitleFontFamily: "Noto Sans Oriya", subtitleDirection: "ltr", numberStyle: "Use digits in captions and validate spoken number forms with a native reviewer.", pronunciationNotes: ["Maintain consistent Odia spellings for names and sacred terms.", "Require native-speaker review before publication."], nativeReviewRequired: true },
};

export function productionProfileFor(language: string): ProductionProfile | undefined {
  return PRODUCTION_PROFILES[language.split("-")[0] as "hi" | "or"];
}
