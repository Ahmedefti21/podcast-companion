import { LIMITS, type Segment, type Transcript } from "./schema";

export class InputError extends Error {}

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function seconds(value: string): number {
  const parts = value.replace(",", ".").split(":");
  if (parts.length < 2 || parts.length > 3)
    throw new InputError(
      "A subtitle timestamp is invalid. Correct the file or paste its text without timestamps.",
    );
  const [s, m, h = 0] = parts.reverse().map(Number);
  if (![s, m, h].every(Number.isFinite) || s >= 60 || m >= 60 || Math.min(s, m, h) < 0) {
    throw new InputError(
      "A subtitle timestamp is invalid. Correct the file or paste its text without timestamps.",
    );
  }
  return h * 3600 + m * 60 + s;
}

export function parseTranscript(raw: string, filename = "transcript.txt"): Transcript {
  if (new TextEncoder().encode(raw).byteLength > LIMITS.maxBytes)
    throw new InputError("This file is too large. Use a text file under 1 MB.");
  const extension = filename.split(".").at(-1)?.toLowerCase();
  if (!["txt", "srt", "vtt"].includes(extension ?? ""))
    throw new InputError(
      "Use a .txt, .srt, or .vtt transcript. Audio uploads are not supported yet.",
    );
  if (raw.includes("\0"))
    throw new InputError(
      "This does not look like a text transcript. Export it as UTF-8 text and try again.",
    );
  const text = raw
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  const format = extension as Transcript["format"];
  let pieces: Omit<Segment, "id" | "index">[];
  if (format !== "txt") {
    pieces = [];
    let previousStart = -1;
    for (const block of text.split(/\n\s*\n/)) {
      if (/^(WEBVTT|NOTE(?:\s|$)|STYLE(?:\s|$)|REGION(?:\s|$))/.test(block)) continue;
      const lines = block.split("\n");
      const timingIndex = lines.findIndex((line) => line.includes("-->"));
      if (timingIndex < 0)
        throw new InputError(
          "A subtitle cue is missing timestamps. Correct the file or paste the content as plain text.",
        );
      const timing = lines[timingIndex].match(
        /^(\d{2,}:\d{2}(?::\d{2})?[.,]\d{3})\s+-->\s+(\d{2,}:\d{2}(?::\d{2})?[.,]\d{3})(?:\s.*)?$/,
      );
      if (!timing)
        throw new InputError(
          "A subtitle timestamp is malformed. Correct the file or paste the content as plain text.",
        );
      const start = seconds(timing[1]);
      const end = seconds(timing[2]);
      if (end <= start || start < previousStart)
        throw new InputError(
          "Subtitle timestamps are out of order or have an invalid duration. Correct the file or paste it as plain text.",
        );
      previousStart = start;
      const cue = lines
        .slice(timingIndex + 1)
        .join(" ")
        .replace(/<[^>]*>/g, "")
        .trim();
      if (cue) pieces.push({ text: cue, start, end });
    }
    // Merge adjacent short cues into navigable passages while retaining supplied timing.
    const merged: typeof pieces = [];
    for (const piece of pieces) {
      const last = merged.at(-1);
      if (
        last &&
        countWords(last.text) + countWords(piece.text) <= 100 &&
        piece.start! - last.end! < 5
      ) {
        last.text += ` ${piece.text}`;
        last.end = Math.max(last.end!, piece.end!);
      } else merged.push({ ...piece });
    }
    pieces = merged;
  } else {
    // Slice source paragraphs at word boundaries; do not ask a model to rewrite the source.
    pieces = text.split(/\n\s*\n/).flatMap((paragraph) => {
      const words = [...paragraph.matchAll(/\S+/g)];
      const chunks: { text: string }[] = [];
      for (let i = 0; i < words.length; i += 150) {
        const last = words[Math.min(i + 149, words.length - 1)];
        chunks.push({
          text: paragraph.slice(words[i].index!, last.index! + last[0].length).trim(),
        });
      }
      return chunks;
    });
  }
  const wordCount = countWords(pieces.map((p) => p.text).join(" "));
  if (wordCount < LIMITS.minWords)
    throw new InputError(
      `Add more of the episode: at least ${LIMITS.minWords} words are needed (${wordCount} provided).`,
    );
  if (wordCount > LIMITS.maxWords)
    throw new InputError(
      `This transcript has ${wordCount.toLocaleString()} words. Use an excerpt of up to 12,000 words.`,
    );
  if (pieces.length > LIMITS.maxSegments)
    throw new InputError(
      "This transcript has too many separate passages. Combine short paragraphs and try again.",
    );
  return {
    segments: pieces.map((p, i) => ({ ...p, id: `s${i + 1}`, index: i })),
    wordCount,
    timed: format !== "txt",
    format,
  };
}

export function formatTime(value: number): string {
  const whole = Math.floor(value);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  return `${h ? `${h}:` : ""}${h ? String(m).padStart(2, "0") : m}:${String(whole % 60).padStart(2, "0")}`;
}

export function sourceLabel(ids: string[], transcript: Transcript): string {
  const segments = transcript.segments.filter((s) => ids.includes(s.id));
  if (!segments.length) return "Source unavailable";
  if (transcript.timed && segments[0].start !== undefined)
    return `At ${formatTime(segments[0].start)}`;
  const indices = segments.map((s) => s.index + 1);
  return indices.length === 1 ? `Passage ${indices[0]}` : `Passages ${indices.join(", ")}`;
}
