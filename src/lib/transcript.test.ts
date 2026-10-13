import { describe, expect, it } from "vitest";
import { parseTranscript, sourceLabel } from "./transcript";
import { SAMPLE_TEXT, SAMPLE_EPISODE } from "./sample";
import { validateEpisode } from "./evidence";

describe("transcript parsing", () => {
  it("preserves source text and provides stable untimed references", () => {
    const transcript = parseTranscript(SAMPLE_TEXT);
    expect(transcript.segments).toHaveLength(12);
    expect(transcript.segments[0].text).toBe(SAMPLE_TEXT.split("\n\n")[0]);
    expect(transcript.timed).toBe(false);
    expect(sourceLabel(["s2"], transcript)).toBe("Passage 2");
    expect(transcript.segments[0].start).toBeUndefined();
  });
  it("parses provided subtitle times and merges adjacent cues", () => {
    const text = `1\n00:00:01,000 --> 00:00:10,000\n${"hello ".repeat(110)}\n\n2\n00:00:11,000 --> 00:00:20,000\n${"world ".repeat(110)}`;
    const transcript = parseTranscript(text, "episode.srt");
    expect(transcript.segments[1].start).toBe(11);
    expect(sourceLabel(["s2"], transcript)).toBe("At 0:11");
  });
  it("supports WebVTT headers, identifiers and cue settings", () => {
    const transcript = parseTranscript(
      `WEBVTT\n\ncue-a\n00:01.000 --> 00:30.000 align:start\n${"hello ".repeat(210)}`,
      "episode.vtt",
    );
    expect(transcript.segments[0].start).toBe(1);
  });
  it("rejects invalid input before generation", () => {
    expect(() => parseTranscript("small")).toThrow("at least 200");
    expect(() => parseTranscript(SAMPLE_TEXT, "file.exe")).toThrow(".txt");
    expect(() => parseTranscript("x".repeat(1_000_001))).toThrow("under 1 MB");
    expect(() => parseTranscript("word ".repeat(12_001))).toThrow("12,000");
    expect(() => parseTranscript(`00:70:00,000 --> 00:71:00,000\n${SAMPLE_TEXT}`, "x.srt")).toThrow(
      "invalid",
    );
  });
});

describe("source contracts", () => {
  const transcript = parseTranscript(SAMPLE_TEXT);
  it("accepts the editorial sample", () =>
    expect(validateEpisode(SAMPLE_EPISODE, transcript)).toEqual(SAMPLE_EPISODE));
  it("rejects nonexistent citations", () => {
    const episode = structuredClone(SAMPLE_EPISODE);
    episode.overview.summary[0].sourceIds = ["s999"];
    expect(() => validateEpisode(episode, transcript)).toThrow("unavailable");
  });
  it("rejects missing chapter coverage", () => {
    const episode = structuredClone(SAMPLE_EPISODE);
    episode.chapters[1].startId = "s5";
    expect(() => validateEpisode(episode, transcript)).toThrow("gaps");
  });
  it("rejects duplicate quiz options", () => {
    const episode = structuredClone(SAMPLE_EPISODE);
    episode.quiz[0].choices[1] = episode.quiz[0].choices[0];
    expect(() => validateEpisode(episode, transcript)).toThrow("duplicate choices");
  });
});
