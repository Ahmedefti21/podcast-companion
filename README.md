# Recast

Give good ideas a second listen. A podcast transcript becomes a source-linked overview, navigable chapters, and recall practice that sends you back to the passages behind missed answers.

Built for the Thealon AI Engineering Challenge. The product is deliberately transcript-first; no audio playback times are invented.

## What makes it useful

- Follow each insight to the original source passage.
- Shorten or simplify just the overview; compare versions and undo while retaining chapters and quiz progress.
- Mark confidence before checking an answer. Confident mistakes surface as useful places to revisit.
- Review only the chapters supporting missed questions.
- Copy or download a self-contained Markdown study guide, including the source.
- Explore an original fictional sample without credentials. Sample results and revisions are prewritten editorial examples, explicitly labeled in the interface and export.

## Run locally

Requires Node.js 22.13 or later and npm.

```sh
npm ci
```

Copy `.env.example` to `.env.local`. Set `GEMINI_API_KEY` to your own key and select a model available to your project. The verified default is `gemini-3.5-flash-lite`. Do not commit `.env.local` or put keys in client code. The sample works without a key.

```sh
npm run dev
```

Open http://127.0.0.1:3000. Live generation sends the transcript to Google's Gemini API. Use only permitted, non-sensitive content; check the provider's free-tier data terms and your project's quota before processing. The app does not automatically enable billing or fall back to another provider.

## Supported inputs

Pasted plain text, UTF-8 `.txt`, `.srt`, and `.vtt` files; 200–12,000 words; under 1 MB; up to 400 source passages; maximum 24,000 source tokens checked with the provider. Limits apply together. Invalid timing is rejected with directions to correct the file or paste untimed text. Very long paragraphs are divided into source passages. Adjacent subtitle cues may be grouped while keeping their supplied start/end times.

English is the currently tested language. Audio, URL import, accounts, cross-episode search, saved libraries, and background jobs are not implemented. Refreshing the page resets the workspace; download anything you want to keep.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

Optional standalone browser regression suite:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser suite uses sample data and simulated failures, never paid AI calls. Real AI verification is a separate manual smoke test. See [verification notes](docs/verification.md) for what was actually executed and any external blockers.

Known quality limitation: the model audit can approve an unsupported detail even when its source reference is valid. In the timed fixture, it missed a claim that planned home repairs had already been completed. Treat output as a study aid and inspect the original passages; the app does not guarantee factual correctness.

## Production

The application can be hosted as a Next.js app on Vercel. Set server-side `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally `DAILY_REQUEST_LIMIT`. Production generation fails closed if shared quota protection is absent or unavailable. The sample remains accessible.

No public deployment has been made from this checkout. See [deployment checklist](docs/deployment.md). Do not expose the development server as a production service.

## Engineering and submission notes

- [Architecture, reliability and limitations](docs/engineering.md)
- [Provider and approach comparison](docs/research.md)
- [Actual debugging examples](docs/debugging.md)
- [Verification record](docs/verification.md)
- [Demo script and three next improvements](docs/submission.md)
- [Design decisions](docs/design.md) and [design skill review](docs/skill-review.md)
- [Suggested commit chunks](docs/commit-plan.md)

Stack: Next.js, React, TypeScript, Zod, Google GenAI SDK, Lucide, locally bundled Manrope, and semantic CSS with shared design tokens. No agent framework or vector database is needed for one bounded transcript. AI-assisted implementation; all decisions and limitations are documented for review.
