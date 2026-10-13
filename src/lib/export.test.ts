import { expect, it } from "vitest";
import { exportMarkdown } from "./export";
import { sampleWorkspace } from "./sample";

it("exports a self-contained study guide with source passages and sample disclosure", () => {
  const output = exportMarkdown(sampleWorkspace());
  expect(output).toContain("not a live AI generation");
  expect(output).toContain("## Source transcript");
  expect(output).toContain("### Passage 12");
  expect(output).toContain("Answer: B.");
  expect(output).toContain("## Chapters");
});
