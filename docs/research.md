# Research and comparison

Research checked 2026-10-13. This is a small engineering comparison, not a claim that every option was benchmarked.

## User value

Target: students and early-career professionals learning from educational podcasts. The job is to locate, understand, and revisit ideas. Our hypothesis is that traceable insights and a useful return path after recall practice provide more value than an isolated summary. This has not yet been validated with external user interviews.

## Managed API vs local inference

| Criterion        | Gemini API                                               | Local model through Ollama                                                      |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Capabilities     | Structured JSON output; managed language model inference | JSON Schema output for supported local models                                   |
| Integration      | One server-side SDK adapter and credential               | Model install, hardware sizing and reachable inference service                  |
| Deployment       | Compatible with a bounded server request                 | Public app also needs reliable inference compute                                |
| Quality          | Source support and answerability require evaluation      | Quality depends heavily on selected model and quantization; requires evaluation |
| Cost             | Free quota where available; token charges on paid tier   | Local compute/electricity or hosted compute cost                                |
| Latency          | Network/model dependent; subject to rate limits          | Hardware/model dependent                                                        |
| Content handling | Source sent to Google; free-tier data terms apply        | Can keep inference on controlled hardware                                       |

Decision: use Gemini 3.5 Flash-Lite for the deployed prototype, with a small adapter. Gemini 3.8 Flash repeatedly returned temporary high-demand errors for the full structured request, while 3.5 Flash-Lite completed the same generation-and-audit pipeline and a targeted revision. This reduces infrastructure during an 8–12 hour effort. Ollama was researched but not installed or benchmarked. A valid API key and actual generation access remain required; model-list access does not prove generation access.

Sources and what they changed:

- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output): schema support helps predictable parsing; local schema and evidence checks still remain necessary.
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing): the current table lists Gemini 3.5 Flash-Lite as free of charge on the free tier and describes it as optimized for cost-efficient, high-volume and simple data-processing tasks. We still enforce local request and source limits.
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs): a local alternative supports similar output contracts; inference hosting is the main additional responsibility.
- [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): project/model limits can differ, so we avoid hardcoding promises of free capacity and expose quota failures.
- [Vercel function limits](https://vercel.com/docs/functions/limitations): limit payload size and abort processing before the hosting deadline.
- [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi): an atomic shared counter provides consistent limits across server instances.

## Full bounded source vs retrieval

With one transcript capped at 12,000 words and 24,000 source tokens, including the full source avoids an extra retrieval failure mode. A vector store would be useful for a library of episodes, but would add embeddings, indexing and retrieval evaluation to this sprint. The current schema is compatible with later retrieval because source references already use stable IDs.

## Cost assumptions

The goal is to operate within available free quota, not to enable billing. If a paid tier is later approved, estimate each workflow as:

`input tokens / 1,000,000 × input rate + output (including thinking) tokens / 1,000,000 × output rate`

At the published 2026-10-13 paid Gemini 3.5 Flash-Lite rates ($0.30/M input and $2.50/M output), a hypothetical workflow totaling 15,000 input and 4,000 output/thinking tokens is $0.0145. The free tier currently lists input and output as free of charge. This calculation is illustrative, not a guaranteed ceiling. Long inputs, repairs and revisions add usage. Re-check pricing, quota and hosting/Redis plans before deployment. No subscription or payment was activated by this implementation.

Live verification on the 1,014-word original demo transcript completed with Gemini 3.5 Flash-Lite. Generation plus independent source audit took about 8.5 seconds in the direct pipeline check and used 4,147 input tokens plus 1,767 output tokens across two model calls. It returned four chapters, four quiz questions and no removed unsupported items. A live shorter-overview request also completed: two calls used 3,034 input and 495 output tokens, and reduced the summary from 72 to 47 words while retaining four takeaways. These are single-transcript measurements, not general quality or latency claims.
