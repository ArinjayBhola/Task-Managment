import { Hono } from "hono";
import { getDb } from "../db";
import { tasks } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { Bindings, Variables } from "../types";
import { tenantMiddleware } from "../middleware/tenant";

export const taskRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

taskRouter.use("*", tenantMiddleware);

taskRouter.get("/", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get("orgId");

  const allTasks = await db.query.tasks.findMany({
    where: eq(tasks.orgId, orgId),
    with: {
      projectId: true, // Need to ensure relations are defined in schema for this to work perfectly, or just join
    },
    orderBy: (tasks, { desc }) => [desc(tasks.updatedAt)],
  });

  return c.json(allTasks);
});

taskRouter.post("/", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get("orgId");
  const body = await c.req.json();

  const [newTask] = await db
    .insert(tasks)
    .values({
      ...body,
      orgId,
      updatedAt: new Date(),
    })
    .returning();

  return c.json(newTask, 201);
});

taskRouter.patch("/:taskId", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get("orgId");
  const taskId = c.req.param("taskId");
  const body = await c.req.json();

  const [updatedTask] = await db
    .update(tasks)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.orgId, orgId)))
    .returning();

  if (!updatedTask) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json(updatedTask);
});
