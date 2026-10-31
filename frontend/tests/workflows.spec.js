import { test, expect } from "@playwright/test";
const adminId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const templateId = "33333333-3333-4333-8333-333333333333";
const runId = "44444444-4444-4444-8444-444444444444";
const taskId = "55555555-5555-4555-8555-555555555555";
async function seed(page, { role = "Admin", theme = "light", handle } = {}) {
  await page.addInitScript(
    (theme) => localStorage.setItem("taskmaster-theme", theme),
    theme,
  );
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/api/v1/",
      "",
    );
    let data;
    if (handle) data = await handle(path, route.request());
    if (data === undefined) {
      if (path === "auth/session")
        data = {
          user: {
            id: role === "Admin" ? adminId : userId,
            name: "Alex",
            email: "alex@example.test",
            role,
          },
        };
      else if (path === "admin/bulk" || path === "user/bulk")
        data = [
          {
            id: userId,
            name: "Alex Morgan",
            email: "alex@example.test",
            tasks: [],
          },
        ];
      else if (
        [
          "workflows/templates",
          "workflows/runs",
          "workflow-notifications",
        ].includes(path)
      )
        data = [];
      else data = { message: "Saved" };
    }
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
test("condition controls publish a submission rule and matched branch", async ({
  page,
}) => {
  let published;
  await seed(page, {
    handle: (path, request) => {
      if (path === "workflows/templates" && request.method() === "POST") {
        published = request.postDataJSON();
        return { id: templateId, latest_version: 1 };
      }
    },
  });
  await page.goto("/admin/workflows/new");
  await page
    .getByLabel("Workflow name", { exact: true })
    .fill("Route urgent work");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page.getByLabel("Step title", { exact: true }).fill("Submit intake");
  await page
    .getByRole("button", { name: "Add condition", exact: true })
    .click();
  await page.getByLabel("Step title", { exact: true }).fill("Route urgent");
  await page.getByLabel("Text to match", { exact: true }).fill("urgent");
  await expect(
    page.getByRole("combobox", { name: "Read submission from" }),
  ).toContainText("Submit intake");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await page
    .getByLabel("Step title", { exact: true })
    .fill("Expedite delivery");
  await page
    .getByRole("combobox", { name: "Branch rule", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Route urgent: matched", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish workflow", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/workflows$/);
  const [source, condition, branch] = published.definition.nodes;
  expect(condition.type).toBe("condition");
  expect(condition.sourceKey).toBe(source.key);
  expect(condition.keyword).toBe("urgent");
  expect(condition.dependencies).toEqual([source.key]);
  expect(branch.when).toEqual({ nodeKey: condition.key, outcome: true });
  expect(branch.dependencies).toEqual([condition.key]);
});
for (const theme of ["light", "dark"]) {
  test(`workflow builder connects steps and publishes a graph in ${theme} mode`, async ({
    page,
  }, testInfo) => {
    let published;
    await seed(page, {
      theme,
      handle: (path, request) => {
        if (path === "workflows/templates" && request.method() === "POST") {
          published = request.postDataJSON();
          return { id: templateId, latest_version: 1 };
        }
      },
    });
    await page.goto("/admin/workflows");
    await page
      .getByRole("button", { name: "Create workflow", exact: true })
      .first()
      .click();
    await page
      .getByLabel("Workflow name", { exact: true })
      .fill("Design to delivery");
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await page.getByLabel("Step title", { exact: true }).fill("Prepare design");
    await page
      .getByLabel("Assignment instructions")
      .fill("Create the initial design.");
    await page.getByRole("button", { name: "Add task", exact: true }).click();
    await page.getByLabel("Step title", { exact: true }).fill("Build feature");
    await page
      .getByRole("button", { name: "Connect steps", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Step 1: Prepare design", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Step 2: Build feature", exact: true })
      .click();
    await expect(
      page.getByRole("combobox", { name: "Wait for steps" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Arrange", exact: true }).click();
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`builder-${theme}.png`),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath(`builder-mobile-${theme}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Publish workflow", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/workflows$/);
    expect(published.name).toBe("Design to delivery");
    expect(published.definition.nodes).toHaveLength(2);
    expect(published.definition.nodes[1].dependencies).toEqual([
      published.definition.nodes[0].key,
    ]);
    expect(published.definition.nodes[0].requiresApproval).toBe(true);
    expect(published.definition.nodes[0].assigneeId).toBe(userId);
  });
}
test("admin reviews submissions with MUI confirmation and sees unlocked steps", async ({
  page,
}, testInfo) => {
  const run = {
    id: runId,
    name: "Launch website",
    version: 1,
    state: "running",
    created_by: adminId,
    steps: [
      {
        id: "design",
        node_key: "design",
        spec: {
          key: "design",
          type: "task",
          title: "Review design",
          requiresApproval: true,
          dueDays: 2,
          dependencies: [],
        },
        state: "in_review",
        task_id: taskId,
        assignee_name: "Alex Morgan",
        submission: "Design draft is ready.",
      },
      {
        id: "build",
        node_key: "build",
        spec: {
          key: "build",
          type: "task",
          title: "Build website",
          dueDays: 3,
          dependencies: ["design"],
        },
        state: "blocked",
      },
    ],
    events: [
      {
        id: "event",
        action: "submit",
        node_key: "design",
        message: "Design draft is ready.",
        actor_role: "User",
        created_at: new Date().toISOString(),
      },
    ],
  };
  let decision;
  await seed(page, {
    handle: (path, request) => {
      if (path === `workflows/runs/${runId}`) return run;
      if (path === `workflows/runs/${runId}/actions`) {
        decision = request.postDataJSON();
        run.steps[0].state = "completed";
        run.steps[1].state = "ready";
        return { message: "Updated" };
      }
    },
  });
  await page.goto(`/admin/workflows/runs/${runId}`);
  await expect(
    page.getByText("Design draft is ready.", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("run-review.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Note (optional)").fill("Ready to build.");
  await dialog
    .getByRole("button", { name: "Approve & continue", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Ready to start", { exact: true })).toBeVisible();
  expect(decision).toEqual({
    nodeKey: "design",
    action: "approve",
    message: "Ready to build.",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
});
test("member submits their workflow task without direct completion or team access", async ({
  page,
}) => {
  const task = {
    id: taskId,
    title: "Prepare design",
    description: "Prepare design",
    status: "In Progress",
    dueDate: "2026-11-20",
    user: { id: userId, name: "Alex Morgan" },
    workflowRunId: runId,
    workflowState: "in_progress",
    requiresApproval: true,
    comments: "",
    reviewFeedback: "Please revise the introduction.",
  };
  let submission;
  await seed(page, {
    role: "User",
    handle: (path, request) => {
      if (path === `user/bulktask/${taskId}`) return task;
      if (path === `workflow-tasks/${taskId}/actions`) {
        submission = request.postDataJSON();
        task.workflowState = "in_review";
        task.comments = submission.message;
        return task;
      }
    },
  });
  await page.goto(`/user-edittask/${taskId}`);
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText(/Admin feedback: Please revise/)).toBeVisible();
  await page
    .getByLabel("Progress notes (optional)", { exact: true })
    .fill("Revised draft is ready for review.");
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await expect(
    page.getByText("Awaiting approval", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit for review", exact: true }),
  ).toHaveCount(0);
  expect(submission).toEqual({
    action: "submit",
    message: "Revised draft is ready for review.",
  });
  await page.goto(`/admin/workflows/runs/${runId}`);
  await expect(page).toHaveURL(/\/mytasks$/);
});
