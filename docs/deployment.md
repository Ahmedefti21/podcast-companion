# Deployment checklist

Production deployment: https://podcast-companion-five.vercel.app/

The owner approved transferring the local working credentials into Vercel's sensitive, production-only environment fields and deploying on the Hobby plan. Initial deployment used commit `c2213d4`. The GitHub integration has access to `Ahmedefti21/podcast-companion`; existing repository access was retained.

The selected model is `gemini-3.5-flash-lite`; production `DAILY_REQUEST_LIMIT` is 20 workflow attempts per UTC day. This is an application traffic limit, not a promise of provider capacity. Public generation, source viewing, quiz feedback, a meaningful shorter revision, Compare, Undo and export were verified. Reliability commit `0bb846c` is deployed; see `verification.md` for failed and successful cases and the known output-quality limitation.

## Required before public generation

1. Run a permitted transcript through the real generate and revise endpoints with the deployment key. The local verification used `gemini-3.5-flash-lite`; availability and quotas can differ by project.
2. Confirm the provider project's free allowance or already approved budget. Do not enable billing just to investigate a 403 error.
3. Create/select a shared Redis REST store under an available free tier or approved plan. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as private environment variables.
4. Configure `DAILY_REQUEST_LIMIT`; default 100. The shared app also limits five workflows per minute globally. This protects a small reviewer demo but is not a production multi-user quota design.
5. Run unit tests, typecheck, build, and browser regression suite. Evaluate generated content against more than the demo transcript.

## Vercel deployment

Use the normal Next.js preset with Node.js 22+, install `npm ci`, build `npm run build`. Set all private environment variables in the deployment settings, never source files or NEXT_PUBLIC variables. The routes use a 120-second maximum duration and abort provider work after 110 seconds; the browser allows 125 seconds for response handling. Vercel documents a 300-second Hobby limit with Fluid Compute enabled by default; verify this when moving to another host. See [function duration limits](https://vercel.com/docs/functions/configuring-functions/duration).

Deployment uses the Vercel dashboard's GitHub integration. Future pushes to the connected production branch can trigger another production build.

### Exact dashboard handoff

For a fresh setup, import `Ahmedefti21/podcast-companion` from GitHub in Vercel. Use the repository root and the Next.js framework preset; leave the output directory at the framework default. The initial deployment used Vercel's detected build/install defaults. The local checkout is not linked through Vercel CLI.

Add these variables to the intended deployment environment before deploying:

| Name                       | Value / source                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`           | The working private value from `.env.local`; save as Secret where available.                                     |
| `GEMINI_MODEL`             | `gemini-3.5-flash-lite`                                                                                          |
| `UPSTASH_REDIS_REST_URL`   | The verified local REST URL.                                                                                     |
| `UPSTASH_REDIS_REST_TOKEN` | The verified regular REST token; save as Secret where available.                                                 |
| `DAILY_REQUEST_LIMIT`      | Choose using the workflow/model-call distinction below; do not assume the local 100 fits the provider allowance. |

Production and Preview variables have separate scopes. Only grant live credentials to environments that should generate real output. Reusing the same Redis database also shares the allowance with local testing. Variable changes apply to new deployments, so redeploy after correcting one. See [Vercel environment variables](https://vercel.com/docs/environment-variables) and [build settings](https://vercel.com/docs/builds/configure-a-build).

Once deployed, use the assigned HTTPS URL for the smoke test below and add the verified URL to the README. Mark the workflow verified only after real generation and revision work there.

## Upstash setup for this project

The owner has created Upstash and has a Vercel account. In [Upstash Console](https://console.upstash.com), open the Redis database, then Connect → REST. Copy the REST URL and regular REST token from the same database into `.env.local`, and later into Vercel as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The Redis connection password is not the REST token; a read-only token cannot update usage counters. Choose a primary region near the Vercel deployment region. Keep credentials out of chat, source files, screenshots and `NEXT_PUBLIC_*` variables.

This database stores expiring global minute and day counters. It does not receive transcripts, model output, Gemini API keys, user identifiers or IP addresses. The REST token is sent to Upstash for authentication, not stored as counter data.

`DAILY_REQUEST_LIMIT` counts app workflow attempts, including revisions, not Gemini model calls. Each accepted workflow can make up to three generation calls, so 20 workflows could consume 60 model calls. The default 100 is not a promise of free-tier capacity. Before publishing, check the current project's **Gemini 3.5 Flash-Lite** allowance in AI Studio and choose a lower app limit that leaves room for audits, repairs and other project usage. For example, if the actual allowance were 20 model calls per day, five workflows would budget up to 15 generation calls. The earlier Gemini 3.8 screenshot does not establish this model's quota.

The app's UTC day and fixed minute windows do not match all provider accounting windows. Google documents a Pacific-midnight daily reset and project-level, model-dependent limits; five app workflows per minute can also exceed a provider's model-call RPM limit. These counters limit app traffic, but do not guarantee provider quota availability or impose a monetary billing cap. See [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

If a connection check returns `401 WRONGPASS`, re-copy both REST values from Connect → REST and restart the local server. Upstash documents this as a missing or invalid HTTP auth token: [authentication troubleshooting](https://upstash.com/docs/redis/troubleshooting/http_unauthorized). Confirm authentication and a counter write before marking deployment ready.

## Live smoke test

- Open the live URL in a fresh browser session; sample loads without credentials being exposed.
- Generate from the original sample through the real API, then inspect at least three citations.
- Test a timed `.srt` file and untimed `.txt` separately.
- Complete the quiz, including one confident mistake, and inspect the review path.
- Shorten the overview; confirm chapter titles and quiz progress are unchanged; compare and undo.
- Download the study guide and confirm source passages are included.
- Verify 400/403/413/429/503 errors retain input or previous results as appropriate.
- Verify secrets are absent from Git and client assets.
- Check the mobile layout and keyboard focus.

If quota configuration is missing, production returns 503 for live generation while the sample still works. Do not present that state as a finished submission.
