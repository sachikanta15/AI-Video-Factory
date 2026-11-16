import type { CameraPreset } from "@ys/core";
import type { PlannedShotState } from "./state.ts";

const LEGACY_CAMERA: Record<CameraPreset, PlannedShotState["camera"]> = {
  epic_establishing: "pull_out",
  dramatic_reveal: "push_in",
  character_reaction: "push_in",
  mythological_action: "pan_right",
  object_macro: "push_in",
  map_journey: "pan_right",
  parallel_story: "pan_left",
  slow_reconstruction: "pull_out",
};

const PRESETS: CameraPreset[] = ["epic_establishing", "dramatic_reveal", "character_reaction", "mythological_action", "object_macro", "map_journey", "parallel_story", "slow_reconstruction"];

/** Deterministic fallback choreography for all modes, including legacy still timelines. */
export function choreographShots(shots: PlannedShotState[]): PlannedShotState[] {
  let previous: CameraPreset | undefined;
  return shots.map((shot, index) => {
    const preset = shot.cameraPreset ?? PRESETS.find((candidate) => candidate !== previous && (index % 7 !== 6 || candidate === "parallel_story")) ?? "dramatic_reveal";
    previous = preset;
    return { ...shot, cameraPreset: preset, camera: LEGACY_CAMERA[preset] };
  });
}
