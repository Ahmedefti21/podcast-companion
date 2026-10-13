import { describe, expect, it } from "vitest";
import { readBody, errorResponse } from "./http";
import { InputError } from "../transcript";
import { ApiError } from "@google/genai";

describe("HTTP boundary", () => {
  it("distinguishes temporary provider demand from denied access without exposing details", async () => {
    const response = errorResponse(
      new ApiError({ status: 503, message: "private-provider-information" }),
      "test-id",
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("PROVIDER_BUSY");
    expect(body.error).toContain("temporarily busy");
    expect(body.error).not.toContain("private-provider-information");
  });
  it("accepts the browser host when Next canonicalizes the internal URL", async () => {
    const request = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "127.0.0.1:3000",
        Origin: "http://127.0.0.1:3000",
      },
      body: "{}",
    });
    await expect(readBody(request)).resolves.toEqual({});
  });
  it("rejects requests from another origin", async () => {
    const request = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://unrelated.example" },
      body: "{}",
    });
    await expect(readBody(request)).rejects.toHaveProperty("status", 403);
  });
  it("checks streamed body size even when content-length is absent", async () => {
    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(1_150_000) }),
    });
    await expect(readBody(request)).rejects.toHaveProperty("status", 413);
  });
  it("does not reflect unknown error details", async () => {
    const response = errorResponse(new Error("private-provider-information"), "test-id");
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private-provider-information");
  });
  it("reports useful input errors", async () => {
    const response = errorResponse(new InputError("Use at least 200 words"), "test-id");
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_INPUT",
      error: "Use at least 200 words",
    });
  });
});
