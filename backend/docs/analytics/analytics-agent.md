# Phase 11 — Analytics Agent

Status: `IMPLEMENTED` (structurally); real interpretation quality `REQUIRES EXTERNAL DATA` (a populated `OPENAI_API_KEY` and real ingested metrics to interpret — verified here only via a stubbed LLM response, consistent with "do not require real API credentials in automated tests").

## What it does

`services/analytics/agents/analyticsAgentService.ts` loads one or more **already-persisted** `AnalyticsFinding` documents (it never computes one — that's `analyticsEngineService.ts`'s job) and asks the LLM (`agents/analyticsAgentLlm.ts`) to explain each: what it means, what might explain it, and its likely business impact. The result is persisted as an `AnalyticsReport`.

## Grounding discipline

The system prompt is explicit: the model reasons **only** over the numbered evidence items already attached to the finding. It is told to say the evidence is insufficient rather than invent a cause. The response is parsed and structurally validated (`agents/analyticsAgentValidation.ts`) before being trusted — malformed or incomplete JSON throws a typed `InvalidAnalyticsAgentLlmResponseError` rather than being silently accepted.

## LLM implementation

Follows the same per-module OpenAI-wrapper convention already established twice in this codebase (`companyIntelligenceLlm.ts`, `contentIntelligenceLlm.ts`) rather than introducing a new shared `AIService`/`LLMProvider` abstraction that has no other caller in this repo (see `architecture.md`). Configurable via `ANALYTICS_AGENT_MODEL` (defaults to `gpt-4o-mini`, same default as the other two modules).

## Failure handling

Missing `OPENAI_API_KEY` throws `AnalyticsAgentConfigurationError` **before** any network call — verified by an automated test. Network/API failures are caught and re-thrown as `AnalyticsAgentLlmRequestError` with the message sanitized against accidental key leakage.
