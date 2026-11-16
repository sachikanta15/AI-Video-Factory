import { describe, expect, it } from "vitest";
import { choreographShots } from "../src/choreography.ts";

const shot = (id: string) => ({ id, sceneId: "s1", kind: "still_motion" as const, startMs: 0, endMs: 1000, description: "", imagePrompt: "", motionPrompt: "", camera: "static" as const });

describe("cinematic choreography", () => {
  it("assigns a preset to legacy shots and keeps a renderable camera fallback", () => {
    const result = choreographShots([shot("a"), shot("b"), shot("c")]);
    expect(result.every((item) => item.cameraPreset)).toBe(true);
    expect(result.every((item) => ["push_in", "pull_out", "pan_left", "pan_right", "static"].includes(item.camera))).toBe(true);
  });

  it("does not repeat adjacent presets", () => {
    const result = choreographShots(Array.from({ length: 8 }, (_, i) => shot(String(i))));
    expect(result.slice(1).every((item, i) => item.cameraPreset !== result[i]!.cameraPreset)).toBe(true);
  });
});
