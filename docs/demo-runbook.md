# Recording runbook

Live app: https://podcast-companion-five.vercel.app/

Use your own screen recorder and narration; avoid provider dashboards and environment files. Inspect generated claims before recording, since model auditing can miss unsupported details.

## Before recording

- Open the public URL in a fresh tab. Close unrelated tabs and silence notifications.
- Use `docs/fixtures/creative-habit-excerpt.txt` (339 words) for the short core demonstration. It is original fictional material and has no timing data. The optional `repair-cafe.srt` demonstrates authored subtitle times, not alignment to real audio.
- Reserve quota for one generation and one revision (up to six model generation calls). Do not record repeated retries if the provider is busy.
- Check the actual generated claims and quiz explanations against the fixture rubric before presenting them. Do not reuse an earlier output containing the known home-repair overstatement as a verified result.

## Suggested narration and actions

| Time      | Show                                                            | Explain in your own words                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Overview and public URL                                         | “Recast helps a listener turn a transcript into a study guide, while keeping each insight connected to its original source.”                                                                                                              |
| 0:15–0:40 | New episode, text upload, permission, generation                | “I’m using an original fictional transcript. Recast checks its size and structure before sending it to Gemini. The sample preview is labeled separately from real generation.”                                                            |
| 0:40–1:05 | Generated summary and a passage source drawer                   | “The parser assigns passage IDs. Clicking this citation opens the exact original text. Untimed text uses passages; subtitle uploads retain supplied timestamps.”                                                                          |
| 1:05–1:35 | Practice; one deliberately wrong answer with confidence checked | “Confidence is self-reported. Missed questions point back to supporting chapters, so the feedback suggests what to revisit.”                                                                                                              |
| 1:35–2:05 | Make shorter, Compare, Undo                                     | “Revision changes only the overview. Compare shows the difference, and Undo restores the previous text without resetting quiz progress.”                                                                                                  |
| 2:05–2:20 | Download and open the Markdown guide                            | “The export includes chapters, an answer key, and the original passages so it remains useful outside the app.”                                                                                                                            |
| 2:20–2:45 | Source view or architecture notes                               | “The server validates references and makes a separate model audit call. That audit can still miss a factual overstatement; it is not a guarantee of truth. Input limits, call budgets, deadlines, and shared Redis counters bound usage.” |

Generation duration varies. Extend the recording or clearly disclose a cut during waiting; do not imply a prerecorded result was generated instantly. Completing the full quiz may need extra time. If showing the missed-chapter return path, finish the remaining questions before opening “Review what I missed.”

## Submit together

- Verified public deployment URL.
- GitHub repository URL: https://github.com/Ahmedefti21/podcast-companion
- Demo video link that reviewers can open.
- README, research, engineering, debugging, and verification notes already in the repository.

Describe this as a transcript-first competition prototype. Accounts, persistent episode storage, audio ingestion, and guaranteed factual verification are not implemented.
