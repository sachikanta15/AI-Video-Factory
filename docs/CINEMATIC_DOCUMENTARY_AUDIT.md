# Cinematic Documentary Engine audit

## Shared conversation limitation

The shared ChatGPT conversation was accessible in the browser and its complete text was recovered. The earlier review inside that conversation was explicitly documentation-level: it had not cloned or executed the repository. Its claims were therefore treated as hypotheses and checked against this checkout.

## Existing architecture verified

| Area | Existing implementation | Boundary found |
|---|---|---|
| Monorepo | `apps/cli`, `apps/studio`, `apps/worker`; `packages/core`, `agents`, `db`, `media-gateway`, `pipeline`, `storage`, `video` | Strong package boundaries, but the production blueprint was not a persisted stage output. |
| Narrative | `packages/agents/src/agents.ts`: `storyArchitect`, `screenwriter`, `scriptDoctor` | Story beats and scene intent exist; no director-level act/reveal/audio blueprint. |
| Shot planning | `director`, `ShotPlanOut`, `packages/pipeline/src/timing.ts`, `intent.ts`, `variety.ts` | Camera choice was limited to `push_in`, `pull_out`, `pan_left`, `pan_right`, `static`; no named cinematic vocabulary. |
| Visual continuity | `Character`, style bible, concept selection, library, side/reverse views, continuity helpers | Character/style reuse exists; environment/continuity rules were not first-class director output. |
| Rendering | `packages/video` Remotion compositions, chunk cache, FFmpeg assembly, retry/lock logic | Preserve; no renderer rewrite is justified. |
| Technical review | `packages/video/src/render-audit.ts`, `packages/pipeline/src/render-audit.ts` | Real export measurements exist for black/freeze/motion/audio; semantic audiovisual review is explicitly skipped. |
| Frame review | `frameInspector`, draft/final review workflow | Frame-by-frame review cannot prove timing, narration match or continuity across a sequence. |
| Research | `packages/core/src/research.ts`, `packages/pipeline/src/research.ts`, Studio sources UI | Claims and editor-supplied sources are persisted; automatic retrieval/verification is not implemented. |
| Localization | language codes, pronunciation dictionary, captions and voice audit | Hindi WPM exists; Hindi/Odia production profiles and native-review constraints were not centralized. |
| Sound | music/SFX synthesis, voice alignment, voice-stem audit | Advanced sound direction is a prompt/planning gap, not a missing mixer. |
| Publishing | title/metadata/thumbnail/one Short package | No verified YouTube upload or analytics loop. |

## Priority plan and implementation status

### P0

1. Documentary Director — implemented as `DocumentaryBlueprint` plus `documentaryDirector`; called at the existing `shots` stage and persisted in `EpisodeState.documentaryBlueprint`.
2. Cinematic choreography — implemented as `CameraPreset` and deterministic `choreographShots`; old camera values remain populated for legacy Remotion/timeline behavior.
3. Multimodal reviewer — implemented as a strict `MultimodalVideoReview` contract and `multimodalVideoReviewer` agent prompt. It is advisory until sampled rendered frames/audio are wired into a production job; technical audits must not be upgraded silently.

### P1

Research/source verification, visual bible deepening, Hindi/Odia profile adoption in forms/voice providers, and advanced sound-design execution remain the next implementation slices. Existing research, character, voice, and sound modules are reusable; do not fork them.

### P2

YouTube OAuth/upload/analytics and multi-Short/thumbnail experiments remain intentionally unimplemented until the export identity and approval model are connected to external channel state.

## Constraints preserved

- Media generation remains behind the gateway.
- Remotion/FFmpeg, chunk caching, locks, fallbacks, approvals and old state files remain compatible.
- Agent outputs remain structured JSON and tool-free.
- Semantic review records evidence limits and cannot claim pronunciation, mix quality or factual correctness from frames alone.
- No automatic publishing is introduced.

## Acceptance criteria for the next slices

- A fixed rendered sample provides ordered frames, transcript/time map and independently measured voice evidence to the reviewer.
- Review findings are bound to `exportId`, time and shot id; missing evidence remains visible.
- Hindi/Odia profile selection changes TTS locale, subtitle font, prompt instructions and pronunciation review requirements.
- Research claims remain source-backed and unresolved claims block final editorial approval.
- Every change is compared against the current vector baseline with typecheck, tests and a real demo render where the local environment supports FFmpeg/Remotion.
