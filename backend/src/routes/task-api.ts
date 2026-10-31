import { Hono, Context } from "hono";
import { z } from "zod";
import { getDb } from "../db";
import {
  Actor,
  createTask,
  taskDetail,
  updateTask,
  deleteTask,
  listTasks,
} from "../db/task-store";
import { authMiddleware } from "../middleware/auth";
import { Bindings, Variables } from "../types";

const id = z.string().uuid();
const status = z.enum([
  "Not Started",
  "In Progress",
  "Completed",
  "Canceled",
  "todo",
  "in-progress",
  "in_progress",
  "done",
  "canceled",
]);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });
const creation = z.object({
  id,
  description: z.string().trim().min(1).max(10000),
  dueDate: date,
  status: status.default("Not Started"),
  comments: z.string().max(20000).default(""),
});
const memberUpdate = z
  .object({
    taskId: id,
    status: status.optional(),
    comments: z.string().max(20000).optional(),
  })
  .strict()
  .refine(
    (value) => value.status !== undefined || value.comments !== undefined,
  );
const adminUpdate = z.object({ taskId: id, comment: z.string().max(20000) });
type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

function actor(c: AppContext): Actor {
  const payload = c.get("jwtPayload");
  return { id: payload.id, role: payload.role as Actor["role"] };
}
function databaseError(c: AppContext, error: unknown) {
  const code =
    (error as { code?: string; cause?: { code?: string } }).cause?.code ||
    (error as { code?: string }).code;
  if (code === "WORKFLOW_MANAGED")
    return c.json({ message: (error as Error).message }, 409);
  if (code === "42703" || code === "23502")
    return c.json(
      {
        message:
          "Task database setup is missing. Run npm run db:tasks in backend.",
      },
      503,
    );
  return c.json(
    {
      message:
        "Unable to save task data. Check the backend database connection.",
    },
    503,
  );
}

export function createTaskApi(databaseFactory = getDb) {
  const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  const admin = async (c: AppContext, next: () => Promise<void>) => {
    if (actor(c).role !== "Admin")
      return c.json({ message: "Admin access required." }, 403);
    await next();
  };
  const member = async (c: AppContext, next: () => Promise<void>) => {
    if (actor(c).role !== "User")
      return c.json({ message: "Member access required." }, 403);
    await next();
  };
  const save = async (c: AppContext) => {
    const parsed = creation.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json(
        {
          message:
            "Enter task details, a valid assignee, status, and calendar date.",
        },
        400,
      );
    try {
      const input = parsed.data;
      const created = await createTask(
        databaseFactory(c.env.DATABASE_URL),
        actor(c),
        { ...input, assigneeId: input.id },
      );
      return created
        ? c.json(created, 201)
        : c.json({ message: "The assigned member no longer exists." }, 404);
    } catch (error) {
      return databaseError(c, error);
    }
  };
  router.post("/api/v1/admin/task", authMiddleware, admin, save);
  router.get("/api/v1/admin/task/:taskId", authMiddleware, admin, async (c) => {
    try {
      const task = await taskDetail(
        databaseFactory(c.env.DATABASE_URL),
        c.req.param("taskId"),
        actor(c),
      );
      return task ? c.json(task) : c.json({ message: "Task not found." }, 404);
    } catch (error) {
      return databaseError(c, error);
    }
  });
  router.put("/api/v1/admin/admincomment", authMiddleware, admin, async (c) => {
    const parsed = adminUpdate.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json({ message: "Enter a valid task and note." }, 400);
    try {
      const task = await updateTask(
        databaseFactory(c.env.DATABASE_URL),
        actor(c),
        parsed.data.taskId,
        { comments: parsed.data.comment },
      );
      return task ? c.json(task) : c.json({ message: "Task not found." }, 404);
    } catch (error) {
      return databaseError(c, error);
    }
  });
  router.delete("/api/v1/admin/delete", authMiddleware, admin, async (c) => {
    const parsed = z
      .object({ taskId: id })
      .safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: "Enter a valid task." }, 400);
    try {
      const deleted = await deleteTask(
        databaseFactory(c.env.DATABASE_URL),
        parsed.data.taskId,
      );
      return deleted
        ? c.json({ message: "Task deleted." })
        : c.json({ message: "Task not found." }, 404);
    } catch (error) {
      return databaseError(c, error);
    }
  });
  router.put("/api/v1/admin/task/:taskId", authMiddleware, admin, async (c) => {
    const parsed = z
      .object({
        description: z.string().trim().min(1).max(10000).optional(),
        dueDate: date.optional(),
        status: status.optional(),
        comments: z.string().max(20000).optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0)
      .safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json(
        { message: "Enter valid task details and a calendar date." },
        400,
      );
    try {
      const task = await updateTask(
        databaseFactory(c.env.DATABASE_URL),
        actor(c),
        c.req.param("taskId"),
        parsed.data,
      );
      return task ? c.json(task) : c.json({ message: "Task not found." }, 404);
    } catch (error) {
      return databaseError(c, error);
    }
  });
  router.get(
    "/api/v1/user/bulktask/:taskId",
    authMiddleware,
    member,
    async (c) => {
      try {
        const task = await taskDetail(
          databaseFactory(c.env.DATABASE_URL),
          c.req.param("taskId"),
          actor(c),
        );
        return task
          ? c.json(task)
          : c.json({ message: "Task not found or not assigned to you." }, 404);
      } catch (error) {
        return databaseError(c, error);
      }
    },
  );
  router.put("/api/v1/user/taskupdate", authMiddleware, member, async (c) => {
    const parsed = memberUpdate.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json(
        { message: "Only task status and progress notes can be changed." },
        400,
      );
    try {
      const { taskId, ...changes } = parsed.data;
      const task = await updateTask(
        databaseFactory(c.env.DATABASE_URL),
        actor(c),
        taskId,
        changes,
      );
      return task
        ? c.json(task)
        : c.json({ message: "Task not found or not assigned to you." }, 404);
    } catch (error) {
      return databaseError(c, error);
    }
  });
  for (const path of ["/api/v1/tasks", "/api/v1/tasks/"]) {
    router.get(path, authMiddleware, async (c) => {
      const current = actor(c);
      if (!["Admin", "User"].includes(current.role))
        return c.json({ message: "Access denied." }, 403);
      try {
        return c.json(
          await listTasks(
            databaseFactory(c.env.DATABASE_URL),
            current.role === "User" ? { userId: current.id } : {},
          ),
        );
      } catch (error) {
        return databaseError(c, error);
      }
    });
    router.post(path, authMiddleware, admin, save);
  }
  return router;
}
