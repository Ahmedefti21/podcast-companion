import { test, expect } from "@playwright/test";
import { SAMPLE_TEXT, SAMPLE_EPISODE } from "../src/lib/sample";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("source drawer exposes the original text and dismisses with Escape", async ({ page }) => {
  await page.getByRole("button", { name: "Passages 1, 2, 3", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Behind the insight" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("That is a personal routine, not a scientific prescription.");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("sample revision can be compared and undone", async ({ page }) => {
  await page.getByRole("button", { name: "Make shorter", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Sample edit");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "What changed" })).toContainText(
    "Only the overview changed.",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page
      .locator("#main-content")
      .getByText(SAMPLE_EPISODE.overview.summary[0].text, { exact: true }),
  ).toBeVisible();
});

test("recall builds a return path from confident mistakes", async ({ page }) => {
  await page.getByRole("button", { name: "Try a little recall", exact: true }).click();
  for (let i = 0; i < SAMPLE_EPISODE.quiz.length; i++) {
    const q = SAMPLE_EPISODE.quiz[i];
    await page
      .getByRole("radio", { name: q.choices[i === 0 ? 0 : q.correctIndex], exact: true })
      .check();
    if (i === 0) await page.getByRole("checkbox", { name: "I’m confident in this answer" }).check();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    if (i < SAMPLE_EPISODE.quiz.length - 1)
      await page.getByRole("button", { name: "Next question", exact: true }).click();
  }
  await expect(page.getByText("1 was marked confident", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Review what I missed", exact: true }).click();
  await expect(page.locator(".review-chapter")).toHaveCount(1);
  await expect(page.locator(".review-chapter")).toContainText("Start before you're ready");
});

test("provider errors keep the input and previous episode", async ({ page }) => {
  await page.route("**/api/generate", (route) =>
    route.fulfill({ status: 503, json: { error: "Provider unavailable. Your input is kept." } }),
  );
  await page.getByRole("button", { name: "New episode", exact: true }).click();
  await page.getByRole("button", { name: "Use sample text", exact: true }).click();
  await page.getByRole("checkbox", { name: /I have permission/ }).check();
  await page.getByRole("button", { name: "Create companion", exact: true }).click();
  await expect(page.getByText("Provider unavailable. Your input is kept.")).toBeVisible();
  await expect(page.getByLabel("Or paste your transcript")).toHaveValue(SAMPLE_TEXT);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "The creative habit", exact: true }),
  ).toBeVisible();
});

test("export includes the source and labels the sample honestly", async ({ page }) => {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("the-creative-habit-study-guide.md");
});

test("layout fits the viewport", async ({ page }) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
