import { z } from "zod";

export const LIMITS = {
  minWords: 200,
  maxWords: 12000,
  maxBytes: 1_000_000,
  maxSegments: 400,
} as const;
export type Segment = { id: string; text: string; index: number; start?: number; end?: number };
export type Transcript = {
  segments: Segment[];
  wordCount: number;
  timed: boolean;
  format: "txt" | "srt" | "vtt";
};

const sourceIds = z
  .array(z.string().regex(/^s\d+$/))
  .min(1)
  .max(8);
export const claimSchema = z.object({ text: z.string().min(1).max(1000), sourceIds });
export const overviewSchema = z.object({
  summary: z.array(claimSchema).min(1).max(4),
  takeaways: z.array(claimSchema).min(1).max(5),
});
export const chapterSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(450),
  startId: z.string().regex(/^s\d+$/),
  endId: z.string().regex(/^s\d+$/),
});
export const questionSchema = z.object({
  id: z.string().min(1).max(40),
  prompt: z.string().min(1).max(350),
  choices: z.array(z.string().min(1).max(250)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1).max(600),
  sourceIds,
});
export const episodeSchema = z.object({
  title: z.string().min(1).max(120),
  themes: z.array(z.string().min(1).max(50)).min(1).max(4),
  overview: overviewSchema,
  chapters: z.array(chapterSchema).min(1).max(8),
  quiz: z.array(questionSchema).min(1).max(5),
});
export type Claim = z.infer<typeof claimSchema>;
export type Overview = z.infer<typeof overviewSchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type RevisionMode = "shorter" | "simpler";
export type Workspace = {
  episode: Episode;
  transcript: Transcript;
  rawText: string;
  filename: string;
  isSample: boolean;
  warnings: string[];
  previousOverview?: Overview;
};
