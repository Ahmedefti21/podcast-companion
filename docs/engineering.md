# Engineering notes

## Architecture

The browser keeps a single workspace in memory. It sends permitted transcript text to a Next.js route handler; only the server reads credentials. Neither transcripts nor results are persisted by the application. Provider retention and free-tier data processing are separate and disclosed to users.

```text
Transcript input
  -> byte/format/word validation
  -> source passages with stable IDs and optional supplied timing
  -> quota and source-token budget checks
  -> schema-constrained generation
  -> schema + reference + chapter + quiz validation
  -> semantic audit against cited source IDs
  -> checked results in the browser

Overview revision
  -> original transcript + selected overview + allowed revision mode
  -> generate and validate only the overview
  -> audit its support
  -> replace overview, retain old version for undo
```

`src/lib/transcript.ts` owns source parsing. `schema.ts` owns the public data contracts. `evidence.ts` validates source IDs, complete ordered chapter ranges, and distinct quiz options. `server/provider.ts` contains the SDK boundary and generation budget. `server/pipeline.ts` coordinates generation, repair, audit and revision. Routes validate untrusted requests; UI components never import the server provider.

## Reliability choices

The first generation returns explicit source references. Deterministic checks reject invalid structures, nonexistent references, chapter gaps/overlaps, duplicate item IDs, and duplicate choices. One new attempt is allowed for structural/reference failures. Provider/network failures are not automatically retried.

An additional model call checks factual support, qualifiers and quiz answerability. Every expected audit ID must appear exactly once; missing checks do not count as success. Each item carries only its cited passages and asks for brief reasoning before the support decision. This repeats passages across items and increases audit input tokens, trading efficiency for clearer evidence boundaries. Unsupported summary statements, takeaways and questions are removed with an explicit warning. Unsupported metadata/chapters or too little remaining content cause a visible failure. The application does not display a made-up confidence score or label content fact-checked.

A valid citation is not proof of entailment, and a model audit can also be wrong. Users can inspect the original passages. Content quality still needs evaluation with multiple real, permitted episodes before submission; see verification.md.

## Bounded execution

Each request allows at most three generation calls (initial result, optional structural repair, audit), plus one token-count request. A 55-second abort signal covers provider operations; route maximum duration is 60 seconds. Each generation response is capped at 8,192 tokens. Shortening must reduce summary word count by at least 30% or it fails while retaining the previous version.

Global shared limits: five requests per minute and a configurable daily request allowance (default 100, clamped to 1–1,000). An atomic Redis script updates counters across server instances. Counters include failed attempts; they contain no transcript or user identity. Local development has a process-local minute limit only. These limits bound requests, not exact monetary spend; enforce billing limits in the provider account as well. A single user can exhaust a shared allowance, which is a documented prototype limitation.

## Security and input handling

- `.env.local` is ignored; no `NEXT_PUBLIC_` secret values.
- Same-origin browser check uses the actual Host header, allowing Next's internal URL canonicalization. This is CSRF defense, not authentication. Public non-browser callers are bounded by the same shared quotas.
- Streaming body-size checks do not trust Content-Length.
- File formats, UTF-8 decoding, word limits and source ranges are validated.
- React text rendering does not execute transcript markup.
- Transcript and prior generated output are explicitly untrusted data in prompts. The model has no tools, browser access, filesystem access or credentials in its input.
- Model logs contain request IDs, model name, token usage and duration, not transcript bodies or API keys.
- No automatic provider failover or sending content to an undisclosed provider.
- Production generation fails closed when quota protection is unavailable.

## Product scope and trade-offs

One bounded transcript is provided in full, so a retrieval index would add complexity without demonstrated benefit. Native dialog semantics provide modal focus behavior and Escape dismissal. The optional confidence marker and return path are computed locally from quiz results; they do not need another model call and are not psychological assessments.

All workspace state is ephemeral. The interface says 'In this tab'; a refresh starts over. Time-based chapters depend on the accuracy of provided subtitle times. No audio transcription or playback is implemented. The sample is authored, not generated in the current session. The quiz is a self-study exercise, not a secure exam; its answers are available in browser data and exported guides.

Semantic CSS was chosen over adding Tailwind because this single workspace benefits from a compact, explicit token and component stylesheet. Styles and components need further splitting if the app grows. Native WebVTT support currently covers common cue formats rather than every advanced subtitle construct.

## Maintenance

Pin the provider model and SDK versions; re-run fixtures and at least one live smoke test before changing them. Monitor deprecations, quotas and prices. Refresh dependencies deliberately after checking advisory and build results. Keep provider-specific changes in the adapter. The SDK's model list alone is insufficient to establish account-level generation access, as discovered during setup.
