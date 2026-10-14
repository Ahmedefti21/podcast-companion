import { z } from "zod";
import { parseTranscript } from "@/lib/transcript";
import { createProvider } from "@/lib/server/provider";
import { generateEpisode } from "@/lib/server/pipeline";
import { enforceQuota } from "@/lib/server/quota";
import { readBody, errorResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const maxDuration = 120;
const input = z.object({
  text: z.string().max(1_000_000),
  filename: z.string().min(1).max(200),
  permission: z.literal(true),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  try {
    const body = input.parse(await readBody(request));
    const transcript = parseTranscript(body.text, body.filename);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(110000)]);
    const provider = createProvider(signal, requestId);
    await enforceQuota();
    const result = await generateEpisode(provider, transcript);
    console.info(
      JSON.stringify({
        event: "generation_complete",
        requestId,
        durationMs: Date.now() - started,
        segments: transcript.segments.length,
      }),
    );
    return Response.json(
      { ...result, transcript, requestId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
