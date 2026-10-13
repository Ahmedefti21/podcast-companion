# Suggested commit chunks

The owner authorized committing and pushing the implementation after verification, preserving the five distinct chunks below. Each commit has its own description of behavior and rationale. Deployment is a separate step.

1. `chore: scaffold Recast and document design decisions`
   - Root configuration and lockfile (including AGENTS.md and formatting configuration); docs/design.md, docs/skill-review.md, this file. Keep .env.local ignored.
2. `feat: parse transcripts and validate source-linked episode data`
   - src/lib/schema.ts, transcript.ts, evidence.ts, sample.ts, export.ts and their unit tests.
3. `feat: add bounded Gemini generation and targeted revisions`
   - src/lib/server/, src/app/api/, related tests and .env.example.
4. `feat: build episode workspace with evidence and recall practice`
   - src/app/ UI files and icon.svg, src/components/.
5. `test: cover learning workflow and document submission setup`
   - tests/, remaining documentation, README and any final fixes.

Each commit description should explain behavior and validation. The final chunk list may change with implementation; review `git diff` and `git status` before staging.

## Scope and review

The first chunk is a scaffold checkpoint, not a separately runnable app until the later source chunks are included. The authored subtitle fixture and its evaluation notes belong in chunk 5. Review the staged paths before each commit. Exclude `.env.local`, `tmp/`, `.next/`, and downloaded study guides. The verification record documents the remaining model-audit limitation; these commits do not claim general factual accuracy or production SaaS completeness.
