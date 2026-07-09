import { expect, test } from "playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/upkeep-sso-upgrade/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("dashboard loads publicly and progress follows completed phases", async ({
  page
}) => {
  await expect(page).toHaveTitle("UpKeep SSO Upgrade Workspace");
  await expect(
    page.getByRole("heading", { name: "UpKeep SSO Upgrade", level: 2 })
  ).toBeVisible();
  await expect(
    page.getByText("Public, sanitized project totals only.")
  ).toBeVisible();
  await expect(page.getByText("Overall Progress: 0%")).toBeVisible();

  await page
    .getByRole("button", { name: "Training & support Ongoing" })
    .click();
  await expect(page.getByText("Overall Progress: 0%")).toBeVisible();

  await page
    .getByRole("button", { name: "Planning & prerequisites Week 1, Days 1-2" })
    .click();
  await page.getByRole("button", { name: "Mark Complete" }).click();
  await expect(page.getByText("Overall Progress: 14%")).toBeVisible();

  await page.reload();
  await page
    .getByRole("button", { name: "Planning & prerequisites Week 1, Days 1-2" })
    .click();
  await expect(page.getByRole("button", { name: "Completed" })).toBeDisabled();
});

test("partial coverage is labeled as current-export evidence", async ({
  page
}) => {
  await page.getByRole("link", { name: "Users", exact: true }).click();
  await expect(page).toHaveURL(/\/upkeep-sso-upgrade\/users\/$/);
  await expect(
    page.getByRole("heading", { name: "37 of 54 visible users matched" })
  ).toBeVisible();
  await expect(page.getByText(/not the full UpKeep population/i)).toBeVisible();
  await expect(page.getByText(/Do not use this partial export/i)).toBeVisible();
});

test("document links, notes, and export controls perform their stated actions", async ({
  page
}) => {
  const repositoryRoot = "https://github.com/soeprbp/upkeep-sso-upgrade";
  await expect(page.getByRole("link", { name: "Docs" })).toHaveAttribute(
    "href",
    `${repositoryRoot}/tree/main/docs`
  );
  await expect(
    page.getByRole("link", { name: /View technical runbook/ })
  ).toHaveAttribute(
    "href",
    `${repositoryRoot}/blob/main/docs/tickets/UpKeep-Entra-Setup-Ticket.md`
  );
  await expect(
    page.getByRole("link", { name: /Open communication documents/ })
  ).toHaveAttribute("href", `${repositoryRoot}/tree/main/docs/communications`);

  await page.getByRole("button", { name: "Add Note" }).click();
  await page
    .getByPlaceholder(/Write a note about the current phase/)
    .fill("E2E note");
  await page.getByRole("button", { name: "Save Note" }).click();
  await expect(page.getByText("E2E note")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Plan" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("upkeep-sso-upgrade-plan.json");
});

test("mobile menu toggles without hiding the dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Open menu" });
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("heading", { name: "Rollout Timeline (2 Weeks)" })
  ).toBeVisible();
});
