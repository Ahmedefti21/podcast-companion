import { afterEach, describe, expect, it, vi } from "vitest";
import { enforceQuota } from "./quota";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("shared quota protection", () => {
  it("fails closed when production quota credentials are missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    await expect(enforceQuota()).rejects.toHaveProperty("code", "QUOTA_NOT_CONFIGURED");
  });
  it("enforces the shared minute limit", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://quota.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-placeholder");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: [6, 6] })));
    await expect(enforceQuota()).rejects.toHaveProperty("code", "RATE_LIMIT");
  });
  it("enforces the configured daily allowance", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://quota.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-placeholder");
    vi.stubEnv("DAILY_REQUEST_LIMIT", "10");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: [1, 11] })));
    await expect(enforceQuota()).rejects.toHaveProperty("code", "DAILY_LIMIT");
  });
  it("does not bypass protection when the quota store fails", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://quota.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-placeholder");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(enforceQuota()).rejects.toHaveProperty("code", "QUOTA_UNAVAILABLE");
  });
});
