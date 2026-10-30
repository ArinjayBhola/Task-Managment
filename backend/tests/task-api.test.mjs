import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, userId } from "./helpers.mjs";
const payload = {
  id: userId,
  description: "Prepare",
  dueDate: "2026-10-31",
  status: "Not Started",
};
test("task mutations require an authenticated session and the correct role", async () => {
  const f = await fixture();
  const member = await f.login("User"),
    admin = await f.login();
  assert.equal((await f.request("admin/task", "POST", payload)).status, 401);
  assert.equal(
    (await f.request("admin/task", "POST", payload, member)).status,
    403,
  );
  assert.equal(
    (await f.request("admin/delete", "DELETE", { taskId: userId }, member))
      .status,
    403,
  );
  assert.equal(
    (
      await f.request(
        "user/taskupdate",
        "PUT",
        { taskId: userId, status: "Completed" },
        admin,
      )
    ).status,
    403,
  );
});
test("task creation requires UUIDs and rejects invalid dates and empty descriptions", async () => {
  const f = await fixture();
  const admin = await f.login();
  for (const body of [
    { ...payload, id: 1 },
    { ...payload, id: "1" },
    { ...payload, dueDate: "2026-02-31" },
    { ...payload, description: " " },
    { ...payload, status: "unknown" },
  ])
    assert.equal(
      (await f.request("admin/task", "POST", body, admin)).status,
      400,
    );
});
test("member updates reject assignment edits and empty updates", async () => {
  const f = await fixture();
  const member = await f.login("User");
  for (const body of [
    { taskId: userId, description: "Injected" },
    { taskId: userId, status: "Completed", id: userId },
    { taskId: userId },
  ])
    assert.equal(
      (await f.request("user/taskupdate", "PUT", body, member)).status,
      400,
    );
});
