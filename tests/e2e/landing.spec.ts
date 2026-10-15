import { expect, test } from "@playwright/test";

test("landing page shows Cloud Cost Optimizer brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Cloud Cost Optimizer",
  );
  await expect(
    page.getByRole("link", { name: /Explore the demo|Sign in to your data/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Connect Supabase" })).toBeVisible();
});

test("app shell dashboard is reachable in demo mode", async ({ page }) => {
  await page.request.post("/api/demo/reset");
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Demo mode").first()).toBeVisible();
  await expect(
    page.getByText(/No billing data yet|Rows in view/i).first(),
  ).toBeVisible();
});

