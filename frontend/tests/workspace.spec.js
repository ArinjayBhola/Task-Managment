import { test, expect } from "@playwright/test";
import { Buffer } from "node:buffer";

const tasks = [
  {
    id: 101,
    title: "Shape the new onboarding experience",
    description: "Map the first moments of the customer journey.",
    status: "In Progress",
    dueDate: "2026-11-12",
    assigneeId: 1,
  },
  {
    id: 102,
    title: "Share the discovery notes",
    status: "Completed",
    dueDate: "2026-11-05",
    assigneeId: 1,
  },
  {
    id: 103,
    title: "Review the project proposal",
    status: "Not Started",
    dueDate: "2026-11-15",
    assigneeId: 2,
  },
  {
    id: 104,
    title: "Make space for the next sprint",
    status: "In Progress",
    dueDate: "2026-11-17",
    assigneeId: 3,
  },
  {
    id: 105,
    title: "Publish the brand guidelines",
    status: "Completed",
    dueDate: "2026-11-19",
    assigneeId: 4,
  },
];
const users = [
  "Alex Morgan",
  "Jamie Chen",
  "Sam Taylor",
  "Jordan Lee",
  "Casey Brooks",
  "Riley Parker",
].map((name, index) => ({
  id: index + 1,
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@studio.co`,
  tasks: tasks.filter((task) => task.assigneeId === index + 1),
}));
function token(role) {
  return `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ id: 1, role, email: role === "Admin" ? "arinjay@studio.co" : "alex.morgan@studio.co", exp: 4102444800 })).toString("base64url")}.test`;
}
async function setup(page, { role, theme = "light" } = {}) {
  await page.addInitScript(
    ({ role, theme, value }) => {
      if (!localStorage.getItem("taskmaster-theme"))
        localStorage.setItem("taskmaster-theme", theme);
      if (role) {
        localStorage.setItem("token", value);
        localStorage.setItem("activeOrgId", "7");
      }
    },
    { role, theme, value: token(role) },
  );
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/api/v1/",
      "",
    );
    let data;
    if (/^(admin|user)\/(signin|signup)$/.test(path))
      data = { token: token(path.startsWith("admin") ? "Admin" : "User") };
    else if (path === "admin/usersignup") data = { id: 1, defaultOrgId: 7 };
    else if (path === "admin/bulk" || path === "user/bulktask") data = users;
    else if (path === "user/bulk") data = [users[0]];
    else if (path === "user/organizations")
      data = [{ id: 7, name: "Everyday Studio", role: "owner" }];
    else if (/^admin\/user\//.test(path)) data = users[0];
    else if (/^(admin\/task|user\/bulktask)\//.test(path))
      data = { ...tasks[0], user: users[0] };
    else data = { message: "Saved" };
    await route.fulfill({
      json: data,
      headers: { "access-control-allow-origin": "*" },
    });
  });
}
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

for (const theme of ["light", "dark"]) {
  test(`admin workspace and member dialog in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await setup(page, { role: "Admin", theme });
    await page.goto("/users");
    await expect(
      page.getByRole("heading", { name: "Your team, in focus." }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Alex Morgan", exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`admin-${theme}.png`),
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Search team members" })
      .fill("jamie");
    await expect(
      page.getByRole("heading", { name: "Jamie Chen", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Alex Morgan", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "New team member", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Full name").fill("New Teammate");
    await dialog
      .getByLabel("Password", { exact: true })
      .fill("secure-password");
    const inputBox = await dialog
      .getByLabel("Password", { exact: true })
      .boundingBox();
    const eyeBox = await dialog
      .getByRole("button", { name: "Show password" })
      .boundingBox();
    expect(
      Math.abs(inputBox.y + inputBox.height / 2 - eyeBox.y - eyeBox.height / 2),
    ).toBeLessThan(1);
    await dialog.getByRole("button", { name: "Show password" }).click();
    await expect(
      dialog.getByLabel("Password", { exact: true }),
    ).toHaveAttribute("type", "text");
    await page.screenshot({ path: testInfo.outputPath(`dialog-${theme}.png`) });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    const gradients = await page
      .locator("body *")
      .evaluateAll(
        (elements) =>
          elements.filter((element) =>
            /gradient/.test(getComputedStyle(element).backgroundImage),
          ).length,
      );
    expect(gradients).toBe(0);
    expect(errors).toEqual([]);
  });
  test(`user tasks and task forms in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    await setup(page, { role: "User", theme });
    await page.goto("/mytasks");
    await expect(
      page.getByRole("heading", { name: "Make room for good work." }),
    ).toBeVisible();
    await expect(
      page.getByText("Shape the new onboarding experience", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`user-${theme}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Completed 1", exact: true })
      .click();
    await expect(
      page.getByText("Share the discovery notes", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Shape the new onboarding experience", { exact: true }),
    ).toHaveCount(0);
    await page.goto("/user-edittask/101");
    await expect(page.getByLabel("Status", { exact: true })).toBeEnabled();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`task-form-${theme}.png`),
      fullPage: true,
    });
  });
  test(`public landing and login in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    await setup(page, { theme });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Less scattered. More together." }),
    ).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`landing-${theme}.png`),
      fullPage: true,
    });
    await page.goto("/admin-signup");
    await expect(page.getByLabel("Full name")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`auth-${theme}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", {
        name: `Switch to ${theme === "light" ? "dark" : "light"} mode`,
      })
      .click();
    await page.reload();
    await expect(page.locator("html")).toHaveClass(
      theme === "light" ? /dark/ : /^$/,
    );
  });
}
for (const role of ["Admin", "User"]) {
  test(`${role} mobile layout and navigation`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setup(page, { role });
    await page.goto(role === "Admin" ? "/users" : "/mytasks");
    await expect(
      page.getByRole("heading", {
        name:
          role === "Admin"
            ? "Your team, in focus."
            : "Make room for good work.",
      }),
    ).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`${role}-mobile.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Team overview" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close menu", exact: true }).click();
    if (role === "Admin") {
      await page
        .getByRole("button", { name: "New team member", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await noOverflow(page);
      await page
        .getByRole("dialog")
        .getByLabel("Email address")
        .fill("new@studio.co");
      await page.getByRole("dialog").getByLabel("Full name").fill("New Member");
      await page
        .getByRole("dialog")
        .getByLabel("Password", { exact: true })
        .fill("secure-password");
      await page
        .getByRole("button", { name: "Create member", exact: true })
        .click();
      await expect(page).toHaveURL(/\/user\/1$/);
    }
  });
}
for (const role of ["Admin", "User"])
  test(`${role} sign-in supports keyboard submission`, async ({ page }) => {
    await setup(page);
    await page.goto(role === "Admin" ? "/admin-signin" : "/user-signin");
    await page.getByLabel("Email address").fill("alex@studio.co");
    await page.getByLabel("Password", { exact: true }).fill("secure-password");
    await page.getByLabel("Password", { exact: true }).press("Enter");
    await expect(page).toHaveURL(role === "Admin" ? /\/users$/ : /\/mytasks$/);
  });
