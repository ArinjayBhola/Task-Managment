import { test } from "node:test";
import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { fixture, userId } from "./helpers.mjs";

for (const legacy of [true, false]) {
  test(`members only receive their own profile and tasks (${legacy ? "legacy" : "direct"} assignments)`, async () => {
    const f = await fixture();
    const otherId = "33333333-3333-4333-8333-333333333333";
    const profiles = [
      { id: userId, name: "Me", email: "me@example.test" },
      { id: otherId, name: "Private teammate", email: "private@example.test" },
    ];
    const tasks = profiles.map((user, index) => ({
      id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, "0")}`,
      assigneeId: user.id,
      title: index ? "Private task" : "My task",
      status: "todo",
    }));
    const dialect = new PgDialect();
    f.db.select = () => ({
      from: () => ({
        where: async (condition) => {
          const params = condition ? dialect.sqlToQuery(condition).params : [];
          return profiles.filter(
            (profile) => !condition || params.includes(profile.id),
          );
        },
      }),
    });
    const execute = f.db.execute;
    f.db.execute = async (query) => {
      const { sql, params } = dialect.sqlToQuery(query);
      if (sql.includes("information_schema.columns"))
        return { rows: [{ legacy }] };
      if (sql.includes("FROM tasks t")) {
        const assignee = sql.includes("u.id::text =");
        const task = sql.includes("t.id::text =");
        return {
          rows: tasks.filter(
            (row) =>
              (!assignee || params.includes(row.assigneeId)) &&
              (!task || params.includes(row.id)),
          ),
        };
      }
      return execute(query);
    };
    const member = await f.login("User");
    for (const path of ["user/bulk", "user/bulktask"]) {
      const response = await f.request(path, "GET", null, member);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.length, 1);
      assert.equal(body[0].id, userId);
      assert.deepEqual(
        body[0].tasks.map((task) => task.id),
        [tasks[0].id],
      );
      assert.equal(JSON.stringify(body).includes("Private"), false);
    }
    const response = await f.request("tasks", "GET", null, member);
    assert.equal(response.status, 200);
    assert.deepEqual(
      (await response.json()).map((task) => task.id),
      [tasks[0].id],
    );
    assert.equal(
      (await f.request(`user/bulktask/${tasks[1].id}`, "GET", null, member))
        .status,
      404,
    );
    assert.equal(
      (await f.request("admin/bulk", "GET", null, member)).status,
      403,
    );
    const admin = await f.login("Admin");
    const team = await f.request("admin/bulk", "GET", null, admin);
    assert.equal(team.status, 200);
    assert.equal((await team.json()).length, 2);
  });
}
