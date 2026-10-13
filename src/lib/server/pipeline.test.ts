import { describe, expect, it, vi } from "vitest";
import { auditItems, generateEpisode, reviseOverview } from "./pipeline";
import { SAMPLE_EPISODE, sampleRevision, sampleWorkspace } from "../sample";
import type { Provider } from "./provider";
import type { Episode } from "../schema";
import { ServiceError } from "./errors";

const transcript = sampleWorkspace().transcript;
function checks(episode: Episode, unsupported: string[] = []) {
  return {
    checks: [
      "metadata",
      ...episode.overview.summary.map((_, i) => `summary-${i}`),
      ...episode.overview.takeaways.map((_, i) => `takeaway-${i}`),
      ...episode.chapters.map((_, i) => `chapter-${i}`),
      ...episode.quiz.map((_, i) => `quiz-${i}`),
    ].map((id) => ({ id, supported: !unsupported.includes(id) })),
  };
}
function provider(...results: unknown[]) {
  const generate = vi.fn();
  for (const result of results) generate.mockResolvedValueOnce(result);
  return { generate, checkSize: vi.fn().mockResolvedValue(undefined) } as unknown as Provider;
}

describe("generation pipeline", () => {
  it("checks input size and audits supported results", async () => {
    const p = provider(structuredClone(SAMPLE_EPISODE), checks(SAMPLE_EPISODE));
    const result = await generateEpisode(p, transcript);
    expect(result.episode).toEqual(SAMPLE_EPISODE);
    expect(result.warnings).toEqual([]);
    expect(p.checkSize).toHaveBeenCalledOnce();
    expect(p.generate).toHaveBeenCalledTimes(2);
  });
  it("repairs invalid source IDs once before auditing", async () => {
    const broken = structuredClone(SAMPLE_EPISODE);
    broken.overview.summary[0].sourceIds = ["s999"];
    const p = provider(broken, structuredClone(SAMPLE_EPISODE), checks(SAMPLE_EPISODE));
    await expect(generateEpisode(p, transcript)).resolves.toHaveProperty(
      "episode.title",
      SAMPLE_EPISODE.title,
    );
    expect(p.generate).toHaveBeenCalledTimes(3);
  });
  it("stops after the single structural repair budget", async () => {
    const broken = structuredClone(SAMPLE_EPISODE);
    broken.chapters[0].endId = "s999";
    const p = provider(broken, broken);
    await expect(generateEpisode(p, transcript)).rejects.toHaveProperty("code", "INVALID_OUTPUT");
    expect(p.generate).toHaveBeenCalledTimes(2);
  });
  it("removes unsupported quiz items and reports the omission", async () => {
    const p = provider(structuredClone(SAMPLE_EPISODE), checks(SAMPLE_EPISODE, ["quiz-0"]));
    const result = await generateEpisode(p, transcript);
    expect(result.episode.quiz).toHaveLength(3);
    expect(result.warnings[0]).toContain("1 item was removed");
  });
  it("does not publish unsupported chapters", async () => {
    const p = provider(structuredClone(SAMPLE_EPISODE), checks(SAMPLE_EPISODE, ["chapter-0"]));
    await expect(generateEpisode(p, transcript)).rejects.toHaveProperty(
      "code",
      "UNSUPPORTED_CHAPTER",
    );
  });
  it("requires a check for every audited item", async () => {
    const p = provider({ checks: [{ id: "other", supported: true }] });
    await expect(
      auditItems(p, [{ id: "summary-0", text: "Claim", sourceIds: ["s1"] }], transcript),
    ).rejects.toHaveProperty("code", "AUDIT_INCOMPLETE");
  });
  it("does not retry a provider quota failure", async () => {
    const p = provider();
    vi.mocked(p.generate).mockRejectedValue(new ServiceError("RATE_LIMIT", "Quota exhausted", 429));
    await expect(generateEpisode(p, transcript)).rejects.toHaveProperty("code", "RATE_LIMIT");
    expect(p.generate).toHaveBeenCalledOnce();
  });
});

describe("targeted revision", () => {
  it("returns only an overview and preserves the original episode", async () => {
    const original = structuredClone(SAMPLE_EPISODE);
    const revised = sampleRevision("shorter");
    const p = provider(revised, {
      checks: [
        ...revised.summary.map((_, i) => `summary-${i}`),
        ...revised.takeaways.map((_, i) => `takeaway-${i}`),
      ].map((id) => ({ id, supported: true })),
    });
    expect(await reviseOverview(p, transcript, original.overview, "shorter")).toEqual(revised);
    expect(original).toEqual(SAMPLE_EPISODE);
  });
  it("rejects a revision that does not become shorter", async () => {
    const overview = structuredClone(SAMPLE_EPISODE.overview);
    const p = provider(overview, {
      checks: [
        ...overview.summary.map((_, i) => `summary-${i}`),
        ...overview.takeaways.map((_, i) => `takeaway-${i}`),
      ].map((id) => ({ id, supported: true })),
    });
    await expect(reviseOverview(p, transcript, overview, "shorter")).rejects.toHaveProperty(
      "code",
      "REVISION_NOT_SHORTER",
    );
  });
});
