import { z } from "zod";
import { ApiError } from "@google/genai";
import { InputError } from "../transcript";
import { EvidenceError } from "../evidence";
import { ServiceError } from "./errors";

export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ServiceError("CONTENT_TYPE", "Send a JSON request.", 415);
  const origin = request.headers.get("origin");
  // Next may canonicalize request.url to localhost behind its dev/hosting proxy.
  // The browser's Host header still identifies the actual public request target.
  if (origin) {
    let matches = false;
    try {
      const parsed = new URL(origin);
      matches =
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.host === (request.headers.get("host") || new URL(request.url).host);
    } catch {
      /* Malformed origins fail closed. */
    }
    if (!matches)
      throw new ServiceError("ORIGIN", "This request must come from the Recast application.", 403);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceError("EMPTY_BODY", "Add a transcript to continue.", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_150_000) {
      await reader.cancel();
      throw new ServiceError(
        "BODY_LIMIT",
        "This request is too large. Use a shorter transcript.",
        413,
      );
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new ServiceError("INVALID_JSON", "The request could not be read. Please try again.", 400);
  }
}

export function errorResponse(error: unknown, requestId: string): Response {
  let known: ServiceError;
  if (error instanceof ServiceError) known = error;
  else if (error instanceof InputError || error instanceof EvidenceError)
    known = new ServiceError("INVALID_INPUT", error.message, 400);
  else if (error instanceof z.ZodError)
    known = new ServiceError(
      "INVALID_INPUT",
      "Some request fields are invalid. Check your transcript and try again.",
      400,
    );
  else if (error instanceof ApiError && error.status === 429)
    known = new ServiceError(
      "PROVIDER_QUOTA",
      "The AI provider's quota is currently exhausted. Your input is kept; try again later.",
      429,
    );
  else if (error instanceof ApiError && error.status === 403)
    known = new ServiceError(
      "PROVIDER_ACCESS",
      "Google denied this project's API access. The app owner should check the project's access in Google AI Studio. Your input is kept.",
      503,
    );
  else if (error instanceof ApiError && error.status === 503)
    known = new ServiceError(
      "PROVIDER_BUSY",
      "The AI provider is temporarily busy. Your input and previous results are kept; please try again shortly.",
      503,
    );
  else if (error instanceof ApiError && [400, 401, 403, 404].includes(error.status))
    known = new ServiceError(
      "PROVIDER_CONFIG",
      "The AI connection needs attention. The app owner should check the key, project access, and configured model.",
      503,
    );
  else if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name))
    known = new ServiceError(
      "TIMEOUT",
      "Processing took too long. Your input is kept. Try a shorter excerpt or retry.",
      504,
    );
  else
    known = new ServiceError(
      "PROVIDER_ERROR",
      "Processing could not finish. Your input and previous results are kept; please try again.",
      502,
    );
  console.warn(
    JSON.stringify({ event: "request_failed", requestId, code: known.code, status: known.status }),
  );
  return Response.json(
    { error: known.message, code: known.code, requestId },
    {
      status: known.status,
      headers: {
        "Cache-Control": "no-store",
        ...(known.status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}
