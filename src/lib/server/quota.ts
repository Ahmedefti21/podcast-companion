import { ServiceError } from "./errors";

let localWindow = { minute: 0, count: 0 };

export async function enforceQuota(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production")
      throw new ServiceError(
        "QUOTA_NOT_CONFIGURED",
        "Live generation is paused until the app owner configures usage protection. The sample is still available.",
        503,
      );
    const minute = Math.floor(Date.now() / 60000);
    if (localWindow.minute !== minute) localWindow = { minute, count: 0 };
    if (++localWindow.count > 5)
      throw new ServiceError(
        "RATE_LIMIT",
        "Too many requests. Wait a minute, then try again.",
        429,
      );
    return;
  }
  const daily = Math.max(1, Math.min(1000, Number(process.env.DAILY_REQUEST_LIMIT) || 100));
  const minuteKey = `recast:minute:${Math.floor(Date.now() / 60000)}`;
  const dayKey = `recast:day:${new Date().toISOString().slice(0, 10)}`;
  // Atomic shared counters work across server instances; no user text or IP stored.
  const script =
    "local m=redis.call('INCR',KEYS[1]); if m==1 then redis.call('EXPIRE',KEYS[1],120) end; local d=redis.call('INCR',KEYS[2]); if d==1 then redis.call('EXPIRE',KEYS[2],172800) end; return {m,d}";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", script, "2", minuteKey, dayKey]),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Quota service unavailable");
    const data = (await response.json()) as { result?: [number, number] };
    if (
      !Array.isArray(data.result) ||
      data.result.length !== 2 ||
      !data.result.every(Number.isFinite)
    )
      throw new Error("Invalid quota response");
    if (data.result[1] > daily)
      throw new ServiceError(
        "DAILY_LIMIT",
        "Today's generation allowance has been reached. You can still explore and export the sample. Try again tomorrow (UTC).",
        429,
      );
    if (data.result[0] > 5)
      throw new ServiceError(
        "RATE_LIMIT",
        "The app is processing several requests. Wait a minute, then try again.",
        429,
      );
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(
      "QUOTA_UNAVAILABLE",
      "Usage protection is temporarily unavailable. Please try again shortly.",
      503,
    );
  }
}
