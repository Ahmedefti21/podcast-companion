import { type Workspace } from "./schema";
import { sourceLabel } from "./transcript";

export function exportMarkdown(workspace: Workspace): string {
  const { episode, transcript } = workspace;
  const source = (ids: string[]) => `(${sourceLabel(ids, transcript)})`;
  return [
    `# ${episode.title}`,
    "",
    workspace.isSample
      ? "Original fictional sample; editorial results, not a live AI generation."
      : "AI-generated study guide. Check interpretations against the source.",
    "",
    "## Overview",
    "",
    ...episode.overview.summary.map((c) => `${c.text} ${source(c.sourceIds)}\n`),
    "## Takeaways",
    "",
    ...episode.overview.takeaways.map((c) => `- ${c.text} ${source(c.sourceIds)}`),
    "",
    "## Chapters",
    "",
    ...episode.chapters.map(
      (c) =>
        `### ${c.title}\n\n${c.description}\n\n${sourceLabel([c.startId], transcript)} through ${sourceLabel([c.endId], transcript)}\n`,
    ),
    "## Practice",
    "",
    ...episode.quiz.map(
      (q, i) =>
        `${i + 1}. ${q.prompt}\n${q.choices.map((c, j) => `   ${String.fromCharCode(65 + j)}. ${c}`).join("\n")}\n\n   Answer: ${String.fromCharCode(65 + q.correctIndex)}. ${q.explanation} ${source(q.sourceIds)}\n`,
    ),
    "## Source transcript",
    "",
    ...transcript.segments.map((s) => `### ${sourceLabel([s.id], transcript)}\n\n${s.text}\n`),
    ...(workspace.warnings.length ? ["## Notes", ...workspace.warnings.map((w) => `- ${w}`)] : []),
  ].join("\n");
}
