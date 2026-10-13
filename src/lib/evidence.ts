import { episodeSchema, type Episode, type Overview, type Transcript } from "./schema";

export class EvidenceError extends Error {}

export function validateOverview(overview: Overview, transcript: Transcript): void {
  const valid = new Set(transcript.segments.map((s) => s.id));
  for (const claim of [...overview.summary, ...overview.takeaways]) {
    if (
      new Set(claim.sourceIds).size !== claim.sourceIds.length ||
      claim.sourceIds.some((id) => !valid.has(id))
    ) {
      throw new EvidenceError("An insight references an unavailable or duplicate source passage.");
    }
  }
}

export function validateEpisode(value: unknown, transcript: Transcript): Episode {
  const episode = episodeSchema.parse(value);
  validateOverview(episode.overview, transcript);
  const indices = new Map(transcript.segments.map((s, i) => [s.id, i]));
  let previousEnd = -1;
  for (const chapter of episode.chapters) {
    const start = indices.get(chapter.startId);
    const end = indices.get(chapter.endId);
    if (start === undefined || end === undefined || start !== previousEnd + 1 || end < start) {
      throw new EvidenceError(
        "Chapter ranges must cover the source in order, without gaps or overlaps.",
      );
    }
    previousEnd = end;
  }
  if (previousEnd !== transcript.segments.length - 1)
    throw new EvidenceError("Chapters do not cover the complete source.");
  for (const group of [episode.chapters, episode.quiz]) {
    if (new Set(group.map((item) => item.id)).size !== group.length)
      throw new EvidenceError("Generated item IDs must be unique.");
  }
  for (const q of episode.quiz) {
    if (q.sourceIds.some((id) => !indices.has(id)))
      throw new EvidenceError("A quiz answer references an unavailable source passage.");
    if (new Set(q.choices.map((choice) => choice.trim().toLowerCase())).size !== q.choices.length)
      throw new EvidenceError("A quiz question contains duplicate choices.");
  }
  return episode;
}

export function chapterSourceIds(
  chapter: Episode["chapters"][number],
  transcript: Transcript,
): string[] {
  const start = transcript.segments.findIndex((s) => s.id === chapter.startId);
  const end = transcript.segments.findIndex((s) => s.id === chapter.endId);
  return transcript.segments.slice(start, end + 1).map((s) => s.id);
}
