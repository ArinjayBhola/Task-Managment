import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, userId } from "./helpers.mjs";
test("member deletion requires an admin, a UUID, and email confirmation", async () => {
  const f = await fixture(),
    member = await f.login("User"),
    admin = await f.login("Admin");
  const path = `admin/user/${userId}`,
    body = { confirmEmail: "member@example.test" };
  assert.equal((await f.request(path, "DELETE", body)).status, 401);
  assert.equal((await f.request(path, "DELETE", body, member)).status, 403);
  assert.equal(
    (await f.request("admin/user/1", "DELETE", body, admin)).status,
    404,
  );
  for (const invalid of [
    {},
    { confirmEmail: "" },
    { confirmEmail: "invalid" },
    { ...body, force: true },
  ])
    assert.equal((await f.request(path, "DELETE", invalid, admin)).status, 400);
});
