import { test, expect } from "@playwright/test";
import dayjs from "dayjs";

for (const theme of ["light", "dark"]) {
  test(`input labels float on focus and remain visible for filled fields in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    await setup(page, { theme });
    await page.goto("/admin-signup");
    const name = page.getByLabel("Full name", { exact: true });
    const nameLabel = page.locator(
      `label[for="${await name.getAttribute("id")}"]`,
    );
    await expect(nameLabel).toHaveAttribute("data-shrink", "false");
    await name.focus();
    await expect(nameLabel).toHaveAttribute("data-shrink", "true");
    await name.fill("Alex Morgan");
    await name.blur();
    await expect(nameLabel).toHaveAttribute("data-shrink", "true");
    await name.fill("");
    await name.blur();
    await expect(nameLabel).toHaveAttribute("data-shrink", "false");
    await page.getByLabel("Email address", { exact: true }).focus();
    await page.screenshot({
      path: testInfo.outputPath(`floating-auth-${theme}.png`),
    });
    await setup(page, { role: "Admin", theme });
    await page.goto(`/task/${userUuid(1)}`);
    const notes = page.getByLabel("A little context (optional)", {
      exact: true,
    });
    const notesLabel = page.locator(
      `label[for="${await notes.getAttribute("id")}"]`,
    );
    await notes.fill("Helpful context stays readable.");
    await notes.blur();
    await expect(notesLabel).toHaveAttribute("data-shrink", "true");
    await expect(notes).toHaveValue("Helpful context stays readable.");
    await noOverflow(page);
  });
}

for (const theme of ["light", "dark"]) {
  test(`all auth screens fill the viewport in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    await setup(page, { theme });
    for (const path of ["/admin-signin", "/admin-signup", "/user-signin"]) {
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await expect(
          page.getByLabel("Email address", { exact: true }),
        ).toBeVisible();
        const bounds = await page.getByRole("main").boundingBox();
        expect(bounds.x).toBe(0);
        expect(bounds.y).toBe(0);
        expect(bounds.width).toBe(viewport.width);
        expect(bounds.height).toBeGreaterThanOrEqual(viewport.height);
        await noOverflow(page);
        await page.screenshot({
          path: testInfo.outputPath(
            `${path.slice(1)}-${viewport.width}-${theme}.png`,
          ),
          fullPage: true,
        });
      }
    }
  });
}

const userUuid = (value) =>
  `11111111-1111-4111-8111-${String(value).padStart(12, "0")}`;
