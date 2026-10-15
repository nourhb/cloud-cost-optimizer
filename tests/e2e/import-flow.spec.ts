import path from "node:path";
import { expect, test } from "@playwright/test";

const sampleCsv = path.resolve(
  __dirname,
  "../../data/samples/billing-valid.csv",
);

test("CSV import happy path populates dashboard", async ({ page }) => {
  await page.request.post("/api/demo/reset");
  await page.goto("/imports/new");
  await expect(
    page.getByRole("heading", { name: "New import", exact: true }),
  ).toBeVisible();

  await page.locator("#csv-file").setInputFiles(sampleCsv);
  await page.getByRole("button", { name: "Validate & preview" }).click();

  await expect(page.getByText("Accepted")).toBeVisible();
  await expect(page.getByText("10", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByText(/Imported 10 new rows/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Rows in view")).toBeVisible();
  await expect(
    page.locator("text=Rows in view").locator("..").getByText("10", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Total cost")).toBeVisible();
  await expect(page.getByText("Daily cost trend")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Service" })).toContainText(
    "AmazonEC2",
  );
});
