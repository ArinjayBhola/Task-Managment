import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { authMiddleware } from "../middleware/auth";
import { Bindings, Variables } from "../types";
import { publishSchema } from "../workflows/definition";
import { taskDetail } from "../db/task-store";

export function createWorkflowApi(databaseFactory = getDb) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  app.use("/api/v1/workflows/*", authMiddleware);
  app.use("/api/v1/workflows/*", async (c, next) => {
    if (c.get("currentUser").role !== "Admin")
      return c.json({ message: "Admin access required." }, 403);
    await next();
  });
  app.onError((error, c) => {
    const cause = (error as any).cause || error;
    const code = cause.code;
    if (["42P01", "42883"].includes(code))
      return c.json(
        {
          message:
            "Workflow setup is required. Run npm run db:workflows in backend.",
        },
        503,
      );
    if (["P0001", "P0002", "42501"].includes(code))
      return c.json(
        { message: cause.message },
        code === "P0002" ? 404 : code === "42501" ? 403 : 409,
      );
    return c.json(
      { message: "Unable to update the workflow. Please retry." },
      503,
    );
  });
  app.get("/api/v1/workflows/templates", async (c) => {
    const db = databaseFactory(c.env.DATABASE_URL);
    const { rows } = await db.execute(
      sql`SELECT t.*,v.definition,EXISTS(SELECT 1 FROM jsonb_array_elements(v.definition->'nodes') n WHERE n->>'type'='task'
        AND NOT EXISTS(SELECT 1 FROM users u WHERE u.id::text=n->>'assigneeId')) AS needs_reassignment
        FROM workflow_templates t JOIN workflow_versions v ON v.template_id=t.id AND v.version=t.latest_version ORDER BY t.created_at DESC`,
    );
    return c.json(rows);
  });
  for (const update of [false, true]) {
    app.on(
      update ? "PUT" : "POST",
      update
        ? "/api/v1/workflows/templates/:id"
        : "/api/v1/workflows/templates",
      async (c) => {
        const parsed = publishSchema.safeParse(
          await c.req.json().catch(() => null),
        );
        if (!parsed.success)
          return c.json(
            {
              message:
                parsed.error.issues[0]?.message ||
                "Check the workflow details.",
            },
            400,
          );
        const db = databaseFactory(c.env.DATABASE_URL),
          actor = c.get("currentUser");
        const { name, definition } = parsed.data;
        if (update && !z.string().uuid().safeParse(c.req.param("id")).success)
          return c.json({ message: "Workflow not found." }, 404);
        const changed = update
          ? sql`UPDATE workflow_templates SET name=${name},latest_version=latest_version+1 WHERE id=${c.req.param("id")}::uuid RETURNING *`
          : sql`INSERT INTO workflow_templates(name,created_by) VALUES(${name},${actor.id}::uuid) RETURNING *`;
        const { rows } =
          await db.execute(sql`WITH changed AS (${changed}), published AS (
        INSERT INTO workflow_versions(template_id,version,definition) SELECT id,latest_version,${JSON.stringify(definition)}::jsonb FROM changed RETURNING template_id
      ) SELECT changed.* FROM changed JOIN published ON published.template_id=changed.id`);
        return rows[0]
          ? c.json(rows[0], update ? 200 : 201)
          : c.json({ message: "Workflow not found." }, 404);
      },
    );
  }
  app.get("/api/v1/workflows/templates/:id/versions", async (c) => {
    if (!z.string().uuid().safeParse(c.req.param("id")).success)
      return c.json({ message: "Workflow not found." }, 404);
    const { rows } = await databaseFactory(c.env.DATABASE_URL).execute(
      sql`SELECT * FROM workflow_versions WHERE template_id=${c.req.param("id")}::uuid ORDER BY version DESC`,
    );
    return c.json(rows);
  });
  app.get("/api/v1/workflows/runs", async (c) => {
    const { rows } = await databaseFactory(c.env.DATABASE_URL)
      .execute(sql`SELECT r.*,
      (SELECT count(*)::int FROM workflow_steps s WHERE s.run_id=r.id) AS total,
      (SELECT count(*)::int FROM workflow_steps s WHERE s.run_id=r.id AND s.state IN ('completed','skipped')) AS completed,
      (SELECT count(*)::int FROM workflow_steps s WHERE s.run_id=r.id AND s.state='in_review') AS reviews
      FROM workflow_runs r ORDER BY r.created_at DESC LIMIT 100`);
    return c.json(rows);
  });
  app.post("/api/v1/workflows/runs", async (c) => {
    const parsed = z
      .object({
        templateId: z.string().uuid(),
        version: z.number().int().min(1),
        name: z.string().trim().min(1).max(120),
        requestKey: z.string().uuid(),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json(
        { message: "Choose a published version and give this run a name." },
        400,
      );
    const p = parsed.data;
    const { rows } = await databaseFactory(c.env.DATABASE_URL).execute(
      sql`SELECT workflow_start(${p.templateId}::uuid,${p.version},${p.name},${c.get("currentUser").id}::uuid,${p.requestKey}::uuid) AS id`,
    );
    return c.json(rows[0], 201);
  });
  app.get("/api/v1/workflows/runs/:id", async (c) => {
    const id = c.req.param("id");
    if (!z.string().uuid().safeParse(id).success)
      return c.json({ message: "Workflow not found." }, 404);
    const db = databaseFactory(c.env.DATABASE_URL);
    const {
      rows: [run],
    } = await db.execute(sql`SELECT * FROM workflow_runs WHERE id=${id}::uuid`);
    if (!run) return c.json({ message: "Workflow not found." }, 404);
    const [{ rows: steps }, { rows: events }] = await Promise.all([
      db.execute(sql`SELECT s.*,t.member_notes AS submission,u.name AS assignee_name FROM workflow_steps s
        LEFT JOIN tasks t ON t.id=s.task_id LEFT JOIN users u ON u.id::text=s.spec->>'assigneeId' WHERE s.run_id=${id}::uuid ORDER BY s.node_key`),
      db.execute(
        sql`SELECT * FROM workflow_events WHERE run_id=${id}::uuid ORDER BY created_at DESC,id DESC LIMIT 200`,
      ),
    ]);
    return c.json({ ...run, steps, events });
  });
  app.post("/api/v1/workflows/runs/:id/actions", async (c) => {
    const id = c.req.param("id");
    const parsed = z
      .object({
        nodeKey: z.string().max(64).default(""),
        action: z.enum(["approve", "reject", "cancel", "retry"]),
        message: z.string().max(20000).default(""),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!z.string().uuid().safeParse(id).success || !parsed.success)
      return c.json({ message: "Invalid workflow action." }, 400);
    const db = databaseFactory(c.env.DATABASE_URL),
      p = parsed.data,
      actor = c.get("currentUser");
    if (p.action === "retry") {
      const { rows } = await db.execute(
        sql`SELECT id FROM workflow_runs WHERE id=${id}::uuid AND created_by=${actor.id}::uuid AND state='running'`,
      );
      if (!rows.length)
        return c.json(
          { message: "Running workflow not found or owned by another admin." },
          404,
        );
      await db.execute(sql`SELECT workflow_advance(${id}::uuid)`);
    } else
      await db.execute(
        sql`SELECT workflow_act(${id}::uuid,${p.nodeKey},${p.action},${actor.id}::uuid,'Admin',${p.message})`,
      );
    return c.json({ message: "Workflow updated." });
  });
  app.post("/api/v1/workflow-tasks/:id/actions", authMiddleware, async (c) => {
    const actor = c.get("currentUser"),
      id = c.req.param("id");
    if (actor.role !== "User")
      return c.json({ message: "Member access required." }, 403);
    const parsed = z
      .object({
        action: z.enum(["start", "submit"]),
        message: z.string().max(20000).default(""),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!z.string().uuid().safeParse(id).success || !parsed.success)
      return c.json({ message: "Invalid task action." }, 400);
    const db = databaseFactory(c.env.DATABASE_URL);
    const {
      rows: [step],
    } = await db.execute(
      sql`SELECT run_id,node_key FROM workflow_steps WHERE task_id=${id}::uuid AND spec->>'assigneeId'=${actor.id}`,
    );
    if (!step) return c.json({ message: "Assignment not found." }, 404);
    await db.execute(
      sql`SELECT workflow_act(${step.run_id}::uuid,${step.node_key},${parsed.data.action},${actor.id}::uuid,'User',${parsed.data.message})`,
    );
    return c.json(await taskDetail(db, id, actor));
  });
  app.get("/api/v1/workflow-notifications", authMiddleware, async (c) => {
    const actor = c.get("currentUser");
    const { rows } = await databaseFactory(c.env.DATABASE_URL)
      .execute(sql`SELECT id,message,task_id,created_at,read_at,
      CASE WHEN role='Admin' THEN run_id ELSE NULL END AS run_id FROM workflow_notices
      WHERE account_id=${actor.id}::uuid AND role=${actor.role} ORDER BY created_at DESC LIMIT 50`);
    return c.json(rows);
  });
  app.post("/api/v1/workflow-notifications/read", authMiddleware, async (c) => {
    const actor = c.get("currentUser");
    await databaseFactory(c.env.DATABASE_URL).execute(
      sql`UPDATE workflow_notices SET read_at=now() WHERE account_id=${actor.id}::uuid AND role=${actor.role} AND read_at IS NULL`,
    );
    return c.json({ message: "Notifications marked as read." });
  });
  return app;
}