const taskUuid = (value) =>
  `22222222-2222-4222-8222-${String(value).padStart(12, "0")}`;
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
for (const task of tasks) {
  task.id = taskUuid(task.id);
  task.assigneeId = userUuid(task.assigneeId);
}
const users = [
  "Alex Morgan",
  "Jamie Chen",
  "Sam Taylor",
  "Jordan Lee",
  "Casey Brooks",
  "Riley Parker",
].map((name, index) => ({
  id: userUuid(index + 1),
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@studio.co`,
  tasks: tasks.filter((task) => task.assigneeId === userUuid(index + 1)),
}));
async function setup(page, { role, theme = "light" } = {}) {
  let current = role
    ? {
        id: userUuid(1),
        name: role === "Admin" ? "Test admin" : "Alex Morgan",
        email: role === "Admin" ? "arinjay@studio.co" : "alex.morgan@studio.co",
        role,
      }
    : null;
  await page.addInitScript(
    ({ theme }) => {
      if (!localStorage.getItem("taskmaster-theme"))
        localStorage.setItem("taskmaster-theme", theme);
    },
    { theme },
  );
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/api/v1/",
      "",
    );
    let data;
    if (path === "auth/session") {
      if (!current) {
        await route.fulfill({
          status: 401,
          json: { message: "Sign in required" },
        });
        return;
      }
      data = { user: current };
    } else if (/^(admin|user)\/(signin|signup)$/.test(path)) {
      current = {
        id: userUuid(1),
        name: "Alex Morgan",
        email: "alex@studio.co",
        role: path.startsWith("admin") ? "Admin" : "User",
      };
      data = { user: current };
    } else if (path === "auth/logout") {
      current = null;
      data = { message: "Signed out" };
    } else if (path === "auth/password") data = { user: current };
    else if (path === "admin/usersignup") data = { id: userUuid(1) };
    else if (path === "admin/bulk" || path === "user/bulktask") data = users;
    else if (path === "user/bulk") data = [users[0]];
    else if (/^admin\/user\//.test(path)) data = users[0];
    else if (/^(admin\/task|user\/bulktask)\//.test(path))
      data = { ...tasks[0], user: users[0] };
    else data = { message: "Saved" };
    await route.fulfill({ json: data });
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
      page.getByRole("heading", { name: "Team management" }),
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
    await expect(page.getByRole("heading", { name: "My tasks" })).toBeVisible();
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
    await page.goto(`/user-edittask/${taskUuid(101)}`);
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
        name: role === "Admin" ? "Team management" : "My tasks",
      }),
    ).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`${role}-mobile.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("navigation").getByRole("link", {
        name: role === "Admin" ? "Team management" : "Team activity",
      }),
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
      await expect(page).toHaveURL(new RegExp(`/user/${userUuid(1)}$`));
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

for (const theme of ["light", "dark"]) {
  test(`MUI dropdowns, calendar, and assignment filters in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    await setup(page, { role: "Admin", theme });
    await page.goto("/admin/tasks");
    await expect(
      page.getByRole("heading", { name: "Task assignments", exact: true }),
    ).toBeVisible();
    await page.getByRole("combobox", { name: "Assignment status" }).click();
    await page
      .getByRole("option", { name: "In progress", exact: true })
      .click();
    await expect(
      page.getByText("Shape the new onboarding experience", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Share the discovery notes", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("combobox", { name: "Assigned member" }).click();
    await page.getByRole("option", { name: "Sam Taylor", exact: true }).click();
    await expect(
      page.getByText("Make space for the next sprint", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Shape the new onboarding experience", { exact: true }),
    ).toHaveCount(0);
    await page.goto(`/task/${userUuid(1)}`);
    await page
      .getByLabel("What needs to get done?")
      .fill("A task with a calendar date");
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page
      .getByRole("option", { name: "In progress", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Choose date", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".MuiPickerPopper-paper")).toHaveCSS(
      "opacity",
      "1",
    );
    await page.screenshot({
      path: testInfo.outputPath(`mui-calendar-${theme}.png`),
    });
    await page.getByRole("gridcell", { name: "15", exact: true }).click();
    const request = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === "/api/v1/admin/task" &&
        request.method() === "POST",
    );
    await page
      .getByRole("button", { name: "Assign task", exact: true })
      .click();
    expect((await request).postDataJSON().dueDate).toBe(
      dayjs().date(15).format("YYYY-MM-DD"),
    );
    await expect(page.getByRole("status")).toHaveText(
      "Task assigned. A clear next step for your teammate.",
    );
    await noOverflow(page);
  });
}

test("member dashboard has no workspace selector and restricts administration routes", async ({
  page,
}) => {
  await setup(page, { role: "User" });
  const organizationRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/user/organizations")
      organizationRequests.push(request.url());
  });
  await page.goto("/mytasks");
  await expect(
    page.getByRole("link", { name: "Task assignments", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "New team member", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Active workspace" }),
  ).toHaveCount(0);
  await page.goto("/admin/tasks");
  await expect(page).toHaveURL(/\/mytasks$/);
  expect(organizationRequests).toEqual([]);
  await page.goto("/users");
  await expect(page).toHaveURL(/\/mytasks$/);
});

test("admin console redirects member routes back to management", async ({
  page,
}) => {
  await setup(page, { role: "Admin" });
  await page.goto("/mytasks");
  await expect(page).toHaveURL(/\/users$/);
  await expect(
    page.getByRole("link", { name: "Task assignments", exact: true }),
  ).toBeVisible();
});

test.describe("MUI controls on a touch device", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test("date dialog and status menu fit a mobile task form", async ({
    page,
  }) => {
    await setup(page, { role: "Admin", theme: "dark" });
    await page.goto(`/task/${userUuid(1)}`);
    await page.getByRole("combobox", { name: "Status", exact: true }).click();
    await page
      .getByRole("option", { name: "In progress", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Choose date", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("gridcell", { name: "15", exact: true }).click();
    await page.getByRole("button", { name: "OK", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await noOverflow(page);
  });
});

test("task deletion uses a MUI confirmation and toast instead of browser dialogs", async ({
  page,
}) => {
  await setup(page, { role: "Admin" });
  page.on("dialog", () => {
    throw new Error("Native browser dialog is not allowed");
  });
  await page.goto(`/admin-edittask/${taskUuid(101)}`);
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Delete this task?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete permanently", exact: true })
    .click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("alert")).toContainText("Task deleted.");
});
test("password changes use MUI feedback and no token is stored in browser storage", async ({
  page,
}) => {
  await setup(page, { role: "User" });
  await page.goto("/mytasks");
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("a current long passphrase");
  await page
    .getByLabel("New password", { exact: true })
    .fill("a replacement long passphrase");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("a replacement long passphrase");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Password changed.");
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
});
