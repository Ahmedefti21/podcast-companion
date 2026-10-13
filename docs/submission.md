# Submission preparation

## Demo script (approximately 2–3 minutes)

1. Explain the user problem: keeping an insight connected to what was actually said.
2. Show the live URL and start a fresh episode using a permitted transcript. Show the real processing result, not only the editorial sample.
3. Click a takeaway's source reference. Point out that untimed input uses passages, while subtitle input retains supplied times.
4. Answer a question, mark confidence, and show the supporting explanation. Show how missed questions create a return path to the relevant chapter.
5. Make the overview shorter. Compare and undo. Demonstrate that chapters and quiz progress remain unchanged.
6. Export the study guide.
7. Briefly explain one actual failure, the validation pipeline, and a limitation.

Do not record API keys, environment files, account identifiers, or provider dashboards containing credentials. The user records and submits the final demonstration. Local live AI generation, revision, and timed export have been checked; a public deployment and smoke test on its URL are still outstanding. The fictional subtitle fixture and review rubric are in `docs/fixtures/`.

## Discussion preparation

- Why full source rather than a vector database? One bounded transcript fits the workflow; retrieval would add another failure mode.
- How are references checked? The parser owns stable IDs; the server validates those IDs and chapter boundaries before displaying content.
- Does a valid citation mean the claim is true? No. An additional model audit and visible source text help, but neither guarantees correctness.
- What does revision touch? Only the overview schema; old overview retained for undo. Quiz state lives separately.
- Why a confidence checkbox? It makes the return path more useful without another AI call. It is self-reported, not a model confidence estimate.
- What happens when the provider fails? A bounded request ends with an actionable message; input and prior results remain.
- How are costs limited? Input/output caps, at most three generation calls per workflow, shared minute/day limits, and the provider's own quota.

## Three improvements, in priority order

1. **Broader source-grounding evaluation, including Bangla and mixed-language material.** Build an annotated fixture set and track support, chapter coverage and answerability. This gives evidence for reliability claims before expanding supported languages.
2. **Audio ingestion with transcription and reliable alignment.** Add asynchronous upload/transcription, audio duration limits, explicit permissions and real seekable timestamps. This opens the product to listeners without transcripts.
3. **Durable jobs and optional saved episodes.** Add authenticated storage, cancellation, retryable jobs and per-user quotas. This supports longer episodes, recovery across devices, and fairer usage at greater scale.

## Submission checklist

- [ ] Public live URL tested
- [x] Real generation and meaningful revision verified locally
- [x] Transcript parsing, chapters, quiz, revision UI and export implemented
- [x] At least two approaches researched with primary-source links
- [x] Architecture, debugging, limitations and maintenance documented
- [x] Original permitted sample available
- [ ] Additional real-source quality evaluation completed
- [ ] User reviewed and committed the desired chunks
- [ ] Final demo recorded
- [ ] Repository and client bundle checked for secrets before publishing
