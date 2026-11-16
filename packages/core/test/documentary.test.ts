import { describe, expect, it } from "vitest";
import { DocumentaryBlueprint, MultimodalVideoReview, productionProfileFor } from "../src/documentary.ts";

describe("documentary contracts", () => {
  it("provides Hindi and Odia production profiles", () => {
    expect(productionProfileFor("hi-IN")?.ttsLocale).toBe("hi-IN");
    expect(productionProfileFor("or-IN")?.subtitleFontFamily).toContain("Oriya");
  });

  it("keeps semantic review evidence explicit", () => {
    expect(DocumentaryBlueprint.parse({ version: 1, hook: "question", acts: [{ id: "a1", purpose: "hook", sceneIds: ["s1"], emotionalTurn: "wonder" }], createdAt: new Date().toISOString() }).acts).toHaveLength(1);
    expect(MultimodalVideoReview.parse({ version: 1, renderId: "r1", score: { storytelling: 8, visual: 8, motionEditing: 7, audio: 6, accuracyClarity: 8 }, findings: [], status: "advisory", evidence: { sampledFrames: 4, sampledAudio: false, transcriptBound: true }, at: new Date().toISOString() }).evidence.sampledAudio).toBe(false);
  });
});
