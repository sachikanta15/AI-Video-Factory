# LLM backends

Every agent call goes through one `QueryFn` (`packages/agents/src/runner.ts`). Which backend produces that function is
a single choice, stored as `settings/llm-backend.json` and overridable per process with `YS_AGENT_BACKEND`.

| Backend | `YS_AGENT_BACKEND` | Adapter | Billing |
| --- | --- | --- | --- |
| Claude Agent SDK (default) | `claude` or unset | `@anthropic-ai/claude-agent-sdk` | `ANTHROPIC_API_KEY` |
| OpenCode subscription CLI | `opencode` | `packages/agents/src/opencode.ts` | Subscription quota (weekly/monthly) |
| Experiential gateway | `experiential` | `packages/agents/src/gateway.ts` | Experiential credits |

`agentQueryFn()` in `packages/agents/src/gateway.ts` resolves the choice; `agentEnv()` in
`packages/pipeline/src/settings.ts` applies the stored setting. The CLI reads `.env` at startup and then lets the
stored setting win, so switching in the Studio takes effect on the next job without restarting the server.

## Switching in the Studio

Studio → **Models** → **Agent backend**. The choice is saved immediately and applies to the next job; a running job
finishes on the backend it started with. The section shows a warning when the gateway is selected but
`EXPLABS_API_KEY` is missing.

Use the gateway when the subscription quota runs out (15 November 2026: weekly limit, 28 hours). Use `opencode` when
the subscription is the cheaper path; the gateway has no per-run cost tracking of its own (see below).

## Experiential gateway

- Base URL: `EXPLABS_BASE_URL`, default `https://api.experientiallabs.ai/v1` (OpenAI Chat Completions).
- Key: `EXPLABS_API_KEY`. Missing key fails the first agent call with an actionable message instead of crashing at
  startup. Create keys under Settings → API Keys at `api.experientiallabs.ai`.
- Model: `EXPLABS_MODEL`, default `gpt-6-luna`. Every tier alias (`claude-opus-5-5`, `claude-haiku-5-5`, …) maps to
  this one model, so per-agent model choices do not change the gateway model.
- Vision: images are sent as `image_url` data URLs. `EXPLABS_VISION_MODEL` defaults to `EXPLABS_MODEL`; `gpt-6-luna`
  reads images, so the default is fine. Override it only if a future model rejects image parts.
- No streaming and no tool calls: the pipeline asks for one final result and agents run with `tools: []`.

Because the endpoint does not enforce `json_schema`, the adapter writes the schema into the prompt, parses the reply
with `extractJson()` and repairs invalid enum values with `repairEnums()` — the same path the OpenCode adapter uses.

### Known limitations

- **Cost is not visible, but credits are still spent.** The gateway returns `usage.cost: 0` on every call, so the
  ledger stores `total_cost_usd: 0` and Costs shows `$0` for gateway runs. The platform account is nevertheless
  debited and reserves a hold per request. On 15 November 2026 a Chhath re-run spent part of the account's balance and
  then failed with `HTTP 429 insufficient_credits` ("available after reservations: -5.57 credits"), because holds from
  parallel agent calls stacked up. Check the balance at `platform.experientiallabs.ai/credits`; a trivial request with
  a tiny `max_tokens` can still succeed while larger pipeline calls are refused, so a single probe is not proof that
  the account can finish a run.
- **The ledger names the tier, not the model.** Entries read `claude:claude-sonnet-5-5` even though `gpt-6-luna`
  answered. Do not read the ledger model column as proof of which provider served a run.
- **Truncated replies are retried.** A `content: null` reply (for example when a reasoning model is cut off) is a
  transient error, so the runner retries it.
