import { z } from "zod";
import { overviewSchema } from "@/lib/schema";
import { parseTranscript } from "@/lib/transcript";
import { createProvider } from "@/lib/server/provider";
import { reviseOverview } from "@/lib/server/pipeline";
import { enforceQuota } from "@/lib/server/quota";
import { readBody, errorResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const maxDuration = 120;
const input = z.object({
  text: z.string().max(1_000_000),
  filename: z.string().min(1).max(200),
  overview: overviewSchema,
  mode: z.enum(["shorter", "simpler"]),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = input.parse(await readBody(request));
    const transcript = parseTranscript(body.text, body.filename);
    const provider = createProvider(
      AbortSignal.any([request.signal, AbortSignal.timeout(110000)]),
      requestId,
    );
    await enforceQuota();
    const overview = await reviseOverview(provider, transcript, body.overview, body.mode);
    return Response.json({ overview, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
